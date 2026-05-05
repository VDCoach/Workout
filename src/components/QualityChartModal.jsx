import { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { calculateEMA } from '../utils/mathHelpers';
import { getLocalYYYYMMDD } from '../utils/dateHelpers';
import { X } from 'lucide-react';

export default function QualityChartModal({ quality, events, onClose }) {
  const chartData = useMemo(() => {
    const today = new Date();
    const rawData = [];
    
    // Historique sur 60 jours ou 30 jours
    for (let i = -45; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = getLocalYYYYMMDD(d);
      
      let qLoad = 0;
      if (events && events[dateStr]) {
        qLoad = events[dateStr].load || 0;
      }

      rawData.push({ dateStr, day: d.getDate(), load: qLoad });
    }

    const loadRaw = rawData.map(d => d.load);
    const ema3 = calculateEMA(loadRaw, 3);
    const ema7 = calculateEMA(loadRaw, 7);
    const ema21 = calculateEMA(loadRaw, 21);

    return rawData.map((data, i) => ({
      ...data,
      ema3: Math.round(ema3[i]),
      ema7: Math.round(ema7[i]),
      ema21: Math.round(ema21[i]),
    }));
  }, [quality, events]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/60 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
          <p className="m-0 mb-2 font-bold text-slate-100 uppercase text-[10px] tracking-wider">Jour {label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="m-0 text-[12px] font-semibold">
              {p.name} : {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000}}>
      <div className="modal-content !w-[800px] !max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold text-slate-100 tracking-tight m-0 flex items-center gap-2">
             <span className="text-blue-400">📊</span> Analyse de Charge : {quality.name}
           </h3>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer border-none bg-transparent">
             <X size={20} />
           </button>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }}/>
              
              <Line type="monotone" dataKey="load" name="Charge Brute" stroke="rgba(255,255,255,0.2)" strokeWidth={1} dot={{ r: 2, fill: 'rgba(255,255,255,0.2)', strokeWidth: 0 }} connectNulls />
              <Line type="monotone" dataKey="ema3" name="EMA 3j (Aiguë)" stroke="#f44336" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ema7" name="EMA 7j (Récente)" stroke="#ff9800" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ema21" name="EMA 21j (Chronique)" stroke="#4dabf5" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
