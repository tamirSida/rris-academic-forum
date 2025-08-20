import { HierarchyService } from './hierarchy';
import { RoleType } from '../types';

export class RoleService {
  
  static async initializeUserRole(userId: string, userEmail: string): Promise<void> {
    // Check if this is the first admin (head of forum)
    const structure = await HierarchyService.getOrganizationStructure();
    
    if (!structure) {
      // Initialize structure with this user as head
      await HierarchyService.initializeOrganizationStructure(userId);
      console.log('Initialized organization structure with head:', userId);
    }
  }

  static async getUserDashboardType(userId: string): Promise<{
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
  }> {
    const allRoles = await this.getAllUserRoles(userId);
    
    if (allRoles.length === 0) {
      return { dashboardType: 'public' };
    }

    // Determine primary dashboard based on role hierarchy
    const hasHead = allRoles.some(role => role.role === RoleType.HEAD_OF_ACADEMIC_FORUM);
    const hasCoordinator = allRoles.some(role => role.role === RoleType.COORDINATOR);
    const hasRep = allRoles.some(role => role.role === RoleType.REP);

    // Primary dashboard is Head if they have that role
    let primaryRole = allRoles[0];
    if (hasHead) {
      primaryRole = allRoles.find(role => role.role === RoleType.HEAD_OF_ACADEMIC_FORUM)!;
    }

    // Show multiple dashboards if Head also has Coordinator role
    const showMultipleDashboards = hasHead && hasCoordinator;

    return {
      dashboardType: hasHead ? 'head' : hasCoordinator ? 'coordinator' : 'rep',
      roleInfo: primaryRole,
      allRoles,
      showMultipleDashboards
    };
  }

  static async getAllUserRoles(userId: string): Promise<Array<{
    role: RoleType;
    schoolId?: string;
    trackId?: string;
    year?: number;
  }>> {
    const structure = await HierarchyService.getOrganizationStructure();
    if (!structure) return [];

    const roles: Array<{
      role: RoleType;
      schoolId?: string;
      trackId?: string;
      year?: number;
    }> = [];

    // Check if head of forum
    if (structure.headOfForum === userId) {
      roles.push({ role: RoleType.HEAD_OF_ACADEMIC_FORUM });
    }

    // Check if coordinator
    for (const [schoolId, coordinator] of Object.entries(structure.coordinators)) {
      if (coordinator.userId === userId) {
        roles.push({ role: RoleType.COORDINATOR, schoolId });
      }

      // Check if rep
      for (const [trackId, track] of Object.entries(coordinator.tracks)) {
        for (const [year, reps] of Object.entries(track.reps)) {
          if (reps.includes(userId)) {
            roles.push({ 
              role: RoleType.REP, 
              schoolId, 
              trackId, 
              year: parseInt(year) 
            });
          }
        }
      }
    }

    return roles;
  }

  static async canAddRepToPosition(
    currentUserId: string, 
    targetSchoolId: string, 
    targetTrackId: string, 
    targetYear: number
  ): Promise<boolean> {
    const userRole = await HierarchyService.getUserRole(currentUserId);
    
    if (!userRole) return false;

    // Head of forum can add reps anywhere
    if (userRole.role === RoleType.HEAD_OF_ACADEMIC_FORUM) {
      return true;
    }

    // Coordinators can only add reps to their own school
    if (userRole.role === RoleType.COORDINATOR && userRole.schoolId === targetSchoolId) {
      return true;
    }

    return false;
  }

  static async canAddCoordinator(currentUserId: string): Promise<boolean> {
    const userRole = await HierarchyService.getUserRole(currentUserId);
    return userRole?.role === RoleType.HEAD_OF_ACADEMIC_FORUM;
  }

  static async addRepRoleToUser(
    userId: string,
    schoolId: string,
    trackId: string, 
    year: number,
    hasBeenElected: boolean = false
  ): Promise<void> {
    // Add to organization structure
    await HierarchyService.addRepToTrack(schoolId, trackId, year, userId);
    
    // Also update the JobHolder document to include the new role
    const { FirestoreService } = await import('./firestore');
    
    // Get existing job holder (userId is the same as jobHolder document ID)
    const jobHolder = await FirestoreService.getJobHolder(userId);
    
    if (jobHolder) {
      // Add the new rep role
      const newRole = {
        type: 'rep' as const,
        schoolId,
        trackId,
        year,
        hasBeenElected
      };
      
      // Check if this exact role already exists
      const roleExists = jobHolder.roles.some(role => 
        role.type === 'rep' && 
        role.schoolId === schoolId && 
        role.trackId === trackId && 
        role.year === year
      );
      
      if (!roleExists) {
        const updatedRoles = [...jobHolder.roles, newRole];
        await FirestoreService.updateJobHolder(jobHolder.id, { roles: updatedRoles });
      }
    } else {
      console.error('Job holder not found for userId:', userId);
    }
  }

  static async removeRoleFromUser(
    userId: string,
    roleType: RoleType,
    schoolId?: string,
    trackId?: string,
    year?: number
  ): Promise<void> {
    const { FirestoreService } = await import('./firestore');
    
    // Get existing job holder
    const jobHolder = await FirestoreService.getJobHolder(userId);
    
    if (jobHolder) {
      // Remove the specific role
      const updatedRoles = jobHolder.roles.filter(role => {
        if (role.type !== roleType) return true;
        if (schoolId && role.schoolId !== schoolId) return true;
        if (trackId && role.trackId !== trackId) return true;
        if (year && role.year !== year) return true;
        return false; // This is the role to remove
      });
      
      await FirestoreService.updateJobHolder(jobHolder.id, { roles: updatedRoles });
      
      // Also remove from organization structure if it's a rep role
      if (roleType === RoleType.REP && schoolId && trackId && year) {
        await HierarchyService.removeRepFromTrack(schoolId, trackId, year, userId);
      }
      
      // Remove from organization structure if it's a coordinator role
      if (roleType === RoleType.COORDINATOR && schoolId) {
        // Clear the coordinator position
        await HierarchyService.assignCoordinator(schoolId, '');
      }
    }
  }

  static async getAuthorizedPositions(userId: string): Promise<{
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
  }> {
    const userRole = await HierarchyService.getUserRole(userId);
    
    let coordinatorPositions: any[] = [];
    let repPositions: any[] = [];

    if (userRole?.role === RoleType.HEAD_OF_ACADEMIC_FORUM) {
      // Head can see all positions
      coordinatorPositions = await HierarchyService.getAvailableCoordinatorPositions();
      
      // Get rep positions for all schools
      for (const pos of coordinatorPositions) {
        const schoolRepPositions = await HierarchyService.getAvailableRepPositions(pos.schoolId);
        repPositions.push(...schoolRepPositions.map(rep => ({
          schoolId: pos.schoolId,
          ...rep
        })));
      }
    } else if (userRole?.role === RoleType.COORDINATOR && userRole.schoolId) {
      // Coordinator can only see their school's rep positions
      repPositions = await HierarchyService.getAvailableRepPositions(userRole.schoolId);
      repPositions = repPositions.map(rep => ({
        schoolId: userRole.schoolId!,
        ...rep
      }));
    }

    return {
      coordinatorPositions,
      repPositions
    };
  }
}