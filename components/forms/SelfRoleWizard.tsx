'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faUserPlus, faCheckCircle, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { JobHolder, RoleType, School, Track } from '../../types';
import { FirestoreService } from '../../lib/firestore';
import { HierarchyService } from '../../lib/hierarchy';
import { auth } from '../../lib/firebase';

interface SelfRoleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleAdded: () => void;
  currentUser: {
    uid: string;
    email: string;
    displayName?: string;
  };
  schools: School[];
  tracks: Track[];
}

interface NewRoleData {
  type: RoleType;
  schoolId?: string;
  trackId?: string;
  year?: number;
  hasBeenElected?: boolean;
}

const SelfRoleWizard: React.FC<SelfRoleWizardProps> = ({
  isOpen,
  onClose,
  onRoleAdded,
  currentUser,
  schools,
  tracks
}) => {
  const [loading, setLoading] = useState(false);
  const [currentJobHolder, setCurrentJobHolder] = useState<JobHolder | null>(null);
  const [availableRoles, setAvailableRoles] = useState<RoleType[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [hasBeenElected, setHasBeenElected] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadCurrentUserData();
    }
  }, [isOpen, currentUser]);

  const loadCurrentUserData = async () => {
    try {
      setLoading(true);
      const jobHolder = await FirestoreService.getJobHolder(currentUser.uid);
      if (jobHolder) {
        setCurrentJobHolder(jobHolder);
        
        // Determine available roles based on current roles
        const currentRoleTypes = jobHolder.roles.map(role => role.type);
        const allRoles = [RoleType.COORDINATOR, RoleType.REP];
        const available = allRoles.filter(role => !currentRoleTypes.includes(role));
        
        setAvailableRoles(available);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTracksForSchool = () => {
    if (!selectedSchool) return [];
    return tracks.filter(track => track.schoolId === selectedSchool);
  };

  const handleAddRole = async () => {
    if (!selectedRole || !currentJobHolder) return;
    
    try {
      setLoading(true);
      
      const newRole: NewRoleData = {
        type: selectedRole
      };

      // Add school/track/year data for coordinator and rep roles
      if (selectedRole === RoleType.COORDINATOR && selectedSchool) {
        newRole.schoolId = selectedSchool;
        newRole.hasBeenElected = hasBeenElected;
      } else if (selectedRole === RoleType.REP && selectedSchool && selectedTrack) {
        newRole.schoolId = selectedSchool;
        newRole.trackId = selectedTrack;
        newRole.year = selectedYear;
        newRole.hasBeenElected = hasBeenElected;
      }

      // Update the job holder with new role
      const updatedRoles = [...currentJobHolder.roles, newRole];
      await FirestoreService.updateJobHolder(currentJobHolder.id, {
        ...currentJobHolder,
        roles: updatedRoles
      });

      // Update hierarchy if needed
      if (selectedRole === RoleType.COORDINATOR && selectedSchool) {
        await HierarchyService.assignCoordinator(selectedSchool, currentUser.uid);
      } else if (selectedRole === RoleType.REP && selectedSchool && selectedTrack) {
        await HierarchyService.addRepToTrack(
          selectedSchool,
          selectedTrack,
          selectedYear,
          currentUser.uid
        );
      }

      onRoleAdded();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding role:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRole(null);
    setSelectedSchool('');
    setSelectedTrack('');
    setSelectedYear(1);
    setHasBeenElected(false);
  };

  const canProceed = () => {
    if (!selectedRole) return false;
    
    if (selectedRole === RoleType.COORDINATOR) {
      return selectedSchool !== '';
    }
    
    if (selectedRole === RoleType.REP) {
      return selectedSchool !== '' && selectedTrack !== '';
    }
    
    return true;
  };

  const getRoleDisplayName = (role: RoleType | string) => {
    switch (role) {
      case RoleType.COORDINATOR:
        return 'Coordinator';
      case RoleType.REP:
        return 'Representative';
      default:
        return role;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Role for Myself"
      size="md"
      showCloseButton={!loading}
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {currentJobHolder && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Current Roles:</h3>
                <div className="space-y-2">
                  {currentJobHolder.roles.map((role, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <FontAwesomeIcon icon={faCheck} className="h-4 w-4 text-green-600" />
                      <span>
                        {getRoleDisplayName(role.type)}
                        {role.schoolId && schools.find(s => s.id === role.schoolId) && 
                          ` - ${schools.find(s => s.id === role.schoolId)?.name}`}
                        {role.trackId && tracks.find(t => t.id === role.trackId) &&
                          ` (${tracks.find(t => t.id === role.trackId)?.name})`}
                        {role.year && ` - Year ${role.year}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableRoles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon={faUserPlus} className="h-12 w-12 mb-4" />
                <p>You already have all available roles assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role to Add
                  </label>
                  <select
                    value={selectedRole || ''}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as RoleType);
                      setSelectedSchool('');
                      setSelectedTrack('');
                      setHasBeenElected(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a role...</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                </div>

                {(selectedRole === RoleType.COORDINATOR || selectedRole === RoleType.REP) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School
                    </label>
                    <select
                      value={selectedSchool}
                      onChange={(e) => {
                        setSelectedSchool(e.target.value);
                        setSelectedTrack('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select school...</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                      {schools.length === 0 && (
                        <option value="" disabled>No schools available</option>
                      )}
                    </select>
                  </div>
                )}

                {selectedRole === RoleType.REP && selectedSchool && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Track
                      </label>
                      <select
                        value={selectedTrack}
                        onChange={(e) => setSelectedTrack(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select track...</option>
                        {getAvailableTracksForSchool().map((track) => (
                          <option key={track.id} value={track.id}>
                            {track.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>Year 1</option>
                        <option value={2}>Year 2</option>
                        <option value={3}>Year 3</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Election Status Toggle for Coordinators and Reps */}
                {(selectedRole === RoleType.COORDINATOR || selectedRole === RoleType.REP) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-2" />
                      Election Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setHasBeenElected(!hasBeenElected)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${ 
                        hasBeenElected 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      <FontAwesomeIcon 
                        icon={hasBeenElected ? faCheckCircle : faToggleOff} 
                        className="h-4 w-4" 
                      />
                      <span>{hasBeenElected ? 'Elected' : 'Not Elected'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>

          {availableRoles.length > 0 && (
            <Button
              variant="primary"
              onClick={handleAddRole}
              disabled={!canProceed() || loading}
              loading={loading}
              icon={faUserPlus}
            >
              Add Role
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SelfRoleWizard;