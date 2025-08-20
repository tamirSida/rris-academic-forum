import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faPhone, 
  faGraduationCap, 
  faCalendarAlt, 
  faUserTie,
  faEdit,
  faTrash,
  faCrown,
  faUsers,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { JobHolder, RoleType } from '../../types';

interface JobHolderCardProps {
  jobHolder: JobHolder;
  isAdmin?: boolean;
  onEdit?: (jobHolder: JobHolder) => void;
  onDelete?: (jobHolder: JobHolder) => void;
}

const JobHolderCard: React.FC<JobHolderCardProps> = ({
  jobHolder,
  isAdmin = false,
  onEdit,
  onDelete
}) => {
  const getRoleIcon = (roleType: RoleType | string) => {
    switch (roleType) {
      case RoleType.HEAD_OF_ACADEMIC_FORUM:
        return faCrown;
      case RoleType.COORDINATOR:
        return faUsers;
      case RoleType.REP:
        return faUserTie;
      default:
        return faUserTie;
    }
  };

  const getRoleLabel = (roleType: RoleType | string) => {
    switch (roleType) {
      case RoleType.HEAD_OF_ACADEMIC_FORUM:
        return 'Head of Academic Forum';
      case RoleType.COORDINATOR:
        return 'Coordinator';
      case RoleType.REP:
        return 'Representative';
      default:
        return roleType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getRoleColor = (roleType: RoleType | string) => {
    switch (roleType) {
      case RoleType.HEAD_OF_ACADEMIC_FORUM:
        return 'text-yellow-600 bg-yellow-100';
      case RoleType.COORDINATOR:
        return 'text-blue-600 bg-blue-100';
      case RoleType.REP:
        return 'text-green-600 bg-green-100';
      default:
        return 'text-purple-600 bg-purple-100';
    }
  };

  const primaryRole = jobHolder.roles[0];

  return (
    <Card variant="elevated" className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle level={3} className="text-lg mb-2">
              {jobHolder.name}
            </CardTitle>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {jobHolder.roles.map((role, index) => (
                <div key={`role-${index}-${role.type}-${role.schoolId || ''}-${role.trackId || ''}-${role.year || ''}`} className="flex gap-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.type)}`}>
                    <FontAwesomeIcon 
                      icon={getRoleIcon(role.type)} 
                      className="h-3 w-3 mr-1" 
                    />
                    {getRoleLabel(role.type)}
                  </span>
                  {(role.type === 'coordinator' || role.type === 'rep') && role.hasBeenElected && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <FontAwesomeIcon 
                        icon={faCheck} 
                        className="h-3 w-3 mr-1" 
                      />
                      Elected
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                icon={faEdit}
                onClick={() => onEdit?.(jobHolder)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={faTrash}
                onClick={() => onDelete?.(jobHolder)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {jobHolder.email && (
              <div className="flex items-center text-sm text-gray-600">
                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 mr-2 text-gray-400" />
                <a 
                  href={`mailto:${jobHolder.email}`}
                  className="hover:text-blue-600 transition-colors break-all"
                >
                  {jobHolder.email}
                </a>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faPhone} className="h-4 w-4 mr-2 text-gray-400" />
              <a 
                href={`tel:${jobHolder.phone}`}
                className="hover:text-blue-600 transition-colors"
              >
                {jobHolder.phone}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 mr-2 text-gray-400" />
              <span>{jobHolder.track}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 mr-2 text-gray-400" />
              <span>Year {jobHolder.year}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobHolderCard;