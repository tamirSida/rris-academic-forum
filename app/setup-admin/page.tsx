'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { auth, db } from '../../lib/firebase';
import ContactWizard from '../../components/forms/ContactWizard';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { JobHolder } from '../../types';
import { HierarchyService } from '../../lib/hierarchy';

export default function AdminSetup() {
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [step, setStep] = useState<'intro' | 'creating' | 'success' | 'error'>('intro');

  const handleCreateAdmin = async (contactData: Omit<JobHolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setStep('creating');
      setError('');

      // Extract email and create temporary password
      const email = contactData.email;
      if (!email) {
        throw new Error('Email is required for admin setup');
      }
      setAdminEmail(email);
      const tempPassword = 'adminadmin'; // User will need to change this

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const user = userCredential.user;
      
      // Create user document with admin privileges
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        displayName: contactData.name,
        isAdmin: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      // Initialize organization hierarchy with this user as head
      await HierarchyService.initializeOrganizationStructure(user.uid);

      // Create job holder record
      await setDoc(doc(db, 'jobHolders', user.uid), {
        ...contactData,
        id: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setStep('success');
      setSuccess(true);
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      setError(error.message || 'Failed to create admin user');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle level={2}>Admin User Created!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your admin account has been successfully created. You can now:
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2">
              <li>• Log in to the main application</li>
              <li>• Access the admin panel</li>
              <li>• Add and manage directory contacts</li>
              <li>• Update security rules to production settings</li>
            </ul>
            <div className="pt-4">
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
                fullWidth
              >
                Go to Main Application
              </Button>
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
              <strong>Next Steps:</strong> 
              <br />• Login with: {adminEmail}
              <br />• Temporary password: adminadmin
              <br />• Change your password after login
              <br />• Update Firestore security rules to production settings
              <br />• Delete this setup page
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle level={2}>Setup Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setStep('intro');
                setError('');
              }}
              fullWidth
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faUserShield} className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle level={2}>Admin Setup</CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Create the first admin user for the RRIS Academic Directory
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Fill out your personal information</li>
                <li>• You'll be automatically assigned as Head of Academic Forum</li>
                <li>• The organizational hierarchy will be initialized</li>
                <li>• You can then add coordinators and representatives</li>
              </ul>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowWizard(true)}
              icon={faUserShield}
              fullWidth
              disabled={loading}
            >
              Start Admin Setup
            </Button>

            <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
              <strong>Security Notice:</strong> This setup page should only be used once during initial deployment. 
              After creating your admin user, delete this page and update your Firestore security rules.
            </div>
          </CardContent>
        </Card>
      </div>

      <ContactWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSave={handleCreateAdmin}
        isAdminSetup={true}
        autoAssignHead={false}
      />
    </>
  );
}