# RRIS Academic Directory - Setup Guide

## 🚀 Quick Start

### Step 1: Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `vb-alumni-cf41d`
3. Ensure these services are enabled:
   - **Authentication** (Email/Password + Google)
   - **Firestore Database**

### Step 2: Apply Temporary Security Rules
In **Firestore Database → Rules**, paste this temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Run the Application
```bash
npm run dev
```

### Step 4: Create Admin User
1. Visit: `http://localhost:3000/setup-admin`
2. Click **"Start Admin Setup"**
3. Fill out the form:
   - **Name**: Your full name
   - **Email**: Your email
   - **Phone**: Select country (🇮🇱 +972 Israel) and enter number
   - **WhatsApp**: Toggle "same as phone" or enter different
   - **Schools**: Select up to 2 (e.g., Computer Science, Business)
   - **Year**: Select 1, 2, or 3
   - **Track**: Will populate based on schools selected
4. Click **"Create Admin"**

### Step 5: Login & Test
1. Go to main page: `http://localhost:3000/`
2. Login with:
   - **Email**: [the email you entered]
   - **Password**: `adminadmin`
3. Change your password after first login
4. You should see the **Head of Academic Forum dashboard**

---

## 🏗️ System Architecture

### Hierarchical Structure
```
Head of Academic Forum (YOU)
├── Coordinator (Computer Science) - [Empty slot]
├── Coordinator (Business) - [Empty slot]  
├── Coordinator (Economics) - [Empty slot]
├── Coordinator (Psychology) - [Empty slot]
├── Coordinator (Sustainability) - [Empty slot]
├── Coordinator (Government) - [Empty slot]
├── Coordinator (Communications) - [Empty slot]
└── Coordinator (Entrepreneurship) - [Empty slot]
```

Each coordinator can have multiple tracks with up to 2 reps per year (6 total per track).

### User Roles & Views
- **Head of Forum**: Full admin panel, can manage all positions
- **Coordinator**: Dashboard showing only their school's representatives  
- **Rep**: Limited view (future enhancement)
- **Public**: Read-only directory access

---

## 🔧 Features Implemented

### ✅ 2-Page Contact Creation Wizard
- **Page 1**: Personal info with phone/WhatsApp region selection
- **Page 2**: Job role assignment (skipped for admin setup)
- Smart form validation and progress tracking

### ✅ Role-Based Dashboards  
- Different UI based on user role
- Coordinators see only their school's reps
- Head sees full admin controls

### ✅ Smart Permissions
- Coordinators can only add reps to their school
- Maximum 2 reps per year per track enforced
- Automatic hierarchy initialization

### ✅ Enhanced Contact Management
- Edit/delete functionality working
- Mobile-first responsive design
- FontAwesome icons throughout
- Real-time directory updates

---

## 🔒 Security Setup (After Testing)

Once everything works, update Firestore rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Job holders - public read, admin write
    match /jobHolders/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Organization structure - public read, admin write  
    match /organization/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Users - own data only
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Helper function
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## 🐛 Common Issues

### Firebase 400 Error
If you see token errors, check:
- Firebase configuration in `.env.local`
- Authentication methods enabled
- Project permissions

### Key Conflict Errors
Fixed! Country codes now use unique identifiers.

### Build Errors
All TypeScript issues resolved. Build should pass cleanly.

---

## 📱 Testing Checklist

- [ ] Admin setup completes successfully
- [ ] Login works with temporary password
- [ ] Head dashboard shows admin panel
- [ ] Add contact wizard opens and works
- [ ] Edit/delete buttons function
- [ ] Mobile responsive design works
- [ ] Country/phone selection works
- [ ] WhatsApp toggle functions

Ready to test! 🎉