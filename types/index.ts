export interface JobHolder {
  id: string;
  name: string;
  email?: string;
  phone: string; // Will upgrade to PhoneNumber in 2-page wizard
  track: string;
  year: number;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PhoneNumber {
  countryCode: string;
  number: string;
  fullNumber: string;
}

export interface Role {
  type: RoleType | string;
  uid?: string;
  schoolId?: string;
  trackId?: string;
  year?: number;
  coordinatorInCharge?: string;
  hasBeenElected?: boolean;
}

export interface HierarchyNode {
  id: string;
  userId: string;
  role: RoleType;
  schoolId?: string;
  trackId?: string;
  year?: number;
  parentId?: string;
  children: HierarchyNode[];
  metadata: {
    maxChildren?: number;
    allowedChildTypes?: RoleType[];
  };
}

export interface OrganizationStructure {
  headOfForum: string;
  coordinators: {
    [schoolId: string]: {
      userId: string;
      tracks: {
        [trackId: string]: {
          reps: {
            [year: number]: string[];
          };
        };
      };
    };
  };
}

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export enum RoleType {
  HEAD_OF_ACADEMIC_FORUM = 'head_of_academic_forum',
  COORDINATOR = 'coordinator',
  REP = 'rep'
}

export interface School {
  id: string;
  name: string;
  coordinatorId?: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Track {
  id: string;
  name: string;
  schoolId: string;
  years: Year[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Year {
  yearNumber: number;
  reps: string[];
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface DirectoryFilters {
  schoolId?: string;
  trackId?: string;
  year?: number;
  roleType?: RoleType;
  searchQuery?: string;
}