import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserTie, 
  faCrown, 
  faUsers, 
  faGraduationCap,
  faPlus,
  faTrash,
  faExclamationTriangle,
  faCheckCircle,
  faToggleOff
} from '@fortawesome/free-solid-svg-icons';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import { ContactFormData } from '../ContactWizard';
import { RoleType } from '../../../types';
import { RoleService } from '../../../lib/roleService';
import { useAuth } from '../../../contexts/AuthContext';
import schoolsData from '../../../data/schools.json';
import tracksData from '../../../data/tracks.json';

interface JobRoleStepProps {
  data: ContactFormData;
  onChange: (roles: ContactFormData['roles']) => void;
  wizardMode?: 'coordinator' | 'rep' | 'edit';
  currentUserRole?: {
    role: RoleType;
    schoolId?: string;
    trackId?: string;
    year?: number;
  } | null;
  currentUser?: {
    uid: string;
    email: string;
    displayName?: string;
  } | null;
  isAdminSetup?: boolean;
}

const JobRoleStep: React.FC<JobRoleStepProps> = ({ 
  data, 
  onChange, 
  wizardMode, 
  currentUserRole,
  currentUser,
  isAdminSetup
}) => {
  const authResult = isAdminSetup ? null : useAuth();
  const { user } = isAdminSetup ? 
    { user: currentUser || { uid: 'admin-setup-temp', email: 'admin@setup.temp', displayName: 'Admin' } } : 
    authResult;
  const [availablePositions, setAvailablePositions] = useState<{
    coordinatorPositions: Array<{
      schoolId: string;
      schoolName: string;
      isOccupied: boolean;
    }>;
    repPositions: Array<{
      schoolId: string;
      trackId: string;
      trackName: string;
      year: number;
      available: number;
    }>;
  }>({ coordinatorPositions: [], repPositions: [] });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAvailablePositions = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        if (isAdminSetup) {
          // For admin setup, provide all positions as available since we're setting up the initial structure
          const mockPositions = {
            coordinatorPositions: schoolsData.map(school => ({
              schoolId: school.id,
              schoolName: school.name,
              isOccupied: false
            })),
            repPositions: schoolsData.flatMap(school => 
              (tracksData[school.id as keyof typeof tracksData] || []).flatMap((track, trackIndex) => 
                [1, 2, 3].map(year => ({
                  schoolId: school.id,
                  trackId: `${school.id}-track-${trackIndex}`,
                  trackName: track,
                  year,
                  available: 2
                }))
              )
            )
          };
          setAvailablePositions(mockPositions);
        } else {
          const positions = await RoleService.getAuthorizedPositions(user.uid);
          setAvailablePositions(positions);
        }
      } catch (error) {
        console.error('Error loading available positions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailablePositions();
  }, [user?.uid, isAdminSetup]);

  const addRole = (roleType: RoleType) => {
    const newRole = {
      type: roleType,
      schoolId: '',
      trackId: '',
      year: 1,
      hasBeenElected: roleType === RoleType.COORDINATOR || roleType === RoleType.REP ? false : undefined
    };
    onChange([...data.roles, newRole]);
  };

  const updateRole = (index: number, updates: Partial<ContactFormData['roles'][0]>) => {
    const updatedRoles = [...data.roles];
    updatedRoles[index] = { ...updatedRoles[index], ...updates };
    onChange(updatedRoles);
  };

  const removeRole = (index: number) => {
    const updatedRoles = data.roles.filter((_, i) => i !== index);
    onChange(updatedRoles);
  };

  const getRoleIcon = (roleType: RoleType) => {
    switch (roleType) {
      case RoleType.HEAD_OF_ACADEMIC_FORUM:
        return faCrown;
      case RoleType.COORDINATOR:
        return faUsers;
      case RoleType.REP:
        return faGraduationCap;
      default:
        return faUserTie;
    }
  };

  const getRoleLabel = (roleType: RoleType) => {
    switch (roleType) {
      case RoleType.HEAD_OF_ACADEMIC_FORUM:
        return 'Head of Academic Forum';
      case RoleType.COORDINATOR:
        return 'Coordinator';
      case RoleType.REP:
        return 'Representative';
      default:
        return roleType;
    }
  };

  const getSchoolOptions = (roleType: RoleType) => {
    if (roleType === RoleType.COORDINATOR) {
      return availablePositions.coordinatorPositions
        .filter(pos => !pos.isOccupied)
        .map(pos => ({
          value: pos.schoolId,
          label: pos.schoolName
        }));
    }
    
    if (roleType === RoleType.REP) {
      const availableSchools = new Set(
        availablePositions.repPositions.map(pos => pos.schoolId)
      );
      
      return schoolsData
        .filter(school => availableSchools.has(school.id))
        .map(school => ({
          value: school.id,
          label: school.name
        }));
    }
    
    return [];
  };

  const getTrackOptions = (schoolId: string) => {
    return availablePositions.repPositions
      .filter(pos => pos.schoolId === schoolId)
      .map(pos => ({
        value: pos.trackId,
        label: pos.trackName
      }));
  };

  const getYearOptions = (schoolId: string, trackId: string) => {
    return availablePositions.repPositions
      .filter(pos => pos.schoolId === schoolId && pos.trackId === trackId)
      .map(pos => ({
        value: pos.year.toString(),
        label: `Year ${pos.year} (${pos.available} available)`
      }));
  };

  const getCoordinatorOptions = () => {
    return availablePositions.coordinatorPositions
      .filter(pos => pos.isOccupied)
      .map(pos => ({
        value: pos.schoolId,
        label: `${pos.schoolName} Coordinator`
      }));
  };

  const canAddRole = (roleType: RoleType) => {
    if (roleType === RoleType.HEAD_OF_ACADEMIC_FORUM) {
      return !data.roles.some(role => role.type === RoleType.HEAD_OF_ACADEMIC_FORUM);
    }
    
    if (roleType === RoleType.COORDINATOR) {
      // During admin setup, allow adding coordinator roles
      if (isAdminSetup) {
        return availablePositions.coordinatorPositions.some(pos => !pos.isOccupied);
      }
      
      // Only heads can add coordinators
      if (currentUserRole?.role !== RoleType.HEAD_OF_ACADEMIC_FORUM) {
        return false;
      }
      return availablePositions.coordinatorPositions.some(pos => !pos.isOccupied);
    }
    
    if (roleType === RoleType.REP) {
      return availablePositions.repPositions.length > 0;
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading available positions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Job Roles & Positions</h3>
        <p className="text-sm text-gray-600">
          Assign roles based on available positions in the academic forum hierarchy.
        </p>
      </div>

      {/* Current Roles */}
      {data.roles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Assigned Roles</h4>
          {data.roles.map((role, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon 
                    icon={getRoleIcon(role.type)} 
                    className="h-4 w-4 text-blue-600" 
                  />
                  <span className="font-medium">{getRoleLabel(role.type)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={faTrash}
                  onClick={() => removeRole(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                />
              </div>

              {role.type === RoleType.COORDINATOR && (
                <Select
                  label="School"
                  options={getSchoolOptions(RoleType.COORDINATOR)}
                  value={role.schoolId || ''}
                  onChange={(e) => updateRole(index, { schoolId: e.target.value })}
                  placeholder="Select school to coordinate"
                  fullWidth
                  required
                />
              )}

              {role.type === RoleType.REP && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="School"
                    options={getSchoolOptions(RoleType.REP)}
                    value={role.schoolId || ''}
                    onChange={(e) => updateRole(index, { 
                      schoolId: e.target.value, 
                      trackId: '', 
                      year: 1 
                    })}
                    placeholder="Select school"
                    fullWidth
                    required
                  />
                  
                  <Select
                    label="Track"
                    options={getTrackOptions(role.schoolId || '')}
                    value={role.trackId || ''}
                    onChange={(e) => updateRole(index, { 
                      trackId: e.target.value, 
                      year: 1 
                    })}
                    placeholder="Select track"
                    disabled={!role.schoolId}
                    fullWidth
                    required
                  />
                  
                  <Select
                    label="Year"
                    options={getYearOptions(role.schoolId || '', role.trackId || '')}
                    value={role.year?.toString() || ''}
                    onChange={(e) => updateRole(index, { year: parseInt(e.target.value) })}
                    placeholder="Select year"
                    disabled={!role.trackId}
                    fullWidth
                    required
                  />
                </div>
              )}

              {role.type === RoleType.REP && (
                <Select
                  label="Coordinator in Charge"
                  options={getCoordinatorOptions()}
                  value={role.coordinatorInCharge || ''}
                  onChange={(e) => updateRole(index, { coordinatorInCharge: e.target.value })}
                  placeholder="Select coordinator"
                  fullWidth
                />
              )}

              {/* Election Status Toggle for Coordinators and Reps */}
              {(role.type === RoleType.COORDINATOR || role.type === RoleType.REP) && (
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-2" />
                    Election Status
                  </label>
                  <button
                    type="button"
                    onClick={() => updateRole(index, { hasBeenElected: !role.hasBeenElected })}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${ 
                      role.hasBeenElected 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    <FontAwesomeIcon 
                      icon={role.hasBeenElected ? faCheckCircle : faToggleOff} 
                      className="h-4 w-4" 
                    />
                    <span>{role.hasBeenElected ? 'Elected' : 'Not Elected'}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Role Buttons */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Add Role</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {canAddRole(RoleType.HEAD_OF_ACADEMIC_FORUM) && (
            <Button
              variant="outline"
              onClick={() => addRole(RoleType.HEAD_OF_ACADEMIC_FORUM)}
              icon={faCrown}
              className="border-dashed border-yellow-300 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50"
              fullWidth
            >
              Head of Forum
            </Button>
          )}
          
          {canAddRole(RoleType.COORDINATOR) && (
            <Button
              variant="outline"
              onClick={() => addRole(RoleType.COORDINATOR)}
              icon={faUsers}
              className="border-dashed border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50"
              fullWidth
            >
              Coordinator
            </Button>
          )}
          
          {canAddRole(RoleType.REP) && (
            <Button
              variant="outline"
              onClick={() => addRole(RoleType.REP)}
              icon={faGraduationCap}
              className="border-dashed border-green-300 text-green-700 hover:border-green-400 hover:bg-green-50"
              fullWidth
            >
              Representative
            </Button>
          )}
        </div>
      </div>

      {/* No roles warning */}
      {data.roles.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 text-sm">
              Please assign at least one role to continue.
            </p>
          </div>
        </div>
      )}

      {/* Available positions summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-700 mb-2">Available Positions Summary</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Head of Forum:</span>
            <span className="ml-2 text-gray-600">
              {canAddRole(RoleType.HEAD_OF_ACADEMIC_FORUM) ? '1 available' : 'Occupied'}
            </span>
          </div>
          <div>
            <span className="font-medium">Coordinators:</span>
            <span className="ml-2 text-gray-600">
              {availablePositions.coordinatorPositions.filter(p => !p.isOccupied).length} available
            </span>
          </div>
          <div>
            <span className="font-medium">Rep Positions:</span>
            <span className="ml-2 text-gray-600">
              {availablePositions.repPositions.reduce((sum, pos) => sum + pos.available, 0)} available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRoleStep;