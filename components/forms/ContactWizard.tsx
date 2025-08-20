'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PersonalInfoStep from './steps/PersonalInfoStep';
import JobRoleStep from './steps/JobRoleStep';
import { JobHolder, RoleType } from '../../types';
import tracksData from '../../data/tracks.json';
import { RoleService } from '../../lib/roleService';

interface ContactWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Omit<JobHolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingContact?: JobHolder | null;
  isAdminSetup?: boolean;
  autoAssignHead?: boolean;
  wizardMode?: 'coordinator' | 'rep' | 'edit';
  currentUserRole?: {
    role: RoleType;
    schoolId?: string;
    trackId?: string;
    year?: number;
  } | null;
  allowSelfAssignment?: boolean;
  currentUser?: {
    uid: string;
    email: string;
    displayName?: string;
  };
}

export interface ContactFormData {
  // Personal Info
  name: string;
  email: string;
  phone: {
    countryCode: string;
    number: string;
    fullNumber: string;
  };
  whatsapp: {
    sameAsPhone: boolean;
    countryCode: string;
    number: string;
    fullNumber: string;
  } | null;
  schools: string[];
  year: number;
  track: string;
  
  // Job Roles
  roles: Array<{
    type: RoleType;
    schoolId?: string;
    trackId?: string;
    year?: number;
    coordinatorInCharge?: string;
    hasBeenElected?: boolean;
  }>;
}

const ContactWizard: React.FC<ContactWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContact,
  isAdminSetup = false,
  autoAssignHead = false,
  wizardMode,
  currentUserRole,
  allowSelfAssignment = false,
  currentUser
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assignToSelf, setAssignToSelf] = useState(false);

  // Helper function to get track name by ID
  const getTrackNameById = (trackId: string) => {
    for (const [schoolId, tracks] of Object.entries(tracksData)) {
      if (Array.isArray(tracks)) {
        const trackIndex = parseInt(trackId.split('-track-')[1] || '0');
        return tracks[trackIndex] || '';
      }
    }
    return '';
  };
  const getInitialRoles = () => {
    if (autoAssignHead || isAdminSetup) {
      // For admin setup, start with head role but allow adding coordinator roles
      const roles = [{ type: RoleType.HEAD_OF_ACADEMIC_FORUM }];
      
      return roles;
    }
    
    if (wizardMode === 'coordinator') {
      return [{ type: RoleType.COORDINATOR, hasBeenElected: false }];
    }
    
    if (wizardMode === 'rep') {
      const repRole: any = { type: RoleType.REP, hasBeenElected: false };
      
      // If current user is a coordinator, auto-link the rep to them
      if (currentUserRole?.role === RoleType.COORDINATOR && currentUserRole.schoolId) {
        repRole.coordinatorInCharge = currentUserRole.schoolId;
        repRole.schoolId = currentUserRole.schoolId;
      }
      
      // Pre-populate with provided data from coordinator dashboard
      if (currentUserRole?.schoolId) {
        repRole.schoolId = currentUserRole.schoolId;
      }
      if (currentUserRole?.trackId) {
        repRole.trackId = currentUserRole.trackId;
      }
      if (currentUserRole?.year) {
        repRole.year = currentUserRole.year;
      }
      
      return [repRole];
    }
    
    return [];
  };

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: {
      countryCode: '+972',
      number: '',
      fullNumber: ''
    },
    whatsapp: null,
    schools: [],
    year: 1,
    track: '',
    roles: getInitialRoles()
  });

  const totalSteps = (autoAssignHead && !isAdminSetup) || wizardMode === 'rep' ? 1 : 2;

  // Pre-populate form when editing
  useEffect(() => {
    if (editingContact) {
      // Parse phone number
      const phoneNumber = editingContact.phone || '';
      const phoneMatch = phoneNumber.match(/^(\+\d+)(.*)$/);
      const countryCode = phoneMatch?.[1] || '+972';
      const number = phoneMatch?.[2] || phoneNumber;

      setFormData({
        name: editingContact.name || '',
        email: editingContact.email || '',
        phone: {
          countryCode,
          number: number.replace(/\s/g, ''),
          fullNumber: phoneNumber
        },
        whatsapp: null, // TODO: Extract WhatsApp if stored separately
        schools: [], // TODO: Extract schools from roles
        year: editingContact.year || 1,
        track: editingContact.track || '',
        roles: editingContact.roles.map(role => ({
          type: role.type as RoleType,
          schoolId: role.schoolId,
          trackId: role.trackId,
          year: role.year,
          coordinatorInCharge: role.coordinatorInCharge
        }))
      });
    } else {
      // Reset to initial form when not editing - including context data
      const initialRoles = getInitialRoles();
      
      // Extract context data from current user role for rep creation
      const contextSchools = wizardMode === 'rep' && currentUserRole?.schoolId ? [currentUserRole.schoolId] : [];
      const contextTrack = wizardMode === 'rep' && currentUserRole?.trackId ? getTrackNameById(currentUserRole.trackId) : '';
      const contextYear = wizardMode === 'rep' && currentUserRole?.year ? currentUserRole.year : 1;
      
      setFormData({
        name: '',
        email: '',
        phone: {
          countryCode: '+972',
          number: '',
          fullNumber: ''
        },
        whatsapp: null,
        schools: contextSchools,
        year: contextYear,
        track: contextTrack,
        roles: initialRoles
      });
    }
  }, [editingContact, wizardMode, currentUserRole]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePersonalInfoChange = (data: Partial<ContactFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleJobRoleChange = (roles: ContactFormData['roles']) => {
    setFormData(prev => ({ ...prev, roles }));
  };

  const handleQuickSelfAssign = async () => {
    if (!currentUser || !currentUserRole || !currentUserRole.schoolId || !currentUserRole.trackId || !currentUserRole.year) {
      console.error('Missing required data for self-assignment');
      return;
    }
    
    try {
      setLoading(true);
      
      // Add rep role to current user instead of creating new contact
      await RoleService.addRepRoleToUser(
        currentUser.uid,
        currentUserRole.schoolId,
        currentUserRole.trackId,
        currentUserRole.year
      );
      
      onClose();
      
      // Trigger refresh by calling parent's refresh handler
      if (onSave) {
        // Call onSave with dummy data to trigger refresh, but the role was already added above
        await onSave({
          name: '',
          email: '',
          phone: '',
          track: '',
          year: 1,
          roles: []
        });
      }
    } catch (error) {
      console.error('Error in quick self-assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // For rep mode from coordinator panel, this should create a proper rep record
      if (wizardMode === 'rep' && !assignToSelf) {
        const contactData = {
          name: formData.name || '',
          email: formData.email || '', // Allow empty email for reps
          phone: formData.phone?.fullNumber || formData.phone?.number || '',
          track: formData.track || '',
          year: formData.year || 1,
          roles: (formData.roles || []).map(role => ({
            type: role.type,
            ...(role.schoolId && { schoolId: role.schoolId }),
            ...(role.trackId && { trackId: role.trackId }),
            ...(role.year && { year: role.year }),
            ...(role.coordinatorInCharge && { coordinatorInCharge: role.coordinatorInCharge }),
            ...(role.hasBeenElected !== undefined && { hasBeenElected: role.hasBeenElected })
          }))
        };
        await onSave(contactData);
      } else if (assignToSelf && currentUser) {
        // Self-assignment: add role to existing user instead of creating new contact
        if (wizardMode === 'rep' && currentUserRole && currentUserRole.schoolId && currentUserRole.trackId && currentUserRole.year) {
          const repRole = formData.roles.find(role => role.type === 'rep');
          const hasBeenElected = repRole?.hasBeenElected || false;
          
          // Add rep role to current user with election status
          await RoleService.addRepRoleToUser(
            currentUser.uid,
            currentUserRole.schoolId,
            currentUserRole.trackId,
            currentUserRole.year,
            hasBeenElected
          );
          
          // Trigger refresh by calling parent's onSave with dummy data
          await onSave({
            name: '',
            email: '',
            phone: '',
            track: '',
            year: 1,
            roles: []
          });
        } else {
          console.error('Missing context for self-assignment');
        }
      } else {
        // Regular contact creation (coordinators, etc.)
        console.log('Regular contact creation');
        const contactData = {
          name: formData.name || '',
          email: formData.email || `placeholder-${Date.now()}@example.com`,
          phone: formData.phone?.fullNumber || formData.phone?.number || '',
          track: formData.track || '',
          year: formData.year || 1,
          roles: (formData.roles || []).map(role => ({
            type: role.type,
            ...(role.schoolId && { schoolId: role.schoolId }),
            ...(role.trackId && { trackId: role.trackId }),
            ...(role.year && { year: role.year }),
            ...(role.coordinatorInCharge && { coordinatorInCharge: role.coordinatorInCharge }),
            ...(role.hasBeenElected !== undefined && { hasBeenElected: role.hasBeenElected })
          }))
        };
        await onSave(contactData);
      }
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: {
          countryCode: '+972',
          number: '',
          fullNumber: ''
        },
        whatsapp: null,
        schools: [],
        year: 1,
        track: '',
        roles: getInitialRoles()
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      // If assigning to self, we only need role assignments
      if (assignToSelf && currentUser) {
        return formData.schools.length > 0 && formData.track && formData.year;
      }
      
      // Check if this is rep creation (email can be optional for reps)
      const isRepCreation = wizardMode === 'rep';
      
      // For reps, email and phone are optional
      if (isRepCreation) {
        return formData.name && 
               formData.schools.length > 0 && 
               formData.track &&
               formData.year;
      }
      
      // Normal validation for coordinators and admins (email required)
      return formData.name && 
             formData.email && 
             formData.phone.number && 
             formData.schools.length > 0 && 
             formData.track &&
             formData.year;
    }
    
    if (currentStep === 2) {
      return formData.roles.length > 0;
    }
    
    return false;
  };

  const getStepTitle = () => {
    if (isAdminSetup) return 'Admin Setup';
    if (editingContact) return `Edit ${editingContact.name}`;
    if (wizardMode === 'rep') return 'Add Representative';
    if (wizardMode === 'coordinator') return 'Add Coordinator';
    if (currentStep === 1) return 'Personal Information';
    if (currentStep === 2) return 'Job Roles & Positions';
    return '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getStepTitle()}
      size="lg"
      showCloseButton={!loading}
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        {totalSteps > 1 && (
          <div className="flex items-center justify-center space-x-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 < currentStep
                      ? 'bg-green-600 text-white'
                      : i + 1 === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i + 1 < currentStep ? (
                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      i + 1 < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <PersonalInfoStep
              data={formData}
              onChange={handlePersonalInfoChange}
              isAdminSetup={isAdminSetup}
              allowSelfAssignment={allowSelfAssignment}
              assignToSelf={assignToSelf}
              onAssignToSelfChange={setAssignToSelf}
              onQuickSelfAssign={handleQuickSelfAssign}
              isRepCreation={wizardMode === 'rep'}
              wizardMode={wizardMode}
              currentUser={currentUser}
            />
          )}
          
          {currentStep === 2 && !autoAssignHead && (
            <JobRoleStep
              data={formData}
              onChange={handleJobRoleChange}
              wizardMode={wizardMode}
              currentUserRole={currentUserRole}
              currentUser={currentUser}
              isAdminSetup={isAdminSetup}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            disabled={loading}
            icon={currentStep === 1 ? undefined : faArrowLeft}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <Button
            variant="primary"
            onClick={currentStep === totalSteps ? handleSubmit : handleNext}
            disabled={!canProceed() || loading}
            loading={loading && currentStep === totalSteps}
            icon={currentStep === totalSteps ? faCheck : faArrowRight}
            iconPosition="right"
          >
            {currentStep === totalSteps 
              ? (isAdminSetup ? 'Create Admin' : editingContact ? 'Update Contact' : 'Create Contact')
              : 'Next'
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ContactWizard;