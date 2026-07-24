import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDroplet,
  faLeaf,
  faBug,
  faRulerVertical,
  faWeightHanging,
  faMoneyBill,
  faBusinessTime,
  faNoteSticky,
  faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import Card from '../ui/Card';
import Button from '../ui/Button';

const EventTypeIcons = {
  irrigation: faDroplet,
  fertilization: faLeaf,
  pestDisease: faBug,
  growth: faRulerVertical,
  harvest: faWeightHanging,

  cost: faMoneyBill,
  labor: faBusinessTime,
  note: faNoteSticky,
  activity: faClipboardCheck
};

const TabButton = React.memo(({ active, onClick, icon, label }) => (
  <button
    className={`px-4 py-2 flex items-center gap-2 rounded-md transition ${active ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
    onClick={onClick}
  >
    <FontAwesomeIcon icon={icon} />
    <span>{label}</span>
  </button>
));

TabButton.displayName = 'TabButton';

const CropStatusHistory = React.memo(({ crop, onAddEvent }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('irrigation');
  const [showAddForm, setShowAddForm] = useState(false);

  // Memoize tab change handler
  const handleTabChange = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []);

  // Helper function to get the appropriate data array based on the active tab
  const getActiveData = useCallback(() => {
    switch (activeTab) {
      case 'irrigation':
        return crop.irrigationHistory || [];
      case 'fertilization':
        return crop.fertilizationHistory || [];
      case 'pestDisease':
        return crop.pestDiseaseHistory || [];
      case 'growth':
        return crop.growthHistory || [];
      case 'harvest':
        return crop.harvestHistory || [];
      case 'cost':
        return crop.costs || [];
      case 'labor':
        return crop.laborHours || [];
      case 'note':
        // Handle both cases: if notes is an array, return it; if it's an object or string, wrap it in an array
        if (!crop.notes) return [];
        if (Array.isArray(crop.notes)) return crop.notes;
        return [crop.notes]; // Wrap in array if it's a single object or string
      case 'activity':
        // Handle both cases: if activities is an array, return it; if it's an object, wrap it in an array
        if (!crop.activities) return [];
        if (Array.isArray(crop.activities)) return crop.activities;
        return [crop.activities]; // Wrap in array if it's a single object
      default:
        return [];
    }
  }, [activeTab, crop]);

  // Memoize the active data to prevent unnecessary recalculations
  const activeData = useMemo(() => getActiveData(), [getActiveData]);

  // Render specific content based on the event type
  const renderEventContent = (event) => {
    switch (activeTab) {
      case 'irrigation':
        return (
          <>
            <div className="font-semibold">{event.method || 'Irrigation'}</div>
            <div>
              {event.amount && `${event.amount} ${event.amount === 1 ? 'liter' : 'liters'}`}
              {event.duration && ` for ${event.duration} minutes`}
            </div>
            {event.waterSource && <div>Source: {event.waterSource}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'fertilization':
        return (
          <>
            <div className="font-semibold">{event.type}</div>
            {event.product && <div>Product: {event.product}</div>}
            {event.npkRatio && <div>NPK: {event.npkRatio}</div>}
            {event.amount && <div>Amount: {event.amount}</div>}
            {event.applicationMethod && <div>Method: {event.applicationMethod}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'pestDisease':
        return (
          <>
            <div className="font-semibold">
              {event.name || `${event.type.charAt(0).toUpperCase() + event.type.slice(1)} Issue`}
            </div>
            {event.severity && <div>Severity: {event.severity}/10</div>}
            {event.affectedArea && <div>Affected Area: {event.affectedArea}</div>}
            {event.treatment && (
              <div>
                Treatment: {event.treatment.product}
                {event.treatment.applicationDate && ` on ${format(new Date(event.treatment.applicationDate), 'MMM d, yyyy')}`}
              </div>
            )}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'growth':
        return (
          <>
            <div className="font-semibold">
              {event.stage ? event.stage.charAt(0).toUpperCase() + event.stage.slice(1) : 'Growth Record'}
            </div>
            {event.height && <div>Height: {event.height} cm</div>}
            {event.canopyWidth && <div>Canopy Width: {event.canopyWidth} cm</div>}
            {event.healthRating && <div>Health: {event.healthRating}/10</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'harvest':
        return (
          <>
            <div className="font-semibold">Harvest</div>
            {event.yield && <div>Yield: {event.yield} {event.yieldUnit || 'kg'}</div>}
            {event.quality && <div>Quality: {event.quality}</div>}
            {event.marketValue && <div>Value: ${event.marketValue.toFixed(2)}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );



      case 'cost':
        return (
          <>
            <div className="font-semibold">{event.category}</div>
            <div className="text-lg">₹{event.amount.toFixed(2)}</div>
            {event.description && <div>{event.description}</div>}
          </>
        );

      case 'labor':
        return (
          <>
            <div className="font-semibold">{event.task}</div>
            <div>{event.hours} hours</div>
            {event.personnel && <div>By: {event.personnel}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'note':
        return (
          <>
            <div>{typeof event === 'object' ? (event.text || JSON.stringify(event)) : event}</div>
          </>
        );

      case 'activity':
        return (
          <>
            {!event || typeof event !== 'object' ? (
              <div>{String(event)}</div>
            ) : (
              <>
                <div className="font-semibold">{event.title || 'Activity'}</div>
                <div>{event.activityType && `Type: ${event.activityType}`}</div>
                {event.description && <div>{event.description}</div>}
                {event.duration && <div>Duration: {event.duration} minutes</div>}
                {event.personnel && Array.isArray(event.personnel) && event.personnel.length > 0 &&
                  <div>Personnel: {event.personnel.join(', ')}</div>}
                {event.tags && Array.isArray(event.tags) && event.tags.length > 0 &&
                  <div>Tags: {event.tags.join(', ')}</div>}
              </>
            )}
          </>
        );

      default:
        return <div>No data available</div>;
    }
  };

  // Get label for the add button based on active tab
  const getAddButtonLabel = () => {
    switch (activeTab) {
      case 'irrigation': return 'Add Irrigation';
      case 'fertilization': return 'Add Fertilization';
      case 'pestDisease': return 'Add Pest/Disease';
      case 'growth': return 'Add Growth Record';
      case 'harvest': return 'Add Harvest';

      case 'cost': return 'Add Cost';
      case 'labor': return 'Add Labor';
      case 'note': return 'Add Note';
      case 'activity': return 'Add Activity';
      default: return 'Add Event';
    }
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-bold mb-4">{t('crop_status_history')}</h2>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
        <TabButton
          active={activeTab === 'irrigation'}
          onClick={() => setActiveTab('irrigation')}
          icon={EventTypeIcons.irrigation}
          label={t('irrigation')}
        />
        <TabButton
          active={activeTab === 'fertilization'}
          onClick={() => setActiveTab('fertilization')}
          icon={EventTypeIcons.fertilization}
          label={t('fertilization')}
        />
        <TabButton
          active={activeTab === 'pestDisease'}
          onClick={() => setActiveTab('pestDisease')}
          icon={EventTypeIcons.pestDisease}
          label={t('pests_diseases')}
        />
        <TabButton
          active={activeTab === 'growth'}
          onClick={() => setActiveTab('growth')}
          icon={EventTypeIcons.growth}
          label={t('growth')}
        />
        <TabButton
          active={activeTab === 'harvest'}
          onClick={() => setActiveTab('harvest')}
          icon={EventTypeIcons.harvest}
          label={t('harvest')}
        />

        <TabButton
          active={activeTab === 'cost'}
          onClick={() => setActiveTab('cost')}
          icon={EventTypeIcons.cost}
          label={t('costs')}
        />
        <TabButton
          active={activeTab === 'labor'}
          onClick={() => setActiveTab('labor')}
          icon={EventTypeIcons.labor}
          label={t('labor')}
        />
        <TabButton
          active={activeTab === 'note'}
          onClick={() => setActiveTab('note')}
          icon={EventTypeIcons.note}
          label={t('notes')}
        />
        <TabButton
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
          icon={EventTypeIcons.activity}
          label={t('activities')}
        />
      </div>

      {/* Event timeline */}
      <div className="mb-4">
        {getActiveData().length === 0 ? (
          <div className="text-gray-500 text-center py-6">
            {t('no_data_available')}
          </div>
        ) : (
          <div className="border-l-2 border-green-300 pl-4 ml-2">
            {getActiveData().map((event, index) => (
              <div key={index} className="mb-4 relative">
                <div className="absolute -left-6 w-4 h-4 rounded-full bg-green-500"></div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">
                    {event && event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'No date'}
                  </div>
                  {renderEventContent(event)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add event button */}
      <div className="flex justify-center">
        <Button
          onClick={() => onAddEvent(activeTab)}
          variant="primary"
        >
          <FontAwesomeIcon icon={EventTypeIcons[activeTab]} className="mr-2" />
          {getAddButtonLabel()}
        </Button>
      </div>
    </Card>
  );
});

CropStatusHistory.displayName = 'CropStatusHistory';

export default CropStatusHistory;