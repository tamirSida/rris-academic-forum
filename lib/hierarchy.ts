import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';
import { HierarchyNode, OrganizationStructure, RoleType, JobHolder } from '../types';
import schoolsData from '../data/schools.json';
import tracksData from '../data/tracks.json';

export class HierarchyService {
  
  static async initializeOrganizationStructure(headUserId: string): Promise<void> {
    const structure: OrganizationStructure = {
      headOfForum: headUserId,
      coordinators: {}
    };

    // Initialize coordinator slots for each school
    schoolsData.forEach(school => {
      structure.coordinators[school.id] = {
        userId: '',
        tracks: {}
      };

      // Initialize track slots for each school
      const schoolTracks = tracksData[school.id as keyof typeof tracksData] || [];
      schoolTracks.forEach((track, index) => {
        const trackId = `${school.id}-track-${index}`;
        structure.coordinators[school.id].tracks[trackId] = {
          reps: {
            1: [],
            2: [],
            3: []
          }
        };
      });
    });

    await setDoc(doc(db, 'organization', 'structure'), structure);
  }

  static async getOrganizationStructure(): Promise<OrganizationStructure | null> {
    const docRef = doc(db, 'organization', 'structure');
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return snapshot.data() as OrganizationStructure;
  }

  static async assignCoordinator(schoolId: string, userId: string): Promise<void> {
    const structure = await this.getOrganizationStructure();
    if (!structure) throw new Error('Organization structure not initialized');

    structure.coordinators[schoolId].userId = userId;
    
    await updateDoc(doc(db, 'organization', 'structure'), {
      [`coordinators.${schoolId}.userId`]: userId
    });
  }

  static async addRepToTrack(
    schoolId: string, 
    trackId: string, 
    year: number, 
    repUserId: string
  ): Promise<void> {
    const structure = await this.getOrganizationStructure();
    if (!structure) throw new Error('Organization structure not initialized');

    const trackReps = structure.coordinators[schoolId]?.tracks[trackId]?.reps[year] || [];
    
    if (trackReps.length >= 2) {
      throw new Error(`Track ${trackId} Year ${year} already has maximum 2 representatives`);
    }

    trackReps.push(repUserId);
    
    await updateDoc(doc(db, 'organization', 'structure'), {
      [`coordinators.${schoolId}.tracks.${trackId}.reps.${year}`]: trackReps
    });
  }

  static async removeRepFromTrack(
    schoolId: string, 
    trackId: string, 
    year: number, 
    repUserId: string
  ): Promise<void> {
    const structure = await this.getOrganizationStructure();
    if (!structure) throw new Error('Organization structure not initialized');

    const trackReps = structure.coordinators[schoolId]?.tracks[trackId]?.reps[year] || [];
    const updatedReps = trackReps.filter(id => id !== repUserId);
    
    await updateDoc(doc(db, 'organization', 'structure'), {
      [`coordinators.${schoolId}.tracks.${trackId}.reps.${year}`]: updatedReps
    });
  }

  static async getUserRole(userId: string): Promise<{
    role: RoleType;
    schoolId?: string;
    trackId?: string;
    year?: number;
  } | null> {
    const structure = await this.getOrganizationStructure();
    if (!structure) return null;

    // Check if head of forum
    if (structure.headOfForum === userId) {
      return { role: RoleType.HEAD_OF_ACADEMIC_FORUM };
    }

    // Check if coordinator
    for (const [schoolId, coordinator] of Object.entries(structure.coordinators)) {
      if (coordinator.userId === userId) {
        return { role: RoleType.COORDINATOR, schoolId };
      }

      // Check if rep
      for (const [trackId, track] of Object.entries(coordinator.tracks)) {
        for (const [year, reps] of Object.entries(track.reps)) {
          if (reps.includes(userId)) {
            return { 
              role: RoleType.REP, 
              schoolId, 
              trackId, 
              year: parseInt(year) 
            };
          }
        }
      }
    }

    return null;
  }

  static async getCoordinatorReps(userId: string): Promise<{
    schoolId: string;
    tracks: {
      [trackId: string]: {
        name: string;
        reps: {
          [year: number]: JobHolder[];
        };
      };
    };
  } | null> {
    const structure = await this.getOrganizationStructure();
    if (!structure) return null;

    // Find coordinator's school
    let coordinatorSchoolId = '';
    for (const [schoolId, coordinator] of Object.entries(structure.coordinators)) {
      if (coordinator.userId === userId) {
        coordinatorSchoolId = schoolId;
        break;
      }
    }

    if (!coordinatorSchoolId) return null;

    const coordinator = structure.coordinators[coordinatorSchoolId];
    const result = {
      schoolId: coordinatorSchoolId,
      tracks: {} as any
    };

    // Get job holders for each rep
    for (const [trackId, track] of Object.entries(coordinator.tracks)) {
      const trackName = this.getTrackName(coordinatorSchoolId, trackId);
      result.tracks[trackId] = {
        name: trackName,
        reps: {}
      };

      for (const [year, repIds] of Object.entries(track.reps)) {
        const reps: JobHolder[] = [];
        for (const repId of repIds) {
          // Get job holder data
          const jobHolder = await this.getJobHolderById(repId);
          if (jobHolder) reps.push(jobHolder);
        }
        result.tracks[trackId].reps[parseInt(year)] = reps;
      }
    }

    return result;
  }

  static getTrackName(schoolId: string, trackId: string): string {
    const schoolTracks = tracksData[schoolId as keyof typeof tracksData] || [];
    const trackIndex = parseInt(trackId.split('-track-')[1]);
    return schoolTracks[trackIndex] || trackId;
  }

  static async getJobHolderById(userId: string): Promise<JobHolder | null> {
    try {
      const docRef = doc(db, 'jobHolders', userId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) return null;
      
      const data = snapshot.data();
      return { 
        id: snapshot.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as JobHolder;
    } catch (error) {
      console.error('Error fetching job holder:', error);
      return null;
    }
  }

  static async getAvailableCoordinatorPositions(): Promise<Array<{
    schoolId: string;
    schoolName: string;
    isOccupied: boolean;
  }>> {
    const structure = await this.getOrganizationStructure();
    if (!structure) return [];

    return schoolsData.map(school => ({
      schoolId: school.id,
      schoolName: school.name,
      isOccupied: !!structure.coordinators[school.id]?.userId
    }));
  }

  static async getAvailableRepPositions(schoolId: string): Promise<Array<{
    trackId: string;
    trackName: string;
    year: number;
    available: number;
  }>> {
    const structure = await this.getOrganizationStructure();
    if (!structure) return [];

    const coordinator = structure.coordinators[schoolId];
    if (!coordinator) return [];

    const positions: Array<{
      trackId: string;
      trackName: string;
      year: number;
      available: number;
    }> = [];

    for (const [trackId, track] of Object.entries(coordinator.tracks)) {
      const trackName = this.getTrackName(schoolId, trackId);
      
      for (let year = 1; year <= 3; year++) {
        const currentReps = track.reps[year] || [];
        const available = 2 - currentReps.length;
        
        if (available > 0) {
          positions.push({
            trackId,
            trackName,
            year,
            available
          });
        }
      }
    }

    return positions;
  }
}