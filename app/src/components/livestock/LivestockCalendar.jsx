import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaStethoscope, FaBabyCarriage, FaHistory } from 'react-icons/fa';

const LivestockCalendar = ({ alerts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const onDateClick = day => {
    // We could expand this to show a detailed view in the future
  };

  // Helper to map alerts to specific dates
  const getEventsForDate = (date) => {
    const dayEvents = [];

    if (!alerts) return dayEvents;

    // Medical Alerts
    (alerts.medical || []).forEach(alert => {
      if (alert.expectedDeliveryDate && isSameDay(date, parseISO(alert.expectedDeliveryDate))) {
        dayEvents.push({ type: 'medical', animal: alert.livestock.tagId, title: 'Medical/Drying Off' });
      }
    });

    // Deliveries
    (alerts.deliveries || []).forEach(alert => {
      if (alert.expectedDeliveryDate && isSameDay(date, parseISO(alert.expectedDeliveryDate))) {
        dayEvents.push({ type: 'delivery', animal: alert.livestock.tagId, title: 'Delivery Due' });
      }
    });

    // Heat Checks
    (alerts.heatChecks || []).forEach(alert => {
      if (alert.nextHeatPredictionDate && isSameDay(date, parseISO(alert.nextHeatPredictionDate))) {
        dayEvents.push({ type: 'heat', animal: alert.livestock.tagId, title: 'Heat Check' });
      }
    });

    return dayEvents;
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <FaChevronLeft />
        </button>
        <h3 className="text-lg font-bold text-gray-800">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <button onClick={nextMonth} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <FaChevronRight />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEE";
    const days = [];
    let startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-semibold text-xs text-gray-500 py-2" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const dayEvents = getEventsForDate(day);
        const isToday = isSameDay(day, new Date());
        
        days.push(
          <div
            className={`min-h-[60px] p-1 border-t border-l border-gray-100 relative ${
              !isSameMonth(day, monthStart) ? "bg-gray-50 text-gray-300" : "bg-white text-gray-700"
            } ${isToday ? "bg-green-50" : ""} hover:bg-gray-50 cursor-pointer transition-colors`}
            key={day}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between">
              <span className={`text-xs font-semibold ${isToday ? 'text-green-600' : ''}`}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-1 space-y-1">
              {dayEvents.map((evt, idx) => (
                <div 
                  key={idx} 
                  className={`text-[10px] truncate px-1 rounded flex items-center ${
                    evt.type === 'medical' ? 'bg-red-100 text-red-700' :
                    evt.type === 'delivery' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}
                  title={`${evt.animal} - ${evt.title}`}
                >
                  {evt.type === 'medical' && <FaStethoscope className="mr-1 text-[8px]" />}
                  {evt.type === 'delivery' && <FaBabyCarriage className="mr-1 text-[8px]" />}
                  {evt.type === 'heat' && <FaHistory className="mr-1 text-[8px]" />}
                  <span className="truncate">{evt.animal}</span>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-r border-b border-gray-100">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 justify-center">
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-400 inline-block mr-1"></span> Medical</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block mr-1"></span> Delivery</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block mr-1"></span> Heat Check</div>
      </div>
    </div>
  );
};

export default LivestockCalendar;
