import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useSocket from '../hooks/useSocket';

function AlertsBadge({
  userId,
  baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  onClick,
  className = '',
  showCount = true
}) {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);

  // Real-time socket connection
  const { newAlerts = [], clearNewAlerts } = useSocket(userId, baseUrl) || {};

  // Update unread count when new alerts arrive
  useEffect(() => {
    if (newAlerts && newAlerts.length > 0) {
      setUnreadCount(prev => prev + newAlerts.length);
      if (typeof clearNewAlerts === 'function') {
        clearNewAlerts();
      }
    }
  }, [newAlerts, clearNewAlerts]);

  async function fetchUnreadCount() {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      // Set a timeout to prevent long waiting times if server is down
      const controller = new AbortController();
      // store controller so we can abort on unmount
      controllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const url = `${baseUrl}/api/disease/alerts?userId=${userId}`;
      const res = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const count = (data.alerts || []).filter(alert => !alert.read).length;
        setUnreadCount(count);

        // Save to local storage for offline use
        localStorage.setItem(`alerts-count-${userId}`, count);
      }
    } catch (err) {
      // If the fetch was aborted (timeout or component unmount), don't treat as an error
      if (err && err.name === 'AbortError') {
        // Use cached count if available, but don't spam console with expected aborts
        const cachedCount = localStorage.getItem(`alerts-count-${userId}`);
        if (cachedCount !== null) {
          setUnreadCount(parseInt(cachedCount, 10));
        }
      } else {
        console.error('Failed to fetch alert count:', err);
        // Use cached count from localStorage if available
        const cachedCount = localStorage.getItem(`alerts-count-${userId}`);
        if (cachedCount !== null) {
          setUnreadCount(parseInt(cachedCount, 10));
        }
      }
    } finally {
      // clear current controller ref
      controllerRef.current = null;
      setLoading(false);
    }
  }

  useEffect(() => {
    // ref to abort in-flight requests
    fetchUnreadCount();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      // Abort any in-flight fetch when unmounting
      if (controllerRef.current) {
        try { controllerRef.current.abort(); } catch (_) { }
        controllerRef.current = null;
      }
    };
  }, [userId]);

  if (loading && unreadCount === 0) {
    return (
      <button
        className={`relative p-2 rounded-lg ${className}`}
        disabled
      >
        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative transition-colors ${className}`}
      title={t('disease_alerts') || 'Disease Alerts'}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>

      {showCount && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-50 notification-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// Make sure there's a default export for this component
export default AlertsBadge;
