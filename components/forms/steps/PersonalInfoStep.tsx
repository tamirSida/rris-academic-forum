import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faGraduationCap, 
  faCalendarAlt,
  faSchool,
  faToggleOn,
  faToggleOff,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { ContactFormData } from '../ContactWizard';
import schoolsData from '../../../data/schools.json';
import countriesData from '../../../data/countries.json';
import tracksData from '../../../data/tracks.json';

interface PersonalInfoStepProps {
  data: ContactFormData;
  onChange: (data: Partial<ContactFormData>) => void;
  isAdminSetup?: boolean;
  allowSelfAssignment?: boolean;
  assignToSelf?: boolean;
  onAssignToSelfChange?: (assign: boolean) => void;
  onQuickSelfAssign?: () => void;
  isRepCreation?: boolean;
  wizardMode?: 'coordinator' | 'rep' | 'edit';
  currentUser?: {
    uid: string;
    email: string;
    displayName?: string;
  };
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  data,
  onChange,
  isAdminSetup = false,
  allowSelfAssignment = false,
  assignToSelf = false,
  onAssignToSelfChange,
  onQuickSelfAssign,
  isRepCreation = false,
  wizardMode,
  currentUser
}) => {
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);

  const handlePhoneChange = (field: 'countryCode' | 'number', value: string) => {
    let countryCode = value;
    
    // If changing country code, extract dial code from combined value
    if (field === 'countryCode' && value.includes('|')) {
      countryCode = value.split('|')[1];
    }
    
    const updatedPhone = {
      ...data.phone,
      [field]: field === 'countryCode' ? countryCode : value,
      fullNumber: field === 'countryCode' 
        ? `${countryCode}${data.phone.number}`
        : `${data.phone.countryCode}${value}`
    };

    onChange({ phone: updatedPhone });

    // Auto-update WhatsApp if same as phone
    if (whatsappSameAsPhone) {
      onChange({
        whatsapp: {
          sameAsPhone: true,
          ...updatedPhone
        }
      });
    }
  };

  const handleWhatsappToggle = () => {
    const newSameAsPhone = !whatsappSameAsPhone;
    setWhatsappSameAsPhone(newSameAsPhone);

    if (newSameAsPhone) {
      onChange({
        whatsapp: {
          sameAsPhone: true,
          ...data.phone
        }
      });
    } else {
      onChange({
        whatsapp: {
          sameAsPhone: false,
          countryCode: '+972',
          number: '',
          fullNumber: ''
        }
      });
    }
  };

  const handleWhatsappChange = (field: 'countryCode' | 'number', value: string) => {
    if (whatsappSameAsPhone) return;

    let countryCode = value;
    
    // If changing country code, extract dial code from combined value
    if (field === 'countryCode' && value.includes('|')) {
      countryCode = value.split('|')[1];
    }

    const updatedWhatsapp = {
      ...data.whatsapp!,
      sameAsPhone: false,
      [field]: field === 'countryCode' ? countryCode : value,
      fullNumber: field === 'countryCode' 
        ? `${countryCode}${data.whatsapp?.number || ''}`
        : `${data.whatsapp?.countryCode || '+972'}${value}`
    };

    onChange({ whatsapp: updatedWhatsapp });
  };

  const handleSchoolChange = (schoolId: string, checked: boolean) => {
    let updatedSchools = [...data.schools];
    
    if (checked) {
      if (updatedSchools.length < 2) {
        updatedSchools.push(schoolId);
      }
    } else {
      updatedSchools = updatedSchools.filter(id => id !== schoolId);
    }
    
    onChange({ schools: updatedSchools });
  };

  const getAvailableTracks = () => {
    if (data.schools.length === 0) return [];
    
    // Get tracks for selected schools
    const allTracks: string[] = [];
    data.schools.forEach(schoolId => {
      const schoolTracks = tracksData[schoolId as keyof typeof tracksData] || [];
      allTracks.push(...schoolTracks);
    });
    
    // Remove duplicates
    return [...new Set(allTracks)];
  };

  const countryOptions = countriesData.map(country => ({
    value: `${country.code}|${country.dialCode}`, // Unique value combining code and dial
    label: `${country.flag} ${country.dialCode} ${country.name}`
  }));

  const yearOptions = [
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' }
  ];

  const getCountrySelectValue = (dialCode: string) => {
    const country = countriesData.find(c => c.dialCode === dialCode);
    return country ? `${country.code}|${country.dialCode}` : `IL|${dialCode}`;
  };

  const handleElectedToggle = (roleIndex: number, elected: boolean) => {
    const updatedRoles = data.roles.map((role, index) => 
      index === roleIndex ? { ...role, hasBeenElected: elected } : role
    );
    onChange({ roles: updatedRoles });
  };

  return (
    <div className="space-y-6">
      {isAdminSetup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Setting up admin account:</strong> You will automatically be assigned as Head of Academic Forum.
          </p>
        </div>
      )}

      {allowSelfAssignment && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="assignToSelf"
              checked={assignToSelf}
              onChange={(e) => {
                onAssignToSelfChange?.(e.target.checked);
              }}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="assignToSelf" className="text-green-800 text-sm cursor-pointer">
              <strong>Add myself as representative</strong> - Auto-populate form with my details
            </label>
          </div>
          {currentUser && assignToSelf && (
            <div className="mt-3 text-sm text-green-700 bg-green-100 rounded p-2">
              <p>✓ Will use: {currentUser.displayName || currentUser.email}</p>
              <p className="text-xs text-green-600 mt-1">Form auto-populated. Set election status below and click "Create Contact"</p>
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={assignToSelf && currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          icon={faUser}
          placeholder="Enter your full name"
          fullWidth
          required
          disabled={assignToSelf}
        />

        <Input
          label="Email Address"
          type="email"
          value={assignToSelf && currentUser ? currentUser.email : data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          icon={faEnvelope}
          placeholder={isRepCreation ? "Optional - your.email@example.com" : "your.email@example.com"}
          fullWidth
          required={!isRepCreation}
          disabled={assignToSelf}
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FontAwesomeIcon icon={faPhone} className="h-4 w-4 mr-2" />
          Phone Number *
        </label>
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-2">
            <Select
              options={countryOptions}
              value={getCountrySelectValue(data.phone.countryCode)}
              onChange={(e) => handlePhoneChange('countryCode', e.target.value)}
              placeholder="Country"
              fullWidth
              required
            />
          </div>
          <div className="col-span-3">
            <Input
              value={data.phone.number}
              onChange={(e) => handlePhoneChange('number', e.target.value)}
              placeholder="Phone number"
              fullWidth
              required
            />
          </div>
        </div>
        {data.phone.fullNumber && (
          <p className="text-sm text-gray-500 mt-1">Full number: {data.phone.fullNumber}</p>
        )}
      </div>

      {/* WhatsApp */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            WhatsApp Number
          </label>
          <button
            type="button"
            onClick={handleWhatsappToggle}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <FontAwesomeIcon 
              icon={whatsappSameAsPhone ? faToggleOn : faToggleOff} 
              className="h-5 w-5"
            />
            <span>Same as phone</span>
          </button>
        </div>

        {!whatsappSameAsPhone && (
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-2">
              <Select
                options={countryOptions}
                value={getCountrySelectValue(data.whatsapp?.countryCode || '+972')}
                onChange={(e) => handleWhatsappChange('countryCode', e.target.value)}
                placeholder="Country"
                fullWidth
              />
            </div>
            <div className="col-span-3">
              <Input
                value={data.whatsapp?.number || ''}
                onChange={(e) => handleWhatsappChange('number', e.target.value)}
                placeholder="WhatsApp number"
                fullWidth
              />
            </div>
          </div>
        )}

        {data.whatsapp?.fullNumber && (
          <p className="text-sm text-gray-500 mt-1">
            WhatsApp: {data.whatsapp.fullNumber}
            {whatsappSameAsPhone && ' (same as phone)'}
          </p>
        )}
      </div>

      {/* Schools */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <FontAwesomeIcon icon={faSchool} className="h-4 w-4 mr-2" />
          Schools * (select up to 2)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schoolsData.map((school) => (
            <label key={school.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={data.schools.includes(school.id)}
                onChange={(e) => handleSchoolChange(school.id, e.target.checked)}
                disabled={!data.schools.includes(school.id) && data.schools.length >= 2}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                {school.name}
              </span>
            </label>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Selected: {data.schools.length}/2 schools
        </p>
      </div>

      {/* Year and Track */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Year"
          options={yearOptions}
          value={data.year.toString()}
          onChange={(e) => onChange({ year: parseInt(e.target.value) })}
          fullWidth
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 mr-2" />
            Track *
          </label>
          <select
            value={data.track}
            onChange={(e) => onChange({ track: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={data.schools.length === 0}
          >
            <option value="">Select a track</option>
            {getAvailableTracks().map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
          {data.schools.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Select schools first to see available tracks</p>
          )}
        </div>
      </div>

      {/* Election Status - Only show for coordinators and reps */}
      {(wizardMode === 'coordinator' || wizardMode === 'rep' || isAdminSetup) && data.roles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-2" />
            Election Status
          </label>
          <div className="space-y-3">
            {data.roles.map((role, index) => (
              role.type === 'coordinator' || role.type === 'rep' ? (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {role.type === 'coordinator' ? 'Coordinator' : 'Representative'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleElectedToggle(index, !role.hasBeenElected)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      role.hasBeenElected 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <FontAwesomeIcon 
                      icon={role.hasBeenElected ? faCheckCircle : faToggleOff} 
                      className="h-3 w-3" 
                    />
                    <span>{role.hasBeenElected ? 'Elected' : 'Not Elected'}</span>
                  </button>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoStep;