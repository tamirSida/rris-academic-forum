import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faUserPlus, faUsers, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ContactWizard from '../forms/ContactWizard';
import { JobHolder, School, Track, RoleType } from '../../types';
import { FirestoreService } from '../../lib/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { HierarchyService } from '../../lib/hierarchy';
import { RoleService } from '../../lib/roleService';
import { useAuth } from '../../contexts/AuthContext';

interface AdminPanelProps {
  schools: School[];
  tracks: Track[];
  onJobHolderCreated: () => void;
  onJobHolderUpdated: () => void;
  onJobHolderDeleted: () => void;
  onEditJobHolder: (jobHolder: JobHolder) => void;
  onDeleteJobHolder: (jobHolder: JobHolder) => void;
}

export interface AdminPanelRef {
  handleEditJobHolder: (jobHolder: JobHolder) => void;
  handleDeleteJobHolder: (jobHolder: JobHolder) => void;
}

const AdminPanel = forwardRef<AdminPanelRef, AdminPanelProps>(({
  schools,
  tracks,
  onJobHolderCreated,
  onJobHolderUpdated,
  onJobHolderDeleted,
  onEditJobHolder,
  onDeleteJobHolder
}, ref) => {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [wizardType, setWizardType] = useState<'coordinator' | 'rep' | 'edit'>('coordinator');
  const [editingJobHolder, setEditingJobHolder] = useState<JobHolder | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingJobHolder, setDeletingJobHolder] = useState<JobHolder | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<{
    role: RoleType;
    schoolId?: string;
    trackId?: string;
    year?: number;
  } | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!user?.uid) return;
      
      try {
        const roleInfo = await HierarchyService.getUserRole(user.uid);
        setCurrentUserRole(roleInfo);
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };

    loadUserRole();
  }, [user?.uid]);

  const handleAddCoordinator = async () => {
    // Check if user can add coordinators
    if (!user?.uid) return;
    
    const canAdd = await RoleService.canAddCoordinator(user.uid);
    if (!canAdd) {
      alert('Only the Head of Academic Forum can add coordinators.');
      return;
    }
    
    setEditingJobHolder(null);
    setWizardType('coordinator');
    setShowWizard(true);
  };

  const handleAddRep = () => {
    setEditingJobHolder(null);
    setWizardType('rep');
    setShowWizard(true);
  };

  const handleEditJobHolder = (jobHolder: JobHolder) => {
    setEditingJobHolder(jobHolder);
    setWizardType('edit');
    setShowWizard(true);
  };

  const handleDeleteJobHolder = (jobHolder: JobHolder) => {
    setDeletingJobHolder(jobHolder);
    setShowDeleteConfirm(true);
  };

  useImperativeHandle(ref, () => ({
    handleEditJobHolder,
    handleDeleteJobHolder
  }));

  const handleSaveJobHolder = async (jobHolderData: Omit<JobHolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingJobHolder) {
        // Update existing job holder
        await FirestoreService.updateJobHolder(editingJobHolder.id, jobHolderData);
        onJobHolderUpdated();
      } else {
        // Check if this is a coordinator (needs Firebase Auth) or rep (document only)
        const isCoordinator = jobHolderData.roles.some(role => role.type === RoleType.COORDINATOR);
        
        if (isCoordinator || wizardType === 'coordinator') {
          // Create coordinator with Firebase Auth account
          await createCoordinatorWithAuth(jobHolderData);
        } else {
          // Create rep as document only
          await createRepDocument(jobHolderData);
        }
        
        onJobHolderCreated();
      }
      
      setShowWizard(false);
      setEditingJobHolder(null);
    } catch (error) {
      console.error('Error saving job holder:', error);
      throw error;
    }
  };

  const createCoordinatorWithAuth = async (jobHolderData: Omit<JobHolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempPassword = 'adminadmin';
    
    if (!jobHolderData.email) {
      throw new Error('Email is required for coordinator creation');
    }
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, jobHolderData.email, tempPassword);
    const user = userCredential.user;
    
    // Create user document with admin privileges
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: jobHolderData.email,
      displayName: jobHolderData.name,
      isAdmin: false,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });

    // Create job holder record
    await setDoc(doc(db, 'jobHolders', user.uid), {
      ...jobHolderData,
      id: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update hierarchy structure if coordinator role
    const coordinatorRole = jobHolderData.roles.find(role => role.type === RoleType.COORDINATOR);
    if (coordinatorRole?.schoolId) {
      await HierarchyService.assignCoordinator(coordinatorRole.schoolId, user.uid);
    }

    console.log(`Coordinator created with email: ${jobHolderData.email}, password: ${tempPassword}`);
  };

  const createRepDocument = async (jobHolderData: Omit<JobHolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Create document-only record for rep (no Firebase Auth)
    const docId = await FirestoreService.createJobHolder(jobHolderData);
    
    // Link rep to coordinator in hierarchy
    const repRole = jobHolderData.roles.find(role => role.type === RoleType.REP);
    if (repRole?.schoolId && repRole.trackId && repRole.year) {
      // If coordinator is adding the rep, link to themselves automatically
      let coordinatorId = repRole.coordinatorInCharge;
      if (!coordinatorId && currentUserRole?.role === RoleType.COORDINATOR) {
        coordinatorId = user?.uid;
      }
      
      await HierarchyService.addRepToTrack(
        repRole.schoolId,
        repRole.trackId,
        repRole.year,
        docId
      );
    }
  };

  const confirmDelete = async () => {
    if (!deletingJobHolder) return;

    try {
      setLoading(true);
      await FirestoreService.deleteJobHolder(deletingJobHolder.id);
      onJobHolderDeleted();
      setShowDeleteConfirm(false);
      setDeletingJobHolder(null);
    } catch (error) {
      console.error('Error deleting job holder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentUserRole?.role === RoleType.HEAD_OF_ACADEMIC_FORUM 
              ? 'Head of Academic Forum Panel' 
              : 'Coordinator Panel'
            }
          </h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {currentUserRole?.role === RoleType.HEAD_OF_ACADEMIC_FORUM && (
            <Button
              variant="primary"
              icon={faUsers}
              onClick={handleAddCoordinator}
            >
              Add Coordinator
            </Button>
          )}
          
          <Button
            variant={currentUserRole?.role === RoleType.HEAD_OF_ACADEMIC_FORUM ? 'outline' : 'primary'}
            icon={faGraduationCap}
            onClick={handleAddRep}
            className={currentUserRole?.role === RoleType.HEAD_OF_ACADEMIC_FORUM 
              ? "border-green-300 text-green-700 hover:bg-green-50"
              : ""
            }
          >
            Add Representative
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          {currentUserRole?.role === RoleType.HEAD_OF_ACADEMIC_FORUM ? (
            <>
              <strong>Coordinators</strong> get login accounts (password: adminadmin) • <strong>Reps</strong> are contact records only
            </>
          ) : (
            <>
              Add <strong>Representatives</strong> to your school • Reps are linked to you automatically
            </>
          )}
        </p>
      </div>

      <ContactWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          setEditingJobHolder(null);
        }}
        onSave={handleSaveJobHolder}
        editingContact={editingJobHolder}
        wizardMode={wizardType}
        currentUserRole={currentUserRole}
      />

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingJobHolder(null);
        }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{deletingJobHolder?.name}</span>?
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingJobHolder(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              variant="destructive"
              icon={faTrash}
              onClick={confirmDelete}
              loading={loading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

    </>
  );
});

AdminPanel.displayName = 'AdminPanel';

export default AdminPanel;