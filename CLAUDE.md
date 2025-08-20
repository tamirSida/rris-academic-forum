# Claude Code Progress - RRIS Academic Directory

## Project Overview
Mobile-first webapp for RRIS Academic Directory with hierarchical structure:
- Head of Academic Forum → 8 Coordinators → Representatives (max 2 per year/track)
- Role-based authentication: Coordinators get Firebase Auth accounts, Reps are document-only
- Election status tracking per role

## Latest Progress Update

### ✅ Completed Features

#### Election Status System
- **Per-role election tracking**: `hasBeenElected?: boolean` in Role interface
- **PersonalInfoStep**: Election toggle for coordinator/rep creation in wizards
- **JobRoleStep**: Election toggle when admin adds roles to users  
- **SelfRoleWizard**: Election toggle in "Add Role for Myself" modal
- **JobHolderCard**: Visual "Elected" badges for coordinator/rep roles
- **Setup-admin**: 2-step wizard allowing admin to add coordinator roles with election status

#### Multi-Role System
- **Dashboard navigation**: Admin-coordinators can switch between dashboards
- **Role-specific operations**: Delete removes specific roles, not entire users
- **Self-assignment**: Coordinators can add themselves as reps with election status

#### Contact Management
- **2-step wizard**: Personal info → Job roles with context pre-population
- **Single-step rep creation**: From coordinator panel with auto-context
- **Email handling**: Optional for representatives, required for coordinators
- **Phone/WhatsApp**: Region selection with country codes

#### Technical Implementation
- **Firebase integration**: Auth + Firestore with hierarchical organization structure
- **Role-based access control**: Head → Coordinator → Rep permissions
- **Mobile-first responsive design**: Tailwind CSS + FontAwesome icons
- **TypeScript interfaces**: Comprehensive type safety

### 🔧 Current Architecture

#### Key Components
- `ContactWizard.tsx`: Multi-step contact creation/editing
- `PersonalInfoStep.tsx`: Personal details + election toggles
- `JobRoleStep.tsx`: Role assignment + election status for admins
- `SelfRoleWizard.tsx`: "Add Role for Myself" modal with election toggle
- `JobHolderCard.tsx`: Directory display with election badges
- `RoleService.ts`: Role management with election status support

#### Data Models
```typescript
interface Role {
  type: RoleType | string;
  schoolId?: string;
  trackId?: string; 
  year?: number;
  hasBeenElected?: boolean; // Per-role election status
}

interface JobHolder {
  id: string;
  name: string;
  email?: string; // Optional for reps
  phone: string;
  roles: Role[];
  // ...
}
```

## Next Tasks
- Remove Google Sign-In from login
- Add "Forgot Password" functionality
- Add password visibility toggle (eye icon)
- Test election status workflow end-to-end

## Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run typecheck` - TypeScript validation
- `npm run lint` - Code linting

## Notes
- All temporary passwords set to "adminadmin"
- Election status stored per role for multi-role scenarios
- Rep creation supports optional email (no placeholder generation)
- Self-assignment flow requires manual election status selection