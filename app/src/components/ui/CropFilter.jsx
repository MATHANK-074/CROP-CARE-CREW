import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaFilter, FaSort, FaTimes } from 'react-icons/fa';
import QuickActionButton from './QuickActionButton';

/**
 * Advanced filtering and search component for crops
 */
const CropFilter = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  sortBy = 'name',
  onSortChange
}) => {
  const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    plantDateStart: '',
    plantDateEnd: '',
    hasIssues: false,
    needsIrrigation: false,
  });

  // Toggle advanced filters panel
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    onSearchChange('');
    onFilterStatusChange('all_status');
    onSortChange('name');
    setAdvancedFilters({
      plantDateStart: '',
      plantDateEnd: '',
      hasIssues: false,
      needsIrrigation: false,
    });
  };

  // Handle advanced filter changes
  const handleAdvancedFilterChange = (key, value) => {
    setAdvancedFilters({
      ...advancedFilters,
      [key]: value
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery ||
    filterStatus !== 'all_status' ||
    advancedFilters.plantDateStart ||
    advancedFilters.plantDateEnd ||
    advancedFilters.hasIssues ||
    advancedFilters.needsIrrigation;

  return (
    <div className="mb-4 border border-gray-100 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Search input */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('search_crops')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>

        {/* Main filter controls */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="all_status">{t('all_status')}</option>
            <option value="Planning">{t('planning')}</option>
            <option value="Growing">{t('growing')}</option>
            <option value="Harvested">{t('harvested')}</option>
            <option value="Completed">{t('completed')}</option>
            <option value="Failed">{t('failed')}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="name">{t('name')}</option>
            <option value="date_new">{t('newest_first')}</option>
            <option value="date_old">{t('oldest_first')}</option>
          </select>

          <QuickActionButton
            icon={<FaFilter />}
            variant={showAdvancedFilters ? "primary" : "outline"}
            size="sm"
            iconOnly
            onClick={toggleAdvancedFilters}
            title={t('advanced_filters')}
            aria-expanded={showAdvancedFilters}
          />

          {hasActiveFilters && (
            <QuickActionButton
              icon={<FaTimes />}
              variant="outline-danger"
              size="sm"
              iconOnly
              onClick={clearAllFilters}
              title={t('clear_all_filters')}
            />
          )}
        </div>
      </div>

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('planted_after')}</label>
              <input
                type="date"
                value={advancedFilters.plantDateStart}
                onChange={(e) => handleAdvancedFilterChange('plantDateStart', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('planted_before')}</label>
              <input
                type="date"
                value={advancedFilters.plantDateEnd}
                onChange={(e) => handleAdvancedFilterChange('plantDateEnd', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasIssues}
                  onChange={(e) => handleAdvancedFilterChange('hasIssues', e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">{t('has_issues')}</span>
              </label>
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedFilters.needsIrrigation}
                  onChange={(e) => handleAdvancedFilterChange('needsIrrigation', e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">{t('needs_irrigation')}</span>
              </label>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <QuickActionButton
              icon={<FaFilter />}
              label={t('apply_filters')}
              variant="primary"
              size="sm"
              onClick={() => {
                // Here you would apply the advanced filters
                // This would be handled by passing the filters up to the parent component
                setShowAdvancedFilters(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">{t('active_filters')}:</span>

          {searchQuery && (
            <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full flex items-center">
              {t('search')}: "{searchQuery}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:text-blue-900"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}

          {filterStatus !== 'all_status' && (
            <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full flex items-center">
              {t('status')}: {filterStatus}
              <button
                onClick={() => onFilterStatusChange('all_status')}
                className="ml-1 hover:text-green-900"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}

          {advancedFilters.plantDateStart && (
            <span className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-full flex items-center">
              {t('from')}: {advancedFilters.plantDateStart}
              <button
                onClick={() => handleAdvancedFilterChange('plantDateStart', '')}
                className="ml-1 hover:text-amber-900"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}

          {advancedFilters.plantDateEnd && (
            <span className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-full flex items-center">
              {t('to')}: {advancedFilters.plantDateEnd}
              <button
                onClick={() => handleAdvancedFilterChange('plantDateEnd', '')}
                className="ml-1 hover:text-amber-900"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}

          {advancedFilters.hasIssues && (
            <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full flex items-center">
              {t('has_issues')}
              <button
                onClick={() => handleAdvancedFilterChange('hasIssues', false)}
                className="ml-1 hover:text-red-900"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}

          {advancedFilters.needsIrrigation && (
            <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full flex items-center">
              {t('needs_irrigation')}
              <button
                onClick={() => handleAdvancedFilterChange('needsIrrigation', false)}
                className="ml-1 hover:text-blue-900"
              >
                <FaTimes size={10} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CropFilter;