'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import DirectoryFilters from '../components/directory/DirectoryFilters';
import DirectoryGrid from '../components/directory/DirectoryGrid';
import AdminPanel, { AdminPanelRef } from '../components/admin/AdminPanel';
import CoordinatorDashboard from '../components/dashboard/CoordinatorDashboard';
import LoginModal from '../components/auth/LoginModal';
import SelfRoleWizard from '../components/forms/SelfRoleWizard';
import ContactWizard from '../components/forms/ContactWizard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { DirectoryFilters as Filters, School, Track, JobHolder, RoleType } from '../types';
import { FirestoreService } from '../lib/firestore';
import { RoleService } from '../lib/roleService';
import { HierarchyService } from '../lib/hierarchy';
import schoolsData from '../data/schools.json';
import tracksData from '../data/tracks.json';

function DirectoryApp() {
  const { user, logout } = useAuth();
  const [filters, setFilters] = useState<Filters>({});
  const [schools, setSchools] = useState<School[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSelfRoleWizard, setShowSelfRoleWizard] = useState(false);
  const [showCoordinatorRepWizard, setShowCoordinatorRepWizard] = useState(false);
  const [showEditWizard, setShowEditWizard] = useState(false);
  const [editingJobHolder, setEditingJobHolder] = useState<JobHolder | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingJobHolder, setDeletingJobHolder] = useState<JobHolder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState<'admin' | 'coordinator' | 'directory'>('admin');
  const [repCreationData, setRepCreationData] = useState<{
    schoolId: string;
    trackId: string;
    year: number;
    allowSelfAssignment?: boolean;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userDashboard, setUserDashboard] = useState<{
    dashboardType: 'head' | 'coordinator' | 'rep' | 'public';
    roleInfo?: {
      role: RoleType;
      schoolId?: string;
      trackId?: string;
      year?: number;
    };
    allRoles?: Array<{
      role: RoleType;
      schoolId?: string;
      trackId?: string;
      year?: number;
    }>;
    showMultipleDashboards?: boolean;
  }>({ dashboardType: 'public' });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Convert JSON data to proper format with required fields
        const schools: School[] = schoolsData.map(school => ({
          ...school,
          tracks: [], // Tracks are loaded separately
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        // Convert tracks data - each school has tracks in the tracksData object
        const tracks: Track[] = [];
        Object.entries(tracksData).forEach(([schoolId, schoolTracks]) => {
          if (Array.isArray(schoolTracks)) {
            schoolTracks.forEach((trackName, index) => {
              tracks.push({
                id: `${schoolId}-track-${index}`,
                name: trackName,
                schoolId: schoolId,
                years: [
                  { yearNumber: 1, reps: [] },
                  { yearNumber: 2, reps: [] },
                  { yearNumber: 3, reps: [] }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
              });
            });
          }
        });

        setSchools(schools);
        setTracks(tracks);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!user?.uid) {
        setUserDashboard({ dashboardType: 'public' });
        return;
      }

      try {
        // Initialize user role if needed
        if (user.isAdmin) {
          await RoleService.initializeUserRole(user.uid, user.email);
        }

        // Get user dashboard type
        const dashboard = await RoleService.getUserDashboardType(user.uid);
        setUserDashboard(dashboard);
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserDashboard({ dashboardType: 'public' });
      }
    };

    loadUserRole();
  }, [user]);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleJobHolderChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const adminPanelRef = useRef<AdminPanelRef>(null);

  const handleEditJobHolder = (jobHolder: JobHolder) => {
    setEditingJobHolder(jobHolder);
    setShowEditWizard(true);
  };

  const handleDeleteJobHolder = (jobHolder: JobHolder) => {
    setDeletingJobHolder(jobHolder);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingJobHolder) return;
    
    try {
      setDeleteLoading(true);
      await FirestoreService.deleteJobHolder(deletingJobHolder.id);
      handleJobHolderChange();
      setShowDeleteConfirm(false);
      setDeletingJobHolder(null);
    } catch (error) {
      console.error('Error deleting job holder:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddRep = (schoolId: string, trackId: string, year: number) => {
    setRepCreationData({ 
      schoolId, 
      trackId, 
      year,
      allowSelfAssignment: userDashboard.allRoles?.some(role => role.role === RoleType.COORDINATOR && role.schoolId === schoolId) 
    });
    setShowCoordinatorRepWizard(true);
  };

  const handleAddRoleForSelf = () => {
    setShowSelfRoleWizard(true);
  };

  const handleSelfRoleAdded = async () => {
    // Refresh user dashboard and job holders
    handleJobHolderChange();
    
    // Reload user role to update dashboard type
    if (user?.uid) {
      try {
        const dashboard = await RoleService.getUserDashboardType(user.uid);
        setUserDashboard(dashboard);
      } catch (error) {
        console.error('Error reloading user role:', error);
      }
    }
  };

  const handleRemoveRepRole = async (jobHolder: JobHolder, schoolId: string, trackId: string, year: number) => {
    try {
      await RoleService.removeRoleFromUser(
        jobHolder.id,
        RoleType.REP,
        schoolId,
        trackId,
        year
      );
      handleJobHolderChange();
    } catch (error) {
      console.error('Error removing rep role:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user ? {
          displayName: user.displayName,
          email: user.email,
          isAdmin: user.isAdmin
        } : undefined}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onAddRoleForSelf={user ? handleAddRoleForSelf : undefined}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Navigation for Multi-Role Users */}
        {user && userDashboard.showMultipleDashboards && (
          <div className="bg-white border border-gray-200 rounded-lg p-1 mb-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveDashboard('admin')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDashboard === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Admin Panel
              </button>
              <button
                onClick={() => setActiveDashboard('coordinator')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDashboard === 'coordinator'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                My Coordinator View
              </button>
              <button
                onClick={() => setActiveDashboard('directory')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDashboard === 'directory'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Full Directory
              </button>
              <Link
                href="/contacts"
                className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-center"
              >
                Contacts
              </Link>
            </div>
          </div>
        )}

        {/* Head of Forum Dashboard (Admin Panel) */}
        {user && userDashboard.dashboardType === 'head' && 
         (!userDashboard.showMultipleDashboards || activeDashboard === 'admin') && (
          <AdminPanel
            ref={adminPanelRef}
            schools={schools}
            tracks={tracks}
            onJobHolderCreated={handleJobHolderChange}
            onJobHolderUpdated={handleJobHolderChange}
            onJobHolderDeleted={handleJobHolderChange}
            onEditJobHolder={handleEditJobHolder}
            onDeleteJobHolder={handleDeleteJobHolder}
          />
        )}

        {/* Coordinator Dashboard */}
        {user && (userDashboard.dashboardType === 'coordinator' || 
                  (userDashboard.showMultipleDashboards && activeDashboard === 'coordinator')) && (
          <CoordinatorDashboard 
            onAddRep={handleAddRep}
            coordinatorRole={userDashboard.allRoles?.find(role => role.role === RoleType.COORDINATOR)}
            refreshKey={refreshKey}
            onEditRep={handleEditJobHolder}
            onRemoveRepRole={handleRemoveRepRole}
          />
        )}

        {/* Directory View */}
        {(userDashboard.dashboardType === 'public' || 
          (user && (!userDashboard.showMultipleDashboards || activeDashboard === 'directory'))) && (
          <>
            <DirectoryFilters
              filters={filters}
              onFiltersChange={setFilters}
              schools={schools}
              tracks={tracks}
            />

            <DirectoryGrid
              key={refreshKey}
              filters={filters}
              isAdmin={userDashboard.dashboardType === 'head' || userDashboard.dashboardType === 'coordinator'}
              onEditJobHolder={userDashboard.dashboardType === 'head' || userDashboard.dashboardType === 'coordinator' ? handleEditJobHolder : undefined}
              onDeleteJobHolder={userDashboard.dashboardType === 'head' ? handleDeleteJobHolder : undefined}
            />
          </>
        )}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {user && (
        <SelfRoleWizard
          isOpen={showSelfRoleWizard}
          onClose={() => setShowSelfRoleWizard(false)}
          onRoleAdded={handleSelfRoleAdded}
          currentUser={{
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }}
          schools={schools}
          tracks={tracks}
        />
      )}

      {user && repCreationData && (
        <ContactWizard
          isOpen={showCoordinatorRepWizard}
          onClose={() => {
            setShowCoordinatorRepWizard(false);
            setRepCreationData(null);
          }}
          onSave={async (contactData) => {
            // Only create job holder if it's not a self-assignment dummy call
            if (contactData.name && contactData.name !== '') {
              // For reps with no email, remove email field entirely
              if (!contactData.email) {
                delete contactData.email;
              }
              
              const newJobHolderId = await FirestoreService.createJobHolder(contactData);
              
              // If this is a rep, also add to organization structure
              const repRole = contactData.roles.find(role => role.type === 'rep');
              if (repRole && repRole.schoolId && repRole.trackId && repRole.year) {
                await HierarchyService.addRepToTrack(
                  repRole.schoolId,
                  repRole.trackId, 
                  repRole.year,
                  newJobHolderId
                );
              }
            }
            handleJobHolderChange();
            setShowCoordinatorRepWizard(false);
            setRepCreationData(null);
          }}
          wizardMode="rep"
          currentUserRole={{
            role: userDashboard.roleInfo?.role || RoleType.REP,
            schoolId: repCreationData.schoolId,
            trackId: repCreationData.trackId,
            year: repCreationData.year
          }}
          allowSelfAssignment={repCreationData.allowSelfAssignment}
          currentUser={user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          } : undefined}
        />
      )}

      {user && editingJobHolder && (
        <ContactWizard
          isOpen={showEditWizard}
          onClose={() => {
            setShowEditWizard(false);
            setEditingJobHolder(null);
          }}
          onSave={async (contactData) => {
            // Update existing job holder
            await FirestoreService.updateJobHolder(editingJobHolder.id, contactData);
            handleJobHolderChange();
            setShowEditWizard(false);
            setEditingJobHolder(null);
          }}
          editingContact={editingJobHolder}
          wizardMode="edit"
          currentUserRole={{
            role: userDashboard.roleInfo?.role || RoleType.HEAD_OF_ACADEMIC_FORUM
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
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
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            
            <Button
              variant="destructive"
              icon={faTrash}
              onClick={confirmDelete}
              loading={deleteLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <DirectoryApp />
    </AuthProvider>
  );
}
