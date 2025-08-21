'use client';

import { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import Header from '../../components/layout/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPhone, 
  faEnvelope,
  faArrowLeft,
  faChevronRight,
  faCrown,
  faUsers,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { FirestoreService } from '../../lib/firestore';
import { parsePhoneNumber, extractWhatsAppNumber, formatForTelLink, formatForWhatsApp } from '../../lib/phoneUtils';
import { JobHolder, RoleType } from '../../types';
import ContactFilters, { ContactFilterOptions } from '../../components/contacts/ContactFilters';
import schoolsData from '../../data/schools.json';
import tracksData from '../../data/tracks.json';

interface ContactListItem {
  id: string;
  name: string;
  highestRole: {
    type: RoleType;
    title: string;
    schoolId?: string;
    trackId?: string;
    year?: number;
  };
  allRoles: Array<{
    type: RoleType;
    title: string;
    schoolId?: string;
    trackId?: string;
    year?: number;
  }>;
  phone: string;
  whatsapp?: string;
  email?: string;
  searchTerms: string[];
}

function ContactsPageContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContactFilterOptions>({});

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const jobHolders = await FirestoreService.getJobHolders(); // No filters = get all
      const contactList = processContactsForList(jobHolders);
      setContacts(contactList);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const processContactsForList = (jobHolders: JobHolder[]): ContactListItem[] => {
    return jobHolders.map(jobHolder => {
      const allRoles = processAllRoles(jobHolder.roles);
      const highestRole = getHighestRole(jobHolder.roles);
      const searchTerms = generateSearchTerms(jobHolder, highestRole);
      const parsedPhone = parsePhoneNumber(jobHolder.phone);
      
      return {
        id: jobHolder.id,
        name: jobHolder.name,
        highestRole,
        allRoles,
        phone: parsedPhone.formatted,
        whatsapp: parsedPhone.formatted, // Same as phone for now
        email: jobHolder.email,
        searchTerms
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  const processAllRoles = (roles: any[]) => {
    const roleHierarchy = {
      [RoleType.HEAD_OF_ACADEMIC_FORUM]: { priority: 3, title: 'Head of Academic Forum' },
      [RoleType.COORDINATOR]: { priority: 2, title: 'Coordinator' },
      [RoleType.REP]: { priority: 1, title: 'Representative' }
    };

    return roles.map(role => {
      const roleInfo = roleHierarchy[role.type as RoleType];
      return {
        type: role.type,
        title: roleInfo?.title || role.type,
        schoolId: role.schoolId,
        trackId: role.trackId,
        year: role.year
      };
    }).sort((a, b) => {
      const aPriority = roleHierarchy[a.type as RoleType]?.priority || 0;
      const bPriority = roleHierarchy[b.type as RoleType]?.priority || 0;
      return bPriority - aPriority; // Highest priority first
    });
  };

  const getHighestRole = (roles: any[]) => {
    // Role hierarchy: Head > Coordinator > Rep
    const roleHierarchy = {
      [RoleType.HEAD_OF_ACADEMIC_FORUM]: { priority: 3, title: 'Head of Academic Forum' },
      [RoleType.COORDINATOR]: { priority: 2, title: 'Coordinator' },
      [RoleType.REP]: { priority: 1, title: 'Representative' }
    };

    let highestRole = roles.reduce((highest, role) => {
      const roleInfo = roleHierarchy[role.type as RoleType];
      if (roleInfo && roleInfo.priority > (highest?.priority || 0)) {
        return {
          type: role.type,
          title: roleInfo.title,
          priority: roleInfo.priority,
          schoolId: role.schoolId,
          trackId: role.trackId,
          year: role.year
        };
      }
      return highest;
    }, null);

    return highestRole || { type: RoleType.REP, title: 'Representative', priority: 1 };
  };

  const generateSearchTerms = (jobHolder: JobHolder, highestRole: any) => {
    const terms = [
      jobHolder.name.toLowerCase(),
      highestRole.title.toLowerCase(),
      highestRole.type.toLowerCase()
    ];

    // Add search terms for all roles, including rep years  
    jobHolder.roles.forEach(role => {
      terms.push(role.type.toLowerCase());
      
      // Enhanced rep year search terms
      if (role.type === 'rep' && role.year) {
        terms.push(`year ${role.year}`);
        terms.push(`${role.year}`);
        terms.push(`rep year ${role.year}`);
        terms.push(`representative year ${role.year}`);
        terms.push(`y${role.year}`); // y1, y2, y3
        terms.push(`year${role.year}`); // year1, year2, year3
        
        // Add ordinal terms
        const ordinals = { 1: 'first', 2: 'second', 3: 'third' };
        if (ordinals[role.year as keyof typeof ordinals]) {
          terms.push(ordinals[role.year as keyof typeof ordinals]);
          terms.push(`${ordinals[role.year as keyof typeof ordinals]} year`);
        }
      }
      
      if (role.schoolId) {
        const schoolName = role.schoolId.toLowerCase().replace(/-/g, ' ');
        terms.push(schoolName);
        // Add acronyms for common schools
        if (schoolName.includes('computer science')) {
          terms.push('cs', 'comp sci');
        }
        if (schoolName.includes('entrepreneurship')) {
          terms.push('entrep', 'entrepreneur');
        }
      }
    });

    if (jobHolder.email) {
      terms.push(jobHolder.email.toLowerCase());
    }

    return [...new Set(terms)]; // Remove duplicates
  };

  // Removed formatPhoneNumber and extractWhatsAppNumber - now using phoneUtils

  const getSchoolName = (schoolId: string) => {
    const school = schoolsData.find(s => s.id === schoolId);
    return school ? school.name : schoolId;
  };

  const getTrackName = (trackId: string) => {
    // Extract track name from trackId format: "school-track-index"
    const parts = trackId.split('-');
    if (parts.length >= 3) {
      const schoolId = parts[0];
      const trackIndex = parseInt(parts[parts.length - 1]);
      const schoolTracks = (tracksData as any)[schoolId];
      if (Array.isArray(schoolTracks) && schoolTracks[trackIndex]) {
        return schoolTracks[trackIndex];
      }
    }
    return trackId;
  };

  const applyFilters = (contactsList: ContactListItem[], filterOptions: ContactFilterOptions): ContactListItem[] => {
    return contactsList.filter(contact => {
      // For role type filter, check ALL roles, not just highest
      if (filterOptions.roleType && filterOptions.roleType !== 'all') {
        const hasMatchingRole = contact.allRoles.some(role => {
          if (filterOptions.roleType === 'coordinator') {
            return role.type === RoleType.COORDINATOR;
          }
          if (filterOptions.roleType === 'rep') {
            return role.type === RoleType.REP;
          }
          return false;
        });
        
        if (!hasMatchingRole) return false;
      }

      // For track/year filters, check ALL roles for matches
      if (filterOptions.track || filterOptions.year) {
        const hasMatchingCriteria = contact.allRoles.some(role => {
          // Track filter
          if (filterOptions.track && role.trackId !== filterOptions.track) {
            return false;
          }

          // Year filter (only applies to reps)
          if (filterOptions.year) {
            if (role.type !== RoleType.REP || role.year !== filterOptions.year) {
              return false;
            }
          }

          return true;
        });

        if (!hasMatchingCriteria) return false;
      }

      return true;
    });
  };

  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Apply filters first
    result = applyFilters(result, filters);

    // Then apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contact => 
        contact.searchTerms.some(term => term.includes(query))
      );
    }

    return result;
  }, [contacts, filters, searchQuery]);

  const getRoleIcon = (roleType: RoleType) => {
    switch (roleType) {
      case RoleType.HEAD_OF_ACADEMIC_FORUM:
        return faCrown;
      case RoleType.COORDINATOR:
        return faUsers;
      case RoleType.REP:
        return faGraduationCap;
      default:
        return faGraduationCap;
    }
  };

  const getRoleColor = (roleType: RoleType) => {
    switch (roleType) {
      case RoleType.HEAD_OF_ACADEMIC_FORUM:
        return 'text-yellow-600';
      case RoleType.COORDINATOR:
        return 'text-blue-600';
      case RoleType.REP:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleDisplayText = (role: any) => {
    if (role.type === RoleType.HEAD_OF_ACADEMIC_FORUM) {
      return 'Head of Academic Forum';
    }
    
    if (role.type === RoleType.COORDINATOR) {
      const schoolName = role.schoolId ? getSchoolName(role.schoolId) : '';
      return `Coordinator${schoolName ? ` - ${schoolName}` : ''}`;
    }
    
    if (role.type === RoleType.REP) {
      let displayText = '';
      
      if (role.year) {
        displayText += `Year ${role.year} `;
      }
      
      displayText += 'Rep';
      
      if (role.trackId) {
        const trackName = getTrackName(role.trackId);
        displayText += ` - ${trackName}`;
      }
      
      return displayText;
    }
    
    return role.title || role.type;
  };

  const handleContactClick = (contact: ContactListItem) => {
    setSelectedContact(contact);
  };

  const handleBackToList = () => {
    setSelectedContact(null);
  };

  const handleBackToDashboard = () => {
    router.back();
  };

  const handlePhoneCall = (phoneNumber: string) => {
    const telLink = formatForTelLink(phoneNumber);
    window.location.href = `tel:${telLink}`;
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const whatsappNumber = formatForWhatsApp(phoneNumber);
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (selectedContact) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Contact Detail View */}
        <div className="bg-white">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200">
            <button
              onClick={handleBackToList}
              className="p-2 -ml-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            </button>
            <h1 className="ml-3 text-lg font-semibold text-gray-900">Contact</h1>
          </div>

          {/* Contact Info */}
          <div className="p-6 text-center border-b border-gray-200">
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-semibold text-gray-600">
                {selectedContact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedContact.name}
            </h2>
            
            <div className="space-y-2">
              {selectedContact.allRoles.map((role, index) => (
                <div key={index} className="flex items-center justify-center space-x-2 text-sm">
                  <FontAwesomeIcon 
                    icon={getRoleIcon(role.type)} 
                    className={`h-4 w-4 ${getRoleColor(role.type)}`}
                  />
                  <span className="text-gray-600">{getRoleDisplayText(role)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-1">
            {selectedContact.phone && (
              <button
                onClick={() => handlePhoneCall(selectedContact.phone)}
                className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faPhone} className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-gray-500">mobile</p>
                  <p className="text-base text-gray-900">{selectedContact.phone}</p>
                </div>
              </button>
            )}

            {selectedContact.whatsapp && (
              <button
                onClick={() => handleWhatsApp(selectedContact.whatsapp!)}
                className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="text-base text-gray-900">{selectedContact.whatsapp}</p>
                </div>
              </button>
            )}

            {selectedContact.email && (
              <button
                onClick={() => handleEmail(selectedContact.email!)}
                className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-gray-500">email</p>
                  <p className="text-base text-gray-900">{selectedContact.email}</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user ? {
          displayName: user.displayName,
          email: user.email,
          isAdmin: user.isAdmin
        } : undefined}
        onLogin={() => {}}
        onLogout={logout}
        userDashboard={{ dashboardType: 'public' }}
      />
      
      <div className="bg-white min-h-screen">
        {/* Contacts List View */}
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 -ml-2 mr-3 text-blue-600 hover:bg-blue-50 rounded-lg md:hidden"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Quick Action Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilters({})}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filters.roleType && !filters.track && !filters.year
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              All
            </button>
            
            <button
              onClick={() => setFilters({ roleType: 'coordinator' })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filters.roleType === 'coordinator'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Coordinators
            </button>
            
            <button
              onClick={() => setFilters({ roleType: 'rep' })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filters.roleType === 'rep'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Reps
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="flex justify-end">
            <ContactFilters
              onFilterChange={setFilters}
              activeFilters={filters}
            />
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? 'No contacts found' : 'No contacts available'}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleContactClick(contact)}
              className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors text-left min-h-[120px]"
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-600">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Contact Info */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-900 truncate">
                  {contact.name}
                </p>
                <div className="space-y-1">
                  {contact.allRoles.slice(0, 3).map((role, index) => {
                    const roleDisplay = getRoleDisplayText(role);
                    return (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-500">
                        <FontAwesomeIcon 
                          icon={getRoleIcon(role.type)} 
                          className={`h-3 w-3 ${getRoleColor(role.type)}`}
                        />
                        <span className="truncate">{roleDisplay}</span>
                      </div>
                    );
                  })}
                  {contact.allRoles.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{contact.allRoles.length - 3} more role{contact.allRoles.length - 3 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chevron */}
              <FontAwesomeIcon 
                icon={faChevronRight} 
                className="h-4 w-4 text-gray-400 ml-2" 
              />
            </button>
          ))
        )}
      </div>
    </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <AuthProvider>
      <ContactsPageContent />
    </AuthProvider>
  );
}