import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  FaLeaf,
  FaCalendarAlt,
  FaTint,
  FaRupeeSign,
  FaPlus,
  FaEllipsisH,
  FaSeedling,
  FaClipboardList,
  FaTrashAlt,
  FaEdit,
  FaExchangeAlt,
  FaCheck,
  FaTasks,
  FaRulerCombined
} from 'react-icons/fa';

/**
 * A clean, modern crop card component with essential crop information and quick action buttons
 */
const ModernCropCard = ({ crop, onAddEvent, onViewDetails, onDeleteCrop, onUpdateStatus }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const actionMenuRef = React.useRef(null);

  // Create a separate ref for the dropdown menu
  const dropdownMenuRef = React.useRef(null);

  // Handle clicks outside the menu to close it
  React.useEffect(() => {
    function handleClickOutside(event) {
      // Only close if the click is outside both the action menu and dropdown
      if ((actionMenuRef.current && !actionMenuRef.current.contains(event.target)) &&
        (dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target))) {
        setShowActions(false);
        setShowStatusMenu(false);
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return t('not_set');
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Status badge with appropriate coloring
  const renderStatusBadge = (status) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";

    switch (status) {
      case 'Growing':
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case 'Harvested':
        bgColor = "bg-amber-100";
        textColor = "text-amber-800";
        break;
      case 'Planning':
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case 'Failed':
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      case 'Completed':
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        break;
    }

    return (
      <span className={`${bgColor} ${textColor} px-2 py-1 rounded-full text-xs font-medium`}>
        {status}
      </span>
    );
  };

  // Calculate days since planting
  const getDaysSincePlanting = (plantingDate) => {
    if (!plantingDate) return null;
    const planted = new Date(plantingDate);
    const today = new Date();
    const diffTime = Math.abs(today - planted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Quick action buttons
  const renderQuickActions = () => {
    const commonButtonClasses = "flex items-center justify-center p-2 rounded-full text-white";
    return (
      <div className="absolute bottom-0 right-0 p-2 bg-white rounded-tl-xl shadow-md flex space-x-2 z-10" ref={actionMenuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAddEvent(crop._id, 'irrigation');
          }}
          className={`${commonButtonClasses} bg-blue-500 hover:bg-blue-600`}
          title={t('add_irrigation') || 'Add Irrigation'}
        >
          <FaTint size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAddEvent(crop._id, 'cost');
          }}
          className={`${commonButtonClasses} bg-amber-500 hover:bg-amber-600`}
          title={t('add_expense') || 'Add Expense'}
        >
          <FaRupeeSign size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (window.confirm(t('confirm_delete_crop') || 'Are you sure you want to delete this crop?')) {
              onDeleteCrop(crop._id);
            }
          }}
          className={`${commonButtonClasses} bg-red-500 hover:bg-red-600`}
          title={t('delete_crop') || 'Delete Crop'}
        >
          <FaTrashAlt size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Toggle action menu and ensure status menu is closed
            setShowActions(!showActions);
            setShowStatusMenu(false);

            // Log to help debug
          }}
          className={`${commonButtonClasses} ${showActions ? 'bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}
          title={t('more_actions') || 'More Actions'}
        >
          <FaEllipsisH size={14} />
        </button>
      </div>
    );
  };

  // Action menu
  const renderActionMenu = () => {
    if (!showActions && !showStatusMenu) return null;

    if (showStatusMenu) {
      return (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-20">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              {t('change_status_to')}:
            </div>
            {['Planning', 'Planting', 'Growing', 'Harvesting', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusMenu(false);
                  if (crop.status !== status) {
                    onUpdateStatus(crop._id, status);
                  }
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${crop.status === status ? 'text-primary font-medium bg-gray-50' : 'text-gray-700'
                  }`}
                disabled={crop.status === status}
              >
                {crop.status === status ? <FaCheck className="text-green-600" /> : <span className="w-4" />}
                {status}
              </button>
            ))}
            <div className="border-t border-gray-100 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={dropdownMenuRef} className="fixed right-4 mt-2 w-56 bg-white rounded-md shadow-xl z-50 border border-gray-200">
        <div className="py-2">
          <div className="px-4 py-1 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">
            {t('actions') || 'Actions'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onViewDetails(crop._id);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <FaClipboardList className="text-primary" />
            {t('view_details') || 'View Details'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowActions(false);
              onAddEvent(crop._id, 'note');
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <FaEdit className="text-gray-600" />
            {t('add_note') || 'Add Note'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowActions(false);
              onAddEvent(crop._id, 'activity');
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <FaPlus className="text-gray-600" />
            {t('add_activity') || 'Add Activity'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowActions(false);
              navigate(`/crops/${crop._id}`);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <FaTasks className="text-primary" />
            {t('go_to_crop_page') || 'Go to Crop Page'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowActions(false);
              setShowStatusMenu(true);
            }}
            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
          >
            <FaExchangeAlt className="text-blue-600" />
            {t('change_status') || 'Change Status'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(false);
              // Explicitly prevent any other event handlers from running
              e.preventDefault();
              if (window.confirm(t('confirm_delete_crop') || 'Are you sure you want to delete this crop?')) {
                onDeleteCrop(crop._id);
              }
            }}
            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 pt-1"
          >
            <FaTrashAlt className="text-red-600" />
            {t('delete_crop')}
          </button>
        </div>
      </div>
    );
  };

  // Calculate total expenses for the crop
  const calculateTotalExpenses = () => {
    if (!crop.costs || crop.costs.length === 0) return 0;
    return crop.costs.reduce((total, cost) => total + (cost.amount || 0), 0);
  };

  // Get the next recommended action for this crop
  const getNextAction = () => {
    if (!crop.nextActions || crop.nextActions.length === 0) {
      return null;
    }
    return crop.nextActions[0];
  };

  const nextAction = getNextAction();
  const daysSincePlanting = getDaysSincePlanting(crop.plantingDate);

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 relative cursor-pointer"
      style={{ overflow: showActions || showStatusMenu ? 'visible' : 'hidden' }}
      onClick={(e) => {
        // Only navigate to details if the click wasn't on a button or dropdown
        if (e.target.tagName.toLowerCase() !== 'button' &&
          !e.target.closest('button') &&
          !actionMenuRef.current?.contains(e.target) &&
          !dropdownMenuRef.current?.contains(e.target)) {
          onViewDetails(crop._id);
        }
      }}
    >
      {/* Crop header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-full">
            <FaSeedling className="text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{crop.name}</h3>
            {crop.variety && (
              <p className="text-xs text-gray-500">{crop.variety}</p>
            )}
          </div>
        </div>
        {renderStatusBadge(crop.status)}
      </div>

      {/* Crop details */}
      <div className="p-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('planted')}</p>
            <p className="text-gray-700">{formatDate(crop.plantingDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaClipboardList className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('days_growing')}</p>
            <p className="text-gray-700">{daysSincePlanting ? `${daysSincePlanting} ${t('days')}` : t('not_planted')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaRupeeSign className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('expenses')}</p>
            <p className="text-gray-700">₹{calculateTotalExpenses().toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaRulerCombined className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('area')}</p>
            <p className="text-gray-700">
              {crop.locationArea
                ? `${crop.locationArea} ${crop.locationAreaUnit || 'units'}`
                : 'N/A'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Next action section */}
      {nextAction && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 mb-1">{t('suggested_action')}:</p>
          <p className="text-sm text-blue-600 font-medium">{nextAction}</p>
        </div>
      )}

      {/* Quick actions */}
      {renderQuickActions()}
      {renderActionMenu()}
    </div>
  );
};

export default ModernCropCard;
