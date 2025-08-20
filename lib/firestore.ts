import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { JobHolder, School, Track, User, DirectoryFilters, RoleType } from '../types';

export class FirestoreService {
  
  static toFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = Timestamp.fromDate(value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  static fromFirestoreData<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
    const data = doc.data();
    const result: any = { id: doc.id };
    
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp) {
        result[key] = value.toDate();
      } else {
        result[key] = value;
      }
    }
    
    return result as T;
  }

  static async getJobHolders(filters?: DirectoryFilters): Promise<JobHolder[]> {
    let q = query(collection(db, 'jobHolders'), orderBy('name'));
    
    if (filters?.roleType) {
      q = query(q, where('roles', 'array-contains-any', [{ type: filters.roleType }]));
    }
    
    const snapshot = await getDocs(q);
    const jobHolders = snapshot.docs.map(doc => this.fromFirestoreData<JobHolder>(doc));
    
    return jobHolders.filter(jobHolder => {
      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          jobHolder.name.toLowerCase().includes(searchLower) ||
          (jobHolder.email && jobHolder.email.toLowerCase().includes(searchLower)) ||
          jobHolder.track.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      if (filters?.year && jobHolder.year !== filters.year) return false;
      
      return true;
    });
  }

  static async getJobHolder(id: string): Promise<JobHolder | null> {
    const docRef = doc(db, 'jobHolders', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return this.fromFirestoreData<JobHolder>(snapshot);
  }

  static async createJobHolder(jobHolder: Omit<JobHolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const data = this.toFirestoreData({
      ...jobHolder,
      createdAt: now,
      updatedAt: now
    });
    
    const docRef = await addDoc(collection(db, 'jobHolders'), data);
    return docRef.id;
  }

  static async updateJobHolder(id: string, updates: Partial<Omit<JobHolder, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'jobHolders', id);
    const data = this.toFirestoreData({
      ...updates,
      updatedAt: new Date()
    });
    
    await updateDoc(docRef, data);
  }

  static async deleteJobHolder(id: string): Promise<void> {
    const docRef = doc(db, 'jobHolders', id);
    await deleteDoc(docRef);
  }

  static async getSchools(): Promise<School[]> {
    const q = query(collection(db, 'schools'), orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => this.fromFirestoreData<School>(doc));
  }

  static async getSchool(id: string): Promise<School | null> {
    const docRef = doc(db, 'schools', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return this.fromFirestoreData<School>(snapshot);
  }

  static async createSchool(school: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const data = this.toFirestoreData({
      ...school,
      createdAt: now,
      updatedAt: now
    });
    
    const docRef = await addDoc(collection(db, 'schools'), data);
    return docRef.id;
  }

  static async updateSchool(id: string, updates: Partial<Omit<School, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'schools', id);
    const data = this.toFirestoreData({
      ...updates,
      updatedAt: new Date()
    });
    
    await updateDoc(docRef, data);
  }

  static async deleteSchool(id: string): Promise<void> {
    const docRef = doc(db, 'schools', id);
    await deleteDoc(docRef);
  }

  static async getTracks(schoolId?: string): Promise<Track[]> {
    let q = query(collection(db, 'tracks'), orderBy('name'));
    
    if (schoolId) {
      q = query(q, where('schoolId', '==', schoolId));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.fromFirestoreData<Track>(doc));
  }

  static async getTrack(id: string): Promise<Track | null> {
    const docRef = doc(db, 'tracks', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return this.fromFirestoreData<Track>(snapshot);
  }

  static async createTrack(track: Omit<Track, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const data = this.toFirestoreData({
      ...track,
      createdAt: now,
      updatedAt: now
    });
    
    const docRef = await addDoc(collection(db, 'tracks'), data);
    return docRef.id;
  }

  static async updateTrack(id: string, updates: Partial<Omit<Track, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'tracks', id);
    const data = this.toFirestoreData({
      ...updates,
      updatedAt: new Date()
    });
    
    await updateDoc(docRef, data);
  }

  static async deleteTrack(id: string): Promise<void> {
    const docRef = doc(db, 'tracks', id);
    await deleteDoc(docRef);
  }

  static async getUser(uid: string): Promise<User | null> {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return this.fromFirestoreData<User>(snapshot);
  }

  static async createUser(user: Omit<User, 'createdAt' | 'lastLoginAt'>): Promise<void> {
    const now = new Date();
    const data = this.toFirestoreData({
      ...user,
      createdAt: now,
      lastLoginAt: now
    });
    
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, data);
  }

  static async updateUserLastLogin(uid: string): Promise<void> {
    const docRef = doc(db, 'users', uid);
    const data = this.toFirestoreData({
      lastLoginAt: new Date()
    });
    
    await updateDoc(docRef, data);
  }
}