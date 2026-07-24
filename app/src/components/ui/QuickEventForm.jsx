import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTint,
  faLeaf,
  faRupeeSign,
  faBug,
  faStickyNote,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import QuickActionButton from './QuickActionButton';
import { saveEventAsTask } from '../../utils/eventTaskUtils';

/**
 * Quick event form for adding common crop events from the home page
 */
const QuickEventForm = ({ crop, eventType, onClose, onSuccess }) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default values based on event type
  const defaultValues = {
    irrigation: { amount: 10, unit: 'L', notes: '' },
    fertilization: { type: 'Organic', amount: 1, unit: 'kg', notes: '' },
    cost: { description: '', amount: 0, category: 'other' }, // Using 'other' to match server's enum
    note: { content: '' },
    pestDisease: { type: '', severity: 'Low', treatment: '', notes: '' }
  };

  // Form state
  const [formData, setFormData] = useState(defaultValues[eventType] || {});

  // Get event-specific config
  const getEventConfig = () => {
    switch (eventType) {
      case 'irrigation':
        return {
          title: t('add_irrigation'),
          icon: faTint,
          color: 'blue'
        };
      case 'fertilization':
        return {
          title: t('add_fertilization'),
          icon: faLeaf,
          color: 'green'
        };
      case 'cost':
        return {
          title: t('add_expense'),
          icon: faRupeeSign,
          color: 'amber'
        };
      case 'pestDisease':
        return {
          title: t('add_pest_disease'),
          icon: faBug,
          color: 'red'
        };
      case 'note':
        return {
          title: t('add_note'),
          icon: faStickyNote,
          color: 'gray'
        };
      default:
        return {
          title: t('add_event'),
          icon: faStickyNote,
          color: 'gray'
        };
    }
  };

  const config = getEventConfig();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue;

    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);

      // Prevent NaN values
      if (isNaN(parsedValue)) {
        parsedValue = 0;
      }
    } else {
      parsedValue = value;
    }

    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not available');
      }

      // Validate form data based on event type
      if (eventType === 'cost') {
        if (!formData.category) {
          throw new Error('Category is required');
        }

        // Ensure amount is a valid number
        const amount = parseFloat(formData.amount);
        if (isNaN(amount)) {
          throw new Error('Please enter a valid amount');
        }

        // Update formData with the validated amount
        formData.amount = amount;
      }

      // Add timestamp to the data
      const eventData = {
        ...formData,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm')
      };
      await saveEventAsTask(crop._id, userId, eventType, eventData);

      // Notify parent of success
      onSuccess(eventType, eventData);
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
      setError(`Failed to save ${eventType}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render form fields based on event type
  const renderFormFields = () => {
    switch (eventType) {
      case 'irrigation':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('amount')}
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="flex-grow border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="border border-gray-300 border-l-0 rounded-r-lg px-3 py-2 bg-gray-50 focus:outline-none"
                >
                  <option value="L">L</option>
                  <option value="gal">gal</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notes')} ({t('optional')})
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
            </div>
          </>
        );

      case 'fertilization':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fertilizer_type')}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Organic">{t('organic')}</option>
                <option value="NPK">{t('npk')}</option>
                <option value="Urea">{t('urea')}</option>
                <option value="Compost">{t('compost')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('amount')}
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="flex-grow border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="border border-gray-300 border-l-0 rounded-r-lg px-3 py-2 bg-gray-50 focus:outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notes')} ({t('optional')})
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="2"
              />
            </div>
          </>
        );

      case 'cost':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('expense_category')}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {/* Match the exact values expected by the server: ['seeds', 'fertilizer', 'pesticide', 'labor', 'equipment', 'other'] */}
                <option value="seeds">{t('seeds')}</option>
                <option value="fertilizer">{t('fertilizer')}</option>
                <option value="pesticide">{t('pesticide')}</option>
                <option value="labor">{t('labor')}</option>
                <option value="equipment">{t('equipment')}</option>
                <option value="other">{t('general')}</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('description')}
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('amount')} (₹)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </>
        );

      case 'note':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('note')}
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                rows="4"
                placeholder={t('enter_note_here')}
              />
            </div>
          </>
        );

      case 'pestDisease':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pest_or_disease_type')}
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder={t('pest_disease_name')}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('severity')}
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Low">{t('low')}</option>
                <option value="Medium">{t('medium')}</option>
                <option value="High">{t('high')}</option>
                <option value="Critical">{t('critical')}</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('treatment')} ({t('optional')})
              </label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="2"
              />
            </div>
          </>
        );

      default:
        return (
          <div className="py-4 text-center text-gray-500">
            {t('event_type_not_supported')}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-full bg-${config.color}-100 mr-3`}>
            <FontAwesomeIcon icon={config.icon} className={`text-${config.color}-600`} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            {config.title} - {crop.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {renderFormFields()}

        {/* Form actions */}
        <div className="flex justify-end mt-4 space-x-2">
          <QuickActionButton
            label={t('cancel')}
            variant="outline"
            onClick={onClose}
            disabled={loading}
          />
          <QuickActionButton
            label={loading ? t('saving') : t('save')}
            variant="primary"
            type="submit"
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default QuickEventForm;