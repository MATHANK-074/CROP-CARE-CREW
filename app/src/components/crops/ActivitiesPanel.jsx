import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faUserFriends,
  faTags,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import Card from '../ui/Card';
import Button from '../ui/Button';

const activityTypeIcons = {
  general: '🔄',
  inspection: '🔍',
  maintenance: '🔧',
  training: '📊',
  pruning: '✂️',
  thinning: '🌱',
  mulching: '🍂',
  other: '📝'
};

const ActivityItem = ({ activity, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0">
      <div className="flex items-start">
        <div className="text-2xl mr-3">
          {activityTypeIcons[activity.activityType] || '📝'}
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h4 className="text-lg font-medium text-gray-900">{activity.title}</h4>
            <div className="text-sm text-gray-500">{formatDate(activity.date)}</div>
          </div>

          {activity.description && (
            <p className="text-gray-700 my-2">{activity.description}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
            {activity.duration && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-1 text-gray-400" />
                {activity.duration} {t('minutes')}
              </div>
            )}

            {activity.personnel && activity.personnel.length > 0 && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faUserFriends} className="mr-1 text-gray-400" />
                {activity.personnel.join(', ')}
              </div>
            )}

            {activity.tags && activity.tags.length > 0 && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTags} className="mr-1 text-gray-400" />
                {activity.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 text-xs font-medium mr-1 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2 gap-2">
        <Button
          variant="icon"
          onClick={() => onEdit(activity)}
          title={t('edit')}
          className="text-blue-600 hover:text-blue-800"
        >
          <FontAwesomeIcon icon={faEdit} />
        </Button>

        <Button
          variant="icon"
          onClick={() => onDelete(activity._id)}
          title={t('delete')}
          className="text-red-600 hover:text-red-800"
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </div>
    </div>
  );
};

const ActivityList = ({ activities, onEdit, onDelete, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        {t('no_activities_recorded')}
      </div>
    );
  }

  return (
    <div>
      {activities.map(activity => (
        <ActivityItem
          key={activity._id}
          activity={activity}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

const ActivitiesPanel = ({ activities, cropId, onAddActivity, onEditActivity, onDeleteActivity, loading }) => {
  const { t } = useTranslation();

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t('activities')}</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={onAddActivity}
        >
          {t('add_activity')}
        </Button>
      </div>

      <ActivityList
        activities={activities}
        onEdit={onEditActivity}
        onDelete={onDeleteActivity}
        loading={loading}
      />
    </Card>
  );
};

export default ActivitiesPanel;