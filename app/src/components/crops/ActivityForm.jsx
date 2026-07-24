import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ActivityForm = ({ cropId, initialData, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    activityType: initialData?.activityType || 'general',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    duration: initialData?.duration || '',
    personnel: initialData?.personnel || [],
    tags: initialData?.tags || []
  });

  const activityTypes = [
    { value: 'general', label: t('activity_type_general') },
    { value: 'inspection', label: t('activity_type_inspection') },
    { value: 'maintenance', label: t('activity_type_maintenance') },
    { value: 'training', label: t('activity_type_training') },
    { value: 'pruning', label: t('activity_type_pruning') },
    { value: 'thinning', label: t('activity_type_thinning') },
    { value: 'mulching', label: t('activity_type_mulching') },
    { value: 'other', label: t('activity_type_other') }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePersonnelChange = (e) => {
    // Split by comma and trim each entry
    const personnel = e.target.value
      .split(',')
      .map(p => p.trim())
      .filter(p => p !== '');

    setFormData(prev => ({
      ...prev,
      personnel
    }));
  };

  const handleTagsChange = (e) => {
    // Split by comma and trim each entry
    const tags = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      cropId,
      ...formData
    });
  };

  return (
    <Card className="mb-4">
      <h3 className="text-lg font-semibold mb-4">{t('add_activity')}</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('title')}</label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('activity_title_placeholder')}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('activity_type')}</label>
          <select
            name="activityType"
            value={formData.activityType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('date')}</label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('description')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('activity_description_placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('duration')} ({t('minutes')})</label>
          <Input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="60"
            min="0"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('personnel')}</label>
          <Input
            type="text"
            value={formData.personnel.join(', ')}
            onChange={handlePersonnelChange}
            placeholder={t('personnel_placeholder')}
          />
          <p className="text-xs text-gray-500 mt-1">{t('comma_separated')}</p>
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('tags')}</label>
          <Input
            type="text"
            value={formData.tags.join(', ')}
            onChange={handleTagsChange}
            placeholder={t('tags_placeholder')}
          />
          <p className="text-xs text-gray-500 mt-1">{t('comma_separated')}</p>
        </div>

        <div className="flex gap-3 mt-4">
          <Button type="submit" variant="primary">
            {t('save')}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ActivityForm;