import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

// Helper function to request notification permissions
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

const useSocket = (userId, baseUrl = API_BASE_URL) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newAlerts, setNewAlerts] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Check if server is available before attempting connection
    const checkServerAndConnect = async () => {
      try {
        // Use a simple HEAD request with timeout to check server availability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const response = await fetch(`${baseUrl}/api/health-check`, {
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            connectSocket();
          } else {
            console.warn('Server health check failed, not connecting socket');
          }
        } catch (error) {
          console.warn('Server appears to be down, not connecting socket:', error.name);
        }
      } catch (error) {
        console.error('Error in server check:', error);
      }
    };

    const connectSocket = () => {
      // Initialize socket connection with better error handling
      socketRef.current = io(baseUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('join-user-room', userId);

        // Request notification permission when socket connects
        requestNotificationPermission()
          .then(granted => {
            if (granted) {
              // Notification permission granted
            } else {
              // Notification permission not granted
            }
          });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('new-disease-alert', (data) => {
        setNewAlerts(prev => [...prev, data.alert]);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          try {
            const notification = new Notification('Disease Alert', {
              body: data.message,
              icon: '/favicon.ico', // Use a reliable path that exists in public folder
              tag: `alert-${data.alert._id}`,
              requireInteraction: true // Keep notification visible until user interacts with it
            });

            // Handle notification click to navigate to alerts page
            notification.onclick = function () {
              window.focus(); // Focus on the browser window
              window.location.href = '/alerts'; // Navigate to alerts page
              notification.close();
            };
          } catch (error) {
            console.error('Failed to show notification:', error);
          }
        } else if (Notification.permission !== 'denied') {
          // Request permission if not granted or denied
          Notification.requestPermission();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      socket.on('reconnect_failed', () => {
        console.error('Socket failed to reconnect after multiple attempts');
        setIsConnected(false);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        // Reconnection attempt
      });
    };

    // Start the server check and connection process
    checkServerAndConnect();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, baseUrl]);

  // Store alerts in local storage to persist across page refreshes and offline periods
  useEffect(() => {
    if (newAlerts.length > 0) {
      try {
        // Save alerts to local storage with timestamp to expire them after 24 hours
        const alertsWithExpiry = newAlerts.map(alert => ({
          ...alert,
          expiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        }));
        localStorage.setItem(`agritech-alerts-${userId}`, JSON.stringify(alertsWithExpiry));
      } catch (error) {
        console.error('Failed to save alerts to local storage:', error);
      }
    }
  }, [newAlerts, userId]);

  // Load cached alerts from local storage on mount
  useEffect(() => {
    if (userId) {
      try {
        const cachedAlertsString = localStorage.getItem(`agritech-alerts-${userId}`);
        if (cachedAlertsString) {
          const cachedAlerts = JSON.parse(cachedAlertsString);
          // Filter out expired alerts
          const validAlerts = cachedAlerts.filter(alert => alert.expiry > Date.now());

          if (validAlerts.length > 0) {
            setNewAlerts(validAlerts);
          } else {
            // Clear expired alerts
            localStorage.removeItem(`agritech-alerts-${userId}`);
          }
        }
      } catch (error) {
        console.error('Failed to load alerts from local storage:', error);
      }
    }
  }, [userId]);

  const clearNewAlerts = () => {
    setNewAlerts([]);
    // Also clear from local storage
    try {
      localStorage.removeItem(`agritech-alerts-${userId}`);
    } catch (error) {
      console.error('Failed to clear alerts from local storage:', error);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    newAlerts,
    clearNewAlerts,
    requestNotificationPermission
  };
}

export default useSocket;
