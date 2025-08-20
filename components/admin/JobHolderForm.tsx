import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faGraduationCap, faCalendarAlt, faUserTie, faSave, faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { JobHolder, RoleType, School, Track, Role } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface JobHolderFormProps {
  jobHolder?: JobHolder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobHolder: Omit<JobHolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  schools: School[];
  tracks: Track[];
}

const JobHolderForm: React.FC<JobHolderFormProps> = ({
  jobHolder,
  isOpen,
  onClose,
  onSave,
  schools,
  tracks
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    track: '',
    year: 1,
    roles: [] as Role[]
  });
  
  const [customJobTitles, setCustomJobTitles] = useState<string[]>([]);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobHolder) {
      setFormData({
        name: jobHolder.name,
        email: jobHolder.email || '',
        phone: jobHolder.phone,
        track: jobHolder.track,
        year: jobHolder.year,
        roles: jobHolder.roles
      });
      // Extract custom job titles from existing roles
      const customTitles = jobHolder.roles
        .filter(role => !Object.values(RoleType).includes(role.type as RoleType))
        .map(role => role.type);
      setCustomJobTitles(customTitles);
    } else {
      // Auto-add Head of Academic Forum for the first admin user
      // This checks if the current user is the first admin created
      const initialRoles = user?.isAdmin && !jobHolder
        ? [{ type: RoleType.HEAD_OF_ACADEMIC_FORUM }] 
        : [];
      
      setFormData({
        name: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        track: '',
        year: 1,
        roles: initialRoles
      });
      setCustomJobTitles([]);
    }
    setNewJobTitle('');
    setErrors({});
  }, [jobHolder, isOpen, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.track.trim()) {
      newErrors.track = 'Track is required';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving job holder:', error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleType: RoleType, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, { type: roleType }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        roles: prev.roles.filter(role => role.type !== roleType)
      }));
    }
  };

  const handleCustomRoleChange = (customTitle: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, { type: customTitle as any }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        roles: prev.roles.filter(role => role.type !== customTitle)
      }));
    }
  };

  const addCustomJobTitle = () => {
    if (newJobTitle.trim() && !customJobTitles.includes(newJobTitle.trim())) {
      const title = newJobTitle.trim();
      setCustomJobTitles(prev => [...prev, title]);
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, { type: title as any }]
      }));
      setNewJobTitle('');
    }
  };

  const removeCustomJobTitle = (title: string) => {
    setCustomJobTitles(prev => prev.filter(t => t !== title));
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter(role => role.type !== title)
    }));
  };

  const isRoleSelected = (roleType: RoleType | string): boolean => {
    return formData.roles.some(role => role.type === roleType);
  };

  const yearOptions = [
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={jobHolder ? 'Edit Contact' : 'Add New Contact'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            icon={faUser}
            fullWidth
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={errors.email}
            icon={faEnvelope}
            fullWidth
            required
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            error={errors.phone}
            icon={faPhone}
            fullWidth
            required
          />

          <Select
            label="Year"
            options={yearOptions}
            value={formData.year.toString()}
            onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            fullWidth
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Track"
            value={formData.track}
            onChange={(e) => setFormData(prev => ({ ...prev, track: e.target.value }))}
            error={errors.track}
            icon={faGraduationCap}
            placeholder="e.g., Computer Science, Engineering, Business, etc."
            fullWidth
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <FontAwesomeIcon icon={faUserTie} className="h-4 w-4 mr-2" />
            Roles & Job Titles
          </label>
          
          <div className="space-y-4">
            {/* Standard Roles */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Standard Roles</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isRoleSelected(RoleType.HEAD_OF_ACADEMIC_FORUM)}
                    onChange={(e) => handleRoleChange(RoleType.HEAD_OF_ACADEMIC_FORUM, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Head of Academic Forum</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isRoleSelected(RoleType.COORDINATOR)}
                    onChange={(e) => handleRoleChange(RoleType.COORDINATOR, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Coordinator</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isRoleSelected(RoleType.REP)}
                    onChange={(e) => handleRoleChange(RoleType.REP, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Representative</span>
                </label>
              </div>
            </div>

            {/* Custom Job Titles */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Custom Job Titles</h4>
              
              {/* Add new job title */}
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Enter custom job title..."
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomJobTitle())}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  icon={faPlus}
                  onClick={addCustomJobTitle}
                  disabled={!newJobTitle.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Custom job titles list */}
              {customJobTitles.length > 0 && (
                <div className="space-y-2">
                  {customJobTitles.map((title) => (
                    <div key={title} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <label className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={isRoleSelected(title)}
                          onChange={(e) => handleCustomRoleChange(title, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{title}</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={faTrash}
                        onClick={() => removeCustomJobTitle(title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {errors.roles && (
            <p className="mt-1 text-sm text-red-600">{errors.roles}</p>
          )}
        </div>

        {errors.submit && (
          <div className="text-red-600 text-sm">{errors.submit}</div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            icon={faTimes}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={faSave}
          >
            {jobHolder ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default JobHolderForm;