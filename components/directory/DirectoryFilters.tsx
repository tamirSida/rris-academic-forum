import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { DirectoryFilters, RoleType, School, Track } from '../../types';

interface DirectoryFiltersProps {
  filters: DirectoryFilters;
  onFiltersChange: (filters: DirectoryFilters) => void;
  schools: School[];
  tracks: Track[];
  className?: string;
}

const DirectoryFiltersComponent: React.FC<DirectoryFiltersProps> = ({
  filters,
  onFiltersChange,
  schools,
  tracks,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof DirectoryFilters, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    if (key === 'schoolId') {
      delete newFilters.trackId;
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const filteredTracks = filters.schoolId 
    ? tracks.filter(track => track.schoolId === filters.schoolId)
    : tracks;

  const roleOptions = [
    { value: RoleType.HEAD_OF_ACADEMIC_FORUM, label: 'Head of Academic Forum' },
    { value: RoleType.COORDINATOR, label: 'Coordinator' },
    { value: RoleType.REP, label: 'Representative' }
  ];

  const schoolOptions = schools.map(school => ({
    value: school.id,
    label: school.name
  }));

  const trackOptions = filteredTracks.map(track => ({
    value: track.id,
    label: track.name
  }));

  const yearOptions = [
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' }
  ];

  return (
    <Card className={className}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or track..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              icon={faSearch}
              fullWidth
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              icon={faFilter}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={showAdvanced ? 'bg-blue-50 border-blue-300' : ''}
            >
              <span className="hidden sm:inline">Filters</span>
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="md"
                icon={faTimes}
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                label="Role"
                options={roleOptions}
                value={filters.roleType || ''}
                onChange={(e) => handleFilterChange('roleType', e.target.value as RoleType)}
                fullWidth
              />
              
              <Select
                label="School"
                options={schoolOptions}
                value={filters.schoolId || ''}
                onChange={(e) => handleFilterChange('schoolId', e.target.value)}
                fullWidth
              />
              
              <Select
                label="Track"
                options={trackOptions}
                value={filters.trackId || ''}
                onChange={(e) => handleFilterChange('trackId', e.target.value)}
                disabled={!filters.schoolId}
                fullWidth
              />
              
              <Select
                label="Year"
                options={yearOptions}
                value={filters.year?.toString() || ''}
                onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
                fullWidth
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DirectoryFiltersComponent;