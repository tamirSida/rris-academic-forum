import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faUsers } from '@fortawesome/free-solid-svg-icons';
import JobHolderCard from './JobHolderCard';
import { JobHolder, DirectoryFilters } from '../../types';
import { FirestoreService } from '../../lib/firestore';

interface DirectoryGridProps {
  filters: DirectoryFilters;
  isAdmin?: boolean;
  onEditJobHolder?: (jobHolder: JobHolder) => void;
  onDeleteJobHolder?: (jobHolder: JobHolder) => void;
}

const DirectoryGrid: React.FC<DirectoryGridProps> = ({
  filters,
  isAdmin = false,
  onEditJobHolder,
  onDeleteJobHolder
}) => {
  const [jobHolders, setJobHolders] = useState<JobHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobHolders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await FirestoreService.getJobHolders(filters);
        setJobHolders(data);
      } catch (err) {
        console.error('Error loading job holders:', err);
        setError('Failed to load directory. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadJobHolders();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FontAwesomeIcon 
            icon={faSpinner} 
            className="h-8 w-8 text-blue-600 animate-spin mb-3" 
          />
          <p className="text-gray-600">Loading directory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className="h-8 w-8 text-red-600 mb-3" 
          />
          <p className="text-red-600 mb-2">Error loading directory</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (jobHolders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FontAwesomeIcon 
            icon={faUsers} 
            className="h-8 w-8 text-gray-400 mb-3" 
          />
          <p className="text-gray-600 mb-2">No contacts found</p>
          <p className="text-gray-500 text-sm">
            {Object.keys(filters).length > 0 
              ? 'Try adjusting your search filters'
              : 'The directory is empty'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {jobHolders.length} contact{jobHolders.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobHolders.map((jobHolder, index) => (
          <JobHolderCard
            key={`directory-${jobHolder.id}-${index}`}
            jobHolder={jobHolder}
            isAdmin={isAdmin}
            onEdit={() => onEditJobHolder?.(jobHolder)}
            onDelete={() => onDeleteJobHolder?.(jobHolder)}
          />
        ))}
      </div>
    </div>
  );
};

export default DirectoryGrid;