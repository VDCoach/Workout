import { useState, useEffect } from 'react';
import { DEFAULT_QUALITIES } from '../utils/physiology';

export function useData() {
  const [events, setEvents] = useState({});
  const [qualities, setQualities] = useState(DEFAULT_QUALITIES);
  const [dailyMetrics, setDailyMetrics] = useState({}); // Stores VFC, Readiness

  useEffect(() => {
    const loadedEvents = {};
    qualities.forEach(q => loadedEvents[q.id] = {});
    const loadedMetrics = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === 'physio_qualities') continue;
      
      const match = key?.match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
      if (match) {
        const dateStr = match[1];
        const category = match[2];
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (category === 'readiness' || category === 'vfc') {
              if(!loadedMetrics[dateStr]) loadedMetrics[dateStr] = {};
              loadedMetrics[dateStr][category] = parsed;
          } else if (loadedEvents[category] !== undefined) {
              loadedEvents[category][dateStr] = parsed;
          }
        } catch (e) {
          if (category === 'readiness' || category === 'vfc') {
              if(!loadedMetrics[dateStr]) loadedMetrics[dateStr] = {};
              loadedMetrics[dateStr][category] = parseInt(localStorage.getItem(key), 10);
          } else if (loadedEvents[category] !== undefined) {
            loadedEvents[category][dateStr] = { load: parseInt(localStorage.getItem(key), 10) * 5 };
          }
        }
      }
    }
    setEvents(loadedEvents);
    setDailyMetrics(loadedMetrics);
  }, [qualities]);

  const saveEvent = (qId, dateStr, sessionData) => {
    const key = `${dateStr}_${qId}`;
    if (!sessionData) {
      localStorage.removeItem(key);
      setEvents(prev => {
        const updated = { ...prev, [qId]: { ...prev[qId] } };
        delete updated[qId][dateStr];
        return updated;
      });
    } else {
      localStorage.setItem(key, JSON.stringify(sessionData));
      setEvents(prev => ({
        ...prev,
        [qId]: { ...prev[qId], [dateStr]: sessionData }
      }));
    }
  };

  const saveDailyMetric = (dateStr, type, score) => {
    const key = `${dateStr}_${type}`;
    if (!score || score === '') {
      localStorage.removeItem(key);
      setDailyMetrics(prev => {
        const updated = { ...prev, [dateStr]: { ...prev[dateStr] } };
        if(updated[dateStr]) delete updated[dateStr][type];
        return updated;
      });
    } else {
      localStorage.setItem(key, score);
      setDailyMetrics(prev => ({ ...prev, [dateStr]: { ...prev[dateStr], [type]: parseInt(score, 10) } }));
    }
  }

  const exportData = () => {
    const data = { events, dailyMetrics, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `physiotracker_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.events) {
          localStorage.clear();
          Object.entries(imported.events).forEach(([qId, dates]) => {
            Object.entries(dates).forEach(([date, data]) => {
              localStorage.setItem(`${date}_${qId}`, JSON.stringify(data));
            });
          });
          if (imported.dailyMetrics) {
              Object.entries(imported.dailyMetrics).forEach(([dateStr, metrics]) => {
                  Object.entries(metrics).forEach(([type, value]) => {
                      localStorage.setItem(`${dateStr}_${type}`, value);
                  });
              });
          }
          window.location.reload();
        }
      } catch (err) {
        alert("Erreur lors de l'import du fichier.");
      }
    };
    reader.readAsText(file);
  };

  const saveEventWithImpacts = (qId, dateStr, sessionData, applyImpacts) => {
    if (!sessionData) {
      const qDef = qualities.find(q => q.id === qId);
      if (qDef && qDef.impacts) {
        qDef.impacts.forEach(imp => {
          const key = `${dateStr}_${imp.id}`;
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.isSecondary && parsed.parentQId === qId) {
                saveEvent(imp.id, dateStr, null);
              }
            } catch(e) {}
          }
        });
      }
      saveEvent(qId, dateStr, null);
    } else {
      saveEvent(qId, dateStr, sessionData);

      if (applyImpacts) {
        const qDef = qualities.find(q => q.id === qId);
        if (qDef && qDef.impacts) {
          qDef.impacts.forEach(imp => {
            const secData = {
              ...sessionData,
              load: Math.round(sessionData.load * imp.ratio),
              isSecondary: true,
              parentQId: qId,
              originalLoad: sessionData.load
            };
            saveEvent(imp.id, dateStr, secData);
          });
        }
      }
    }
  };

  return { events, qualities, dailyMetrics, saveEvent, saveEventWithImpacts, saveDailyMetric, exportData, importData };
}
