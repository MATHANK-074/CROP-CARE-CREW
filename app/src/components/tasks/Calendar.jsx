import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { FaCalendarAlt, FaPlus, FaEye, FaEdit, FaTrash, FaTasks, FaFilter, FaCalendarPlus } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';

// Lightweight date helpers (no external deps)
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, count) => new Date(date.getFullYear(), date.getMonth() + count, 1);
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfWeek = (date) => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const formatISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Demo tasks for offline mode
const getDemoTasks = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    {
      _id: 'demo-1',
      title: 'Water tomato plants',
      description: 'Check soil moisture and water if needed',
      category: 'irrigation',
      priority: 'high',
      status: 'pending',
      dueDate: formatISODate(today),
      type: 'irrigation'
    },
    {
      _id: 'demo-2',
      title: 'Apply fertilizer to corn',
      description: 'Apply nitrogen-rich fertilizer to growing corn',
      category: 'fertilizer',
      priority: 'medium',
      status: 'pending',
      dueDate: formatISODate(tomorrow),
      type: 'fertilizer'
    },
    {
      _id: 'demo-3',
      title: 'Inspect for pests',
      description: 'Check plants for signs of pest damage',
      category: 'pest_control',
      priority: 'medium',
      status: 'pending',
      dueDate: formatISODate(nextWeek),
      type: 'pesticide'
    }
  ];
};

// Icon/color mapping
const TYPE_META = {
  sowing: { icon: '🌱', color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
  irrigation: { icon: '💧', color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  fertilizer: { icon: '🧴', color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  fertilization: { icon: '🧴', color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  pesticide: { icon: '🐛', color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  pest_control: { icon: '🐛', color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  harvest: { icon: '🌾', color: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  harvesting: { icon: '🌾', color: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  planting: { icon: '🌱', color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
  pruning: { icon: '✂️', color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  soil_management: { icon: '🪴', color: 'text-emerald-700', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  disease_treatment: { icon: '🧪', color: 'text-pink-600', bg: 'bg-pink-50', badge: 'bg-pink-100 text-pink-700' },
  weather_response: { icon: '⛅', color: 'text-sky-600', bg: 'bg-sky-50', badge: 'bg-sky-100 text-sky-700' },
  general: { icon: '📝', color: 'text-gray-700', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700' },
};

const getTypeKey = (task) => (task.type || task.category || 'general');

const getTypeMeta = (task) => TYPE_META[getTypeKey(task)] || TYPE_META.general;

const Legend = () => {
  const items = [
    { key: 'sowing', label: 'Sowing' },
    { key: 'irrigation', label: 'Irrigation' },
    { key: 'fertilizer', label: 'Fertilizer' },
    { key: 'pesticide', label: 'Pesticide' },
    { key: 'harvest', label: 'Harvest' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 rounded-md bg-white/60">
      {items.map(({ key, label }) => {
        const m = TYPE_META[key];
        return (
          <div key={key} className="flex items-center gap-1 text-xs sm:text-sm">
            <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded ${m.bg} ${m.color}`}>{m.icon}</span>
            <span className="text-gray-700">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Calendar component
const Calendar = ({ initialDate = new Date(), fetchUrl = '/api/tasks' }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ type: 'all', status: 'all', field: 'all' });
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'general',
    dueDate: ''
  });
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'agenda'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(null); // null = unknown, true = available, false = unavailable

  // Check server connectivity
  const checkServerConnectivity = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health-check`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      const isAvailable = response.ok;
      setServerAvailable(isAvailable);
      if (!isAvailable) {
        setDemoMode(true);
        setTasks(getDemoTasks());
        setError('Server not responding - Calendar running in demo mode');
      }
      return isAvailable;
    } catch (error) {
      console.warn('Server connectivity check failed:', error.message);
      setServerAvailable(false);
      setDemoMode(true);
      setTasks(getDemoTasks());
      setError('Cannot connect to server - Calendar running in demo mode');
      return false;
    }
  }, []);

  const parseDueDate = (t) => new Date(t.dueDate || t.date || t.due || t.scheduledAt || t.scheduled || t.start);

  const normalizedTasks = useMemo(() => {
    // Normalize fields and filter by current visible range
    return tasks
      .map((t) => ({
        ...t,
        _id: t._id || t.id,
        done: typeof t.done === 'boolean' ? t.done : (t.status ? t.status === 'done' : false),
        due: parseDueDate(t),
        typeKey: getTypeKey(t),
      }))
      .filter((t) => !isNaN(t.due));
  }, [tasks]);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const gridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const gridEnd = useMemo(() => endOfWeek(monthEnd), [monthEnd]);

  const visibleStart = gridStart;
  const visibleEnd = gridEnd;

  const days = useMemo(() => {
    const res = [];
    const d = new Date(visibleStart);
    while (d <= visibleEnd) {
      res.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return res;
  }, [visibleStart, visibleEnd]);

  const tasksByDate = useMemo(() => {
    const map = new Map();
    for (const day of days) {
      map.set(formatISODate(day), []);
    }

    for (const t of normalizedTasks) {
      const key = formatISODate(t.due);
      if (!map.has(key)) continue;

      // Apply filters
      if (filters.type !== 'all' && getTypeKey(t) !== filters.type) continue;
      if (filters.status !== 'all') {
        const stat = t.done ? 'done' : (t.status || 'pending');
        if (stat !== filters.status) continue;
      }
      if (filters.field !== 'all') {
        const fieldName = t.field || t.fieldName || t.location || t.cropField || '';
        if (String(fieldName) !== String(filters.field)) continue;
      }

      map.get(key).push(t);
    }

    // Sort tasks within a day by priority then title
    for (const [k, list] of map) {
      list.sort((a, b) => {
        const pa = (a.priority || '').toString();
        const pb = (b.priority || '').toString();
        if (pa === pb) return (a.title || '').localeCompare(b.title || '');
        return pa.localeCompare(pb);
      });
    }

    return map;
  }, [normalizedTasks, days, filters]);

  const uniqueFields = useMemo(() => {
    const s = new Set();
    normalizedTasks.forEach((t) => {
      const field = t.field || t.fieldName || t.location || t.cropField;
      if (field) s.add(field);
    });
    return Array.from(s);
  }, [normalizedTasks]);

  const uniqueTypes = useMemo(() => {
    const s = new Set();
    normalizedTasks.forEach((t) => s.add(getTypeKey(t)));
    return Array.from(s);
  }, [normalizedTasks]);

  const lastRangeRef = React.useRef('');
  const fetchTasks = useCallback(async (rangeStart, rangeEnd) => {
    setLoading(true);
    setError(null);

    // Check server connectivity first if not already checked
    if (serverAvailable === null) {
      const isConnected = await checkServerConnectivity();
      if (!isConnected) {
        setLoading(false);
        return;
      }
    } else if (serverAvailable === false || demoMode) {
      // Server known to be unavailable, use demo data
      setTasks(getDemoTasks());
      setError('Server unavailable - Using demo data');
      setLoading(false);
      return;
    }

    try {
      // Avoid duplicate requests when the date range hasn't changed
      const key = `${new Date(rangeStart).toISOString()}_${new Date(rangeEnd).toISOString()}`;
      if (lastRangeRef.current === key) {
        setLoading(false);
        return;
      }
      lastRangeRef.current = key;
      const token = localStorage.getItem('token');
      // Build URL and include date range for efficiency if targeting /api/tasks
      const base = `${API_BASE_URL}${fetchUrl.startsWith('/') ? fetchUrl : `/${fetchUrl}`}`;
      const params = new URLSearchParams();
      if (base.endsWith('/api/tasks') || base.endsWith('/api/tasks/')) {
        if (rangeStart) params.set('dueAfter', new Date(rangeStart).toISOString());
        if (rangeEnd) params.set('dueBefore', new Date(rangeEnd).toISOString());
        // Fetch a generous page to cover month/week
        params.set('limit', '500');
      }
      const url = params.toString() ? `${base}?${params.toString()}` : base;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });


      if (res.status === 404) {
        console.warn('Tasks API not available - using demo mode');
        setDemoMode(true);
        setServerAvailable(false);
        setTasks(getDemoTasks());
        setError('Server not available - Calendar running in demo mode with sample tasks');
        return;
      } if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.tasks || data.items || data.data || []);
      setTasks(arr);
    } catch (e) {
      console.error(e);
      if (e.message.includes('fetch') || e.name === 'TypeError') {
        setDemoMode(true);
        setServerAvailable(false);
        setTasks(getDemoTasks());
        setError('Cannot connect to server - Calendar running in demo mode with sample tasks');
      } else {
        setError(e.message || 'Failed to load tasks');
        // Set empty tasks array for other errors
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  // Fetch tasks when the visible range changes (month/week) or on first mount
  useEffect(() => {
    fetchTasks(visibleStart, visibleEnd);
  }, [fetchTasks, visibleStart, visibleEnd]);

  const markDone = useCallback(async (task) => {
    const id = task._id || task.id;
    if (!id) return;

    // If in demo mode or server unavailable, update locally
    if (demoMode || serverAvailable === false) {
      setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? {
        ...t,
        done: true,
        status: 'done',
        completedDate: new Date().toISOString(),
      } : t)));
      return;
    }

    const token = localStorage.getItem('token');

    // try POST /tasks/:id/done (AgriAssist style) then fallback to PUT /tasks/:id/status
    const tryRequests = [
      {
        method: 'POST',
        url: `${API_BASE_URL}/api/tasks/${id}/done`,
        body: null,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      {
        method: 'PUT',
        url: `${API_BASE_URL}/api/tasks/${id}/status`,
        body: JSON.stringify({ status: 'done' }),
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      }
    ];

    let ok = false;
    for (const req of tryRequests) {
      try {
        const res = await fetch(req.url, { method: req.method, headers: req.headers, body: req.body });
        if (res.ok) { ok = true; break; }
      } catch (e) {
        // continue to next attempt
      }
    }

    if (ok) {
      // Update local state
      setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? {
        ...t,
        done: true,
        status: 'done',
        completedDate: new Date().toISOString(),
      } : t)));
    } else {
      setError('Server not available - Task updates disabled in demo mode');
    }
  }, [demoMode, serverAvailable]);

  const skipTask = useCallback(async (task) => {
    const id = task._id || task.id;
    if (!id) return;

    // If in demo mode or server unavailable, update locally
    if (demoMode || serverAvailable === false) {
      setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? {
        ...t,
        status: 'skipped',
        completedDate: new Date().toISOString(),
      } : t)));
      return;
    }

    const token = localStorage.getItem('token');

    const tryRequests = [
      {
        method: 'PUT',
        url: `${API_BASE_URL}/api/tasks/${id}/status`,
        body: JSON.stringify({ status: 'skipped' }),
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      }
    ];

    let ok = false;
    for (const req of tryRequests) {
      try {
        const res = await fetch(req.url, { method: req.method, headers: req.headers, body: req.body });
        if (res.ok) { ok = true; break; }
      } catch (e) {
        // continue to next attempt
      }
    }

    if (ok) {
      // Update local state
      setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? {
        ...t,
        status: 'skipped',
        completedDate: new Date().toISOString(),
      } : t)));
    } else {
      setError('Server not available - Task updates disabled in demo mode');
    }
  }, [demoMode, serverAvailable]);

  const createNewTask = useCallback(async () => {
    // If in demo mode or server unavailable, create task locally
    if (demoMode || serverAvailable === false) {
      const newDemoTask = {
        _id: `demo-${Date.now()}`,
        ...newTask,
        dueDate: newTask.dueDate || (selectedDay ? formatISODate(selectedDay) : formatISODate(new Date())),
        status: 'pending'
      };
      setTasks(prev => [...prev, newDemoTask]);
      setShowNewTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', type: 'general', dueDate: '' });
      return;
    }

    // Check server connectivity before attempting API call
    if (serverAvailable === null) {
      const isConnected = await checkServerConnectivity();
      if (!isConnected) {
        // Server is down, create task locally
        const newDemoTask = {
          _id: `demo-${Date.now()}`,
          ...newTask,
          dueDate: newTask.dueDate || (selectedDay ? formatISODate(selectedDay) : formatISODate(new Date())),
          status: 'pending'
        };
        setTasks(prev => [...prev, newDemoTask]);
        setShowNewTaskModal(false);
        setNewTask({ title: '', description: '', priority: 'medium', type: 'general', dueDate: '' });
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const taskData = {
        ...newTask,
        dueDate: newTask.dueDate || (selectedDay ? formatISODate(selectedDay) : formatISODate(new Date())),
        status: 'pending',
        source: 'user_created'
      };

      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(taskData)
      });

      if (res.status === 404) {
        // Switch to demo mode and create task locally
        setDemoMode(true);
        const newDemoTask = {
          _id: `demo-${Date.now()}`,
          ...taskData
        };
        setTasks(prev => [...prev, newDemoTask]);
        setError('Server not available - Task created in demo mode');
        setShowNewTaskModal(false);
        setNewTask({ title: '', description: '', priority: 'medium', type: 'general', dueDate: '' });
        return;
      }

      if (res.ok) {
        const newTaskData = await res.json();
        setTasks(prev => [...prev, newTaskData]);
        setShowNewTaskModal(false);
        setNewTask({ title: '', description: '', priority: 'medium', type: 'general', dueDate: '' });
      } else {
        setError('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      // Server connection failed, switch to demo mode
      setServerAvailable(false);
      setDemoMode(true);
      const newDemoTask = {
        _id: `demo-${Date.now()}`,
        ...newTask,
        dueDate: newTask.dueDate || (selectedDay ? formatISODate(selectedDay) : formatISODate(new Date())),
        status: 'pending'
      };
      setTasks(prev => [...prev, newDemoTask]);
      setError('Connection failed - Task created in demo mode');
      setShowNewTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', type: 'general', dueDate: '' });
    }
  }, [newTask, selectedDay, demoMode, serverAvailable, checkServerConnectivity]);  // UI helpers
  const DayHeader = () => (
    <div className="grid grid-cols-7 text-xs font-semibold text-gray-600">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div key={d} className="px-2 py-1 text-center">{d}</div>
      ))}
    </div>
  );

  const DayCell = ({ day }) => {
    const key = formatISODate(day);
    const inMonth = day.getMonth() === currentMonth.getMonth();
    const today = isSameDay(day, new Date());
    const dayTasks = tasksByDate.get(key) || [];
    const maxItems = 3; // Show 3 tasks on all screen sizes
    const visibleTasks = dayTasks.slice(0, maxItems);
    const hiddenCount = Math.max(0, dayTasks.length - visibleTasks.length);

    const completedTasks = dayTasks.filter(t => t.done || t.status === 'done').length;
    const urgentTasks = dayTasks.filter(t => (t.priority === 'urgent' || t.priority === 'high')).length;

    return (
      <div
        className={`group border p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] overflow-hidden rounded hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 ${inMonth ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
          } ${today ? 'border-2 border-green-500 bg-green-50 hover:bg-green-100' : ''
          } hover:border-gray-300`}
        onClick={() => { setSelectedDay(day); setShowDayModal(true); }}
      >
        {/* Day header */}
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={`text-xs sm:text-sm font-semibold ${inMonth ? 'text-gray-800' : 'text-gray-400'} ${today ? 'text-green-700' : ''}`}>
              {day.getDate()}
            </span>
            {dayTasks.length > 0 && (
              <div className="flex items-center gap-1">
                <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded font-medium ${urgentTasks > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {dayTasks.length}
                </span>
                {completedTasks > 0 && (
                  <span className="text-[9px] sm:text-[10px] bg-green-100 text-green-700 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                    ✓ {completedTasks}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {today && <span className="text-[8px] sm:text-[9px] uppercase text-green-600 font-semibold bg-green-100 px-1 sm:px-2 py-0.5 rounded hidden sm:inline">Today</span>}
              {urgentTasks > 0 && <span className="text-red-500 text-xs">🔥</span>}
            </div>
          </div>
        </div>
        {/* Tasks display */}
        <div className="space-y-1 max-h-12 sm:max-h-20 overflow-hidden">
          {visibleTasks.map((t, index) => {
            const m = getTypeMeta(t);
            const tooltip = [t.field || t.fieldName, t.crop || t.cropName].filter(Boolean).join(' · ');
            const isDone = t.done || t.status === 'done';
            const isSkipped = t.status === 'skipped';
            const isUrgent = t.priority === 'urgent' || t.priority === 'high';

            return (
              <div key={t._id || t.id}
                title={tooltip}
                className={`group flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs ${isDone
                  ? 'opacity-60 line-through bg-gray-100'
                  : isSkipped
                    ? 'opacity-60 line-through bg-yellow-100'
                    : `${m.bg} hover:opacity-80 ${isUrgent ? 'border border-red-300' : ''}`
                  }`}
              >
                <span className={`${m.color} text-xs sm:text-sm`}>{m.icon}</span>
                <span className={`flex-1 truncate font-medium ${isDone ? 'text-gray-500' : isSkipped ? 'text-yellow-600' : 'text-gray-800'
                  }`}>
                  {t.title || t.name || 'Task'}
                </span>

                {/* Priority indicator */}
                {isUrgent && !isDone && !isSkipped && (
                  <span className="text-red-500 text-[10px] sm:text-xs">!</span>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  {!isDone && !isSkipped ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markDone(t);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-green-500 text-white hover:bg-green-600"
                        title="Complete"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipTask(t);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                        title="Skip"
                      >
                        ⊝
                      </button>
                    </>
                  ) : isDone ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : (
                    <span className="text-yellow-600 text-xs">⊝</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show more button */}
          {hiddenCount > 0 && (
            <div
              className="w-full text-[9px] sm:text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-center cursor-pointer border border-blue-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDay(day);
                setShowDayModal(true);
              }}
              title={`View all ${dayTasks.length} tasks for this day`}
            >
              <span className="font-medium">+{hiddenCount} more</span>
            </div>
          )}
        </div>

        {/* Hover overlay with quick actions */}
        <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const year = day.getFullYear();
              const month = String(day.getMonth() + 1).padStart(2, '0');
              const dayNum = String(day.getDate()).padStart(2, '0');
              const formattedDate = `${year}-${month}-${dayNum}`;
              setNewTask(prev => ({ ...prev, dueDate: formattedDate }));
              setShowNewTaskModal(true);
            }}
            className="bg-green-500 text-white p-1 rounded-full text-xs hover:bg-green-600 transition-colors shadow-md"
            title="Add new task"
          >
            <FaPlus className="w-2 h-2" />
          </button>
        </div>
      </div>
    );
  };

  const CalendarGrid = () => (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => <DayCell key={d.toISOString()} day={d} />)}
    </div>
  );

  const MonthNav = () => (
    <div className="flex items-center justify-between mb-3 bg-gradient-to-r from-green-50 to-teal-50 p-2 rounded">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
        >◀</button>
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => setCurrentMonth(startOfMonth(new Date()))}
        >Today</button>
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >▶</button>
        <div className="ml-3">
          <div className="text-lg font-semibold text-gray-800">
            {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-gray-500">
            {visibleStart.toLocaleDateString()} – {visibleEnd.toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Filters */}
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
          <option value="skipped">Skipped</option>
        </select>

        <select
          value={filters.field}
          onChange={(e) => setFilters((f) => ({ ...f, field: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All fields</option>
          {uniqueFields.map((f) => (
            <option key={String(f)} value={String(f)}>{String(f)}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* Simple header */}
      <div className="bg-white border-b border-gray-200 p-3 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-green-100 p-2 sm:p-3 rounded">
              <FaCalendarAlt className="text-green-600 text-lg sm:text-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Farm Calendar
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                Manage your agricultural tasks and schedule
              </p>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded transition-colors ${showFilters ? 'bg-gray-200' : ''
                }`}
              title="Toggle filters"
            >
              <FaFilter className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setNewTask(prev => ({ ...prev, dueDate: selectedDay ? formatISODate(selectedDay) : '' }));
                setShowNewTaskModal(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
              title="Add new task"
            >
              <FaPlus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Simple month navigation */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded flex-shrink-0"
              >
                ◀
              </button>
              <button
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 sm:px-4 rounded font-medium text-sm sm:text-base"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded flex-shrink-0"
              >
                ▶
              </button>
            </div>

            <div className="sm:ml-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                {visibleStart.toLocaleDateString()} – {visibleEnd.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-gray-800 self-end sm:self-auto">
            <div className="text-right">
              <div className="text-xs sm:text-sm text-gray-600">Total Tasks</div>
              <div className="text-xl sm:text-2xl font-semibold">{normalizedTasks.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Demo mode banner */}
      {error && (
        <div className={`mx-3 sm:mx-6 mt-4 p-3 rounded-lg border ${error.includes('demo mode') || error.includes('Server not available')
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {error.includes('demo mode') || error.includes('Server not available') ? '🔧' : '⚠️'}
            </span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Filters and Legend section */}
      <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Task Categories</h3>
          <div className="text-xs sm:text-sm text-gray-500">
            {normalizedTasks.filter(t => t.done || t.status === 'done').length} of {normalizedTasks.length} completed
          </div>
        </div>

        <Legend />

        {/* Collapsible filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All types</option>
                  {uniqueTypes.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="done">Completed</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              {uniqueFields.length > 0 && (
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">Field:</label>
                  <select
                    value={filters.field}
                    onChange={(e) => setFilters((f) => ({ ...f, field: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">All fields</option>
                    {uniqueFields.map((f) => (
                      <option key={String(f)} value={String(f)}>{String(f)}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setFilters({ type: 'all', status: 'all', field: 'all' })}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Headers */}
      <DayHeader />

      {/* Grid */}
      <div className="mt-1">
        {loading && (
          <div className="text-center text-gray-500 py-6">Loading tasks…</div>
        )}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 p-2 rounded mb-2">{error}</div>
        )}
        {!loading && (
          <CalendarGrid />)
        }
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Add New Task
                </h3>
                <button
                  onClick={() => {
                    setShowNewTaskModal(false);
                    setNewTask({ title: '', description: '', priority: 'medium', type: 'general', dueDate: '' });
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter task title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  rows="3"
                  placeholder="Enter task description..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    <option value="general">General</option>
                    <option value="sowing">Sowing</option>
                    <option value="irrigation">Irrigation</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="pesticide">Pesticide</option>
                    <option value="harvest">Harvest</option>
                    <option value="pruning">Pruning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowNewTaskModal(false);
                  setNewTask({ title: '', description: '', priority: 'medium', type: 'general', dueDate: '' });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={createNewTask}
                disabled={!newTask.title.trim()}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple day modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDayModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden max-h-[95vh]">
            {/* Modal header */}
            <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {selectedDay.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    {(tasksByDate.get(formatISODate(selectedDay)) || []).length} tasks scheduled
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      const year = selectedDay.getFullYear();
                      const month = String(selectedDay.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDay.getDate()).padStart(2, '0');
                      const formattedDate = `${year}-${month}-${day}`;
                      setNewTask(prev => ({ ...prev, dueDate: formattedDate }));
                      setShowNewTaskModal(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs sm:text-sm font-medium"
                  >
                    + Add Task
                  </button>
                  <button
                    onClick={() => setShowDayModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {(tasksByDate.get(formatISODate(selectedDay)) || []).length === 0 ? (
                <div className="text-center py-8">
                  <FaCalendarPlus className="text-gray-300 text-4xl mb-4 mx-auto" />
                  <p className="text-gray-500 mb-4">No tasks scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(tasksByDate.get(formatISODate(selectedDay)) || []).map((t, index) => {
                    const m = getTypeMeta(t);
                    const isDone = t.done || t.status === 'done';
                    const isSkipped = t.status === 'skipped';
                    const isUrgent = t.priority === 'urgent' || t.priority === 'high';
                    const tooltip = [t.field || t.fieldName, t.crop || t.cropName].filter(Boolean).join(' · ');

                    return (
                      <div
                        key={t._id || t.id}
                        className={`p-4 rounded border hover:shadow-md ${isDone
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : isSkipped
                            ? 'bg-yellow-50 border-yellow-200 opacity-60'
                            : `${m.bg} border-gray-200`
                          } ${isUrgent && !isDone && !isSkipped ? 'border-red-300' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded ${m.bg.replace('50', '100')}`}>
                            <span className={`${m.color} text-lg`}>{m.icon}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold truncate ${isDone ? 'line-through text-gray-500' : isSkipped ? 'line-through text-yellow-600' : 'text-gray-800'
                                }`}>
                                {t.title || t.name || 'Task'}
                              </h4>
                              {isUrgent && !isDone && !isSkipped && (
                                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                                  URGENT
                                </span>
                              )}
                            </div>

                            {t.description && (
                              <p className={`text-sm mb-2 ${isDone ? 'text-gray-400' : isSkipped ? 'text-yellow-500' : 'text-gray-600'
                                }`}>
                                {t.description}
                              </p>
                            )}

                            {tooltip && (
                              <p className="text-xs text-gray-500 mb-2">
                                🌾 {tooltip}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-2 py-1 rounded font-medium ${m.badge}`}>
                                {(t.type || t.category || 'general').charAt(0).toUpperCase() + (t.type || t.category || 'general').slice(1)}
                              </span>

                              <div className="flex items-center gap-2">
                                {!isDone && !isSkipped ? (
                                  <>
                                    <button
                                      onClick={() => markDone(t)}
                                      className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600 font-medium"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => skipTask(t)}
                                      className="bg-yellow-500 text-white text-xs px-3 py-1 rounded hover:bg-yellow-600 font-medium"
                                    >
                                      Skip
                                    </button>
                                  </>
                                ) : isDone ? (
                                  <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                    ✓ Completed
                                  </span>
                                ) : (
                                  <span className="text-yellow-600 text-sm font-medium flex items-center gap-1">
                                    ⊝ Skipped
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-600">
                {(tasksByDate.get(formatISODate(selectedDay)) || []).filter(t => t.done || t.status === 'done').length} completed
                {' · '}
                {(tasksByDate.get(formatISODate(selectedDay)) || []).filter(t => !(t.done || t.status === 'done')).length} pending
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 self-end sm:self-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
