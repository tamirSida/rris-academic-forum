import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faGraduationCap, 
  faPlus, 
  faUserPlus,
  faCalendarAlt,
  faSchool 
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import JobHolderCard from '../directory/JobHolderCard';
import { HierarchyService } from '../../lib/hierarchy';
import { JobHolder, RoleType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface CoordinatorDashboardProps {
  onAddRep: (schoolId: string, trackId: string, year: number) => void;
  coordinatorRole?: {
    role: RoleType;
    schoolId?: string;
    trackId?: string;
    year?: number;
  };
  refreshKey?: number;
  onEditRep?: (jobHolder: JobHolder) => void;
  onRemoveRepRole?: (jobHolder: JobHolder, schoolId: string, trackId: string, year: number) => void;
}

const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({ onAddRep, coordinatorRole, refreshKey, onEditRep, onRemoveRepRole }) => {
  const { user } = useAuth();
  const [coordinatorData, setCoordinatorData] = useState<{
    schoolId: string;
    tracks: {
      [trackId: string]: {
        name: string;
        reps: {
          [year: number]: JobHolder[];
        };
      };
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoordinatorData = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const data = await HierarchyService.getCoordinatorReps(user.uid);
        setCoordinatorData(data);
      } catch (error) {
        console.error('Error loading coordinator data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCoordinatorData();
  }, [user?.uid, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading your representatives...</p>
      </div>
    );
  }

  if (!coordinatorData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">No coordinator data found.</p>
      </div>
    );
  }

  const getSchoolName = (schoolId: string) => {
    const schoolsData = require('../../data/schools.json');
    const school = schoolsData.find((s: any) => s.id === schoolId);
    return school?.name || schoolId;
  };

  const getTotalReps = () => {
    let total = 0;
    Object.values(coordinatorData.tracks).forEach(track => {
      Object.values(track.reps).forEach(yearReps => {
        total += yearReps.length;
      });
    });
    return total;
  };

  const getAvailablePositions = () => {
    let available = 0;
    Object.values(coordinatorData.tracks).forEach(track => {
      Object.values(track.reps).forEach(yearReps => {
        available += (2 - yearReps.length);
      });
    });
    return available;
  };

  return (
    <div className="space-y-6">
      {/* Coordinator Header */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle level={2} className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSchool} className="h-5 w-5 text-blue-600" />
                {getSchoolName(coordinatorData.schoolId)} Coordinator Dashboard
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Managing {Object.keys(coordinatorData.tracks).length} tracks with {getTotalReps()} representatives
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{getTotalReps()}</div>
              <div className="text-sm text-gray-500">Total Reps</div>
              <div className="text-sm text-green-600 mt-1">
                {getAvailablePositions()} positions available
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tracks */}
      <div className="space-y-6">
        {Object.entries(coordinatorData.tracks).map(([trackId, track]) => (
          <Card key={`coordinator-dashboard-${coordinatorData.schoolId}-${trackId}`} variant="outlined">
            <CardHeader>
              <CardTitle level={3} className="flex items-center gap-2">
                <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 text-green-600" />
                {track.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(year => (
                  <div key={`${coordinatorData.schoolId}-${trackId}-year-${year}`} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4" />
                        Year {year}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {track.reps[year]?.length || 0}/2 reps
                      </span>
                    </div>

                    {/* Representatives */}
                    <div className="space-y-2">
                      {track.reps[year]?.map((rep, repIndex) => (
                        <JobHolderCard
                          key={`coordinator-${trackId}-year${year}-${rep.id}-${repIndex}`}
                          jobHolder={rep}
                          isAdmin={true}
                          onEdit={() => onEditRep?.(rep)}
                          onDelete={() => onRemoveRepRole?.(rep, coordinatorData.schoolId, trackId, year)}
                        />
                      )) || null}
                    </div>

                    {/* Add Rep Button */}
                    {(track.reps[year]?.length || 0) < 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={faUserPlus}
                        onClick={() => onAddRep(coordinatorData.schoolId, trackId, year)}
                        fullWidth
                        className="border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                      >
                        Add Representative
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-6">
            <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{getTotalReps()}</div>
            <div className="text-sm text-gray-600">Total Representatives</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6">
            <FontAwesomeIcon icon={faGraduationCap} className="h-8 w-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{Object.keys(coordinatorData.tracks).length}</div>
            <div className="text-sm text-gray-600">Academic Tracks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center py-6">
            <FontAwesomeIcon icon={faPlus} className="h-8 w-8 text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{getAvailablePositions()}</div>
            <div className="text-sm text-gray-600">Open Positions</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;