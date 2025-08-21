'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter, 
  faTimes,
  faUsers, 
  faGraduationCap,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { RoleType } from '../../types';
import tracksData from '../../data/tracks.json';
import schoolsData from '../../data/schools.json';

interface ContactFiltersProps {
  onFilterChange: (filters: ContactFilterOptions) => void;
  activeFilters: ContactFilterOptions;
}

export interface ContactFilterOptions {
  roleType?: 'coordinator' | 'rep' | 'all';
  track?: string;
  year?: number;
}

const ContactFilters: React.FC<ContactFiltersProps> = ({ 
  onFilterChange, 
  activeFilters 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableTracks, setAvailableTracks] = useState<Array<{id: string, name: string, schoolId: string}>>([]);

  useEffect(() => {
    // Generate available tracks from tracks data
    const tracks: Array<{id: string, name: string, schoolId: string}> = [];
    
    Object.entries(tracksData).forEach(([schoolId, schoolTracks]) => {
      if (Array.isArray(schoolTracks)) {
        schoolTracks.forEach((trackName, index) => {
          tracks.push({
            id: `${schoolId}-track-${index}`,
            name: trackName,
            schoolId
          });
        });
      }
    });
    
    setAvailableTracks(tracks);
  }, []);

  const handleRoleFilter = (roleType: 'coordinator' | 'rep' | 'all') => {
    const newFilters = { 
      ...activeFilters, 
      roleType,
      // Clear other filters when switching roles
      track: undefined,
      year: undefined
    };
    onFilterChange(newFilters);
  };

  const handleTrackFilter = (trackId: string) => {
    const newFilters = { 
      ...activeFilters, 
      track: trackId === 'all' ? undefined : trackId 
    };
    onFilterChange(newFilters);
  };

  const handleYearFilter = (year: number) => {
    const newFilters = { 
      ...activeFilters, 
      year: year === 0 ? undefined : year 
    };
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
    setIsOpen(false);
  };

  const hasActiveFilters = activeFilters.roleType || activeFilters.track || activeFilters.year;

  const getTrackName = (trackId: string) => {
    const track = availableTracks.find(t => t.id === trackId);
    return track ? track.name : trackId;
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
          hasActiveFilters 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
        <span className="text-sm font-medium">
          {hasActiveFilters ? 'Filtered' : 'Filter'}
        </span>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10 md:hidden" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Filter Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filter Contacts</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Role Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Type
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleRoleFilter('all')}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                      !activeFilters.roleType || activeFilters.roleType === 'all'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span>All Roles</span>
                  </button>
                  
                  <button
                    onClick={() => handleRoleFilter('coordinator')}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                      activeFilters.roleType === 'coordinator'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUsers} className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Coordinators</span>
                  </button>
                  
                  <button
                    onClick={() => handleRoleFilter('rep')}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                      activeFilters.roleType === 'rep'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 mr-2 text-green-500" />
                    <span>Reps</span>
                  </button>
                </div>
              </div>

              {/* Track Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Track
                </label>
                <select
                  value={activeFilters.track || 'all'}
                  onChange={(e) => handleTrackFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tracks</option>
                  {availableTracks.map(track => {
                    const schoolName = schoolsData.find(s => s.id === track.schoolId)?.name || '';
                    return (
                      <option key={track.id} value={track.id}>
                        {track.name} ({schoolName})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={activeFilters.year || 0}
                  onChange={(e) => handleYearFilter(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>All Years</option>
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                </select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
                <div className="flex flex-wrap gap-2">
                  {activeFilters.roleType && activeFilters.roleType !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {activeFilters.roleType === 'coordinator' ? 'Coordinators' : 'Reps'}
                    </span>
                  )}
                  {activeFilters.track && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getTrackName(activeFilters.track)}
                    </span>
                  )}
                  {activeFilters.year && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Year {activeFilters.year}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ContactFilters;