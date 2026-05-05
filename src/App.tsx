import { useState, useMemo, useRef } from 'react';
import { generateTimeline, formatDisplayDate } from './utils/dateHelpers';
import { useData } from './hooks/useData';
import Grid from './components/Grid';
import ScoreModal from './components/ScoreModal';
import MetricModal from './components/MetricModal';
import QualityChartModal from './components/QualityChartModal';
import RadarChart from './components/RadarChart';
import MetricsDashboard from './components/MetricsDashboard';
import { FileUp, FileDown, Activity } from 'lucide-react';

export default function App() {
  const { events, qualities, dailyMetrics, saveEvent, saveEventWithImpacts, saveDailyMetric, exportData, importData } = useData();
  const [modalInfo, setModalInfo] = useState(null);
  const [metricModalInfo, setMetricModalInfo] = useState(null);
  const [qualityChartInfo, setQualityChartInfo] = useState(null);
  const fileInputRef = useRef(null);

  const timeline = useMemo(() => {
    return generateTimeline().map(day => ({
      ...day,
      display: formatDisplayDate(day.dateObj, day.offset)
    }));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans p-4 md:p-6 overflow-hidden relative">
      {/* Background Mesh Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full gap-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-wrap items-center justify-between px-4 lg:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg shadow-inner">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PhysioTracker <span className="text-blue-400 text-sm font-normal ml-2">PRO</span></h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest hidden sm:block">Performance & Residual Effects Dashboard</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-all">
              <FileUp size={16} className="text-slate-400" /> <span className="hidden sm:inline">Importer</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={importData} 
              accept=".json" 
              className="hidden" 
            />
            <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm font-semibold rounded-xl transition-all">
              <FileDown size={16} /> <span className="hidden sm:inline">Exporter</span>
            </button>
          </div>
        </header>

        {/* Main Body Layout */}
        <div className="flex flex-col xl:flex-row gap-6 min-h-0">
          
          {/* Left Sidebar */}
          <aside className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl">
              <RadarChart qualities={qualities} events={events} dailyMetrics={dailyMetrics} />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl text-sm text-slate-300">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Guide d'utilisation</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-400 text-lg leading-none mt-1">•</span>
                  <span className="leading-relaxed"><strong>Planification :</strong> Cliquez sur une cellule (ex: VO2max) pour logger la séance (RPE + Durée).</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-amber-400 text-lg leading-none mt-1">•</span>
                  <span className="leading-relaxed"><strong>Suivi (EMA) :</strong> Le système analyse la charge Aiguë vs Chronique pour limiter les blessures.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-pink-400 text-lg leading-none mt-1">•</span>
                  <span className="leading-relaxed"><strong>Readiness & VFC :</strong> Renseignez-les au dessus pour ajuster les facteurs de récupération métabolique.</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* Center Content */}
          <main className="flex-1 min-w-0 flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto backdrop-blur-md shadow-xl custom-scrollbar flex-1 w-full">
              <Grid 
                timeline={timeline} 
                events={events} 
                qualities={qualities} 
                dailyMetrics={dailyMetrics}
                onCellClick={(q, dateStr, currentData) => setModalInfo({ qId: q.id, qName: q.name, dateStr, currentData })}
                onQualityClick={(q) => setQualityChartInfo(q)}
                onMetricClick={(dateStr, type, currentValue) => {
                  setMetricModalInfo({
                    type,
                    dateStr,
                    currentValue,
                    title: type === 'readiness' ? 'Readiness Score' : 'VFC Matinale',
                    label: type === 'readiness' ? 'Score (1 à 10)' : 'Valeur VFC (ms)',
                    min: type === 'readiness' ? 1 : 1,
                    max: type === 'readiness' ? 10 : 300,
                    placeholder: type === 'readiness' ? 'Ex: 7' : 'Ex: 65'
                  });
                }}
              />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md w-full">
              <MetricsDashboard events={events} dailyMetrics={dailyMetrics} />
            </div>
          </main>
        </div>
      </div>

      {modalInfo && (
        <ScoreModal 
          info={modalInfo}
          qualities={qualities}
          onClose={() => setModalInfo(null)}
          onSave={(sessionData, applyImpacts) => saveEventWithImpacts(modalInfo.qId, modalInfo.dateStr, sessionData, applyImpacts)}
        />
      )}

      {metricModalInfo && (
        <MetricModal 
          info={metricModalInfo}
          onClose={() => setMetricModalInfo(null)}
          onSave={(val) => saveDailyMetric(metricModalInfo.dateStr, metricModalInfo.type, val)}
        />
      )}

      {qualityChartInfo && (
        <QualityChartModal 
          quality={qualityChartInfo}
          events={events[qualityChartInfo.id]}
          onClose={() => setQualityChartInfo(null)}
        />
      )}
    </div>
  );
}
