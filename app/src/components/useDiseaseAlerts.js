import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function useDiseaseAlerts(userId) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let ignore = false;

    const fetchAlerts = async () => {
      try {
        // Only attempt fetch if online
        if (!isOnline) {

          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/disease/alerts?userId=${userId}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const data = await res.json();

          if (!ignore && data.alerts && data.alerts.length > 0) {
            // Show alerts as toast notifications
            data.alerts.forEach(alert => {
              // Use disease name in user's language if available
              const diseaseName = alert.bilingualData
                ? (alert.bilingualData[navigator.language.startsWith('ta') ? 'tamil' :
                  (navigator.language.startsWith('hi') ? 'hindi' : 'english')].disease || alert.disease)
                : alert.disease;

              toast.warn(`${t('alerts')}: ${diseaseName} ${t('detected')} ${t('nearby')}!`, {
                autoClose: 10000,
                onClick: () => {
                  // Navigate to alerts page on click
                  window.location.href = '/alerts';
                }
              });

              // Show browser notification if allowed
              if (Notification.permission === 'granted') {
                try {
                  const notification = new Notification(t('alerts'), {
                    body: `${diseaseName} ${t('detected')} ${t('nearby')}!`,
                    icon: '/favicon.ico',
                    tag: `alert-${alert._id}`,
                    requireInteraction: true
                  });

                  notification.onclick = function () {
                    window.focus();
                    window.location.href = '/alerts';
                    notification.close();
                  };
                } catch (error) {
                  console.error('Failed to show notification:', error);
                }
              }
            });

            // Mark alerts as read
            if (isOnline) {
              try {
                await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/disease/alerts/read`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                  signal: controller.signal
                });
              } catch (error) {
                if (error.name !== 'AbortError') {
                  console.error('Error marking alerts as read:', error);
                }
              }
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching alerts:', error);
          }
        }
      } catch (error) {
        console.error('Unexpected error in alert fetching:', error);
      }
    };

    // Initial fetch
    fetchAlerts();

    // Poll for new alerts every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);

    // Also fetch when coming back online
    const handleOnlineCallback = () => {

      fetchAlerts();
    };

    window.addEventListener('online', handleOnlineCallback);

    return () => {
      ignore = true;
      clearInterval(interval);
      window.removeEventListener('online', handleOnlineCallback);
    };
  }, [userId, isOnline, t]);
}
