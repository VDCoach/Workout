import { useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { calculateEMA } from '../utils/mathHelpers';
import { getLocalYYYYMMDD } from '../utils/dateHelpers';

export default function MetricsDashboard({ events, dailyMetrics }) {
  
  // 1. Préparation des données pour Recharts
  const chartData = useMemo(() => {
    const today = new Date();
    const rawData = [];
    
    // On génère l'historique des 30 derniers jours
    for (let i = -29; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = getLocalYYYYMMDD(d);
      
      const vfc = dailyMetrics[dateStr]?.vfc || null;
      let totalLoad = 0;
      
      Object.values(events).forEach(qualityDates => {
        if (qualityDates[dateStr]) totalLoad += qualityDates[dateStr].load || 0;
      });

      rawData.push({ dateStr, day: d.getDate(), vfc, load: totalLoad });
    }

    // Calcul des Moyennes Mobiles (EMA)
    const vfcRaw = rawData.map(d => d.vfc);
    const vfcEMA3 = calculateEMA(vfcRaw, 3);
    const vfcEMA7 = calculateEMA(vfcRaw, 7);

    const loadRaw = rawData.map(d => d.load);
    const loadEMA7 = calculateEMA(loadRaw, 7);
    const loadEMA21 = calculateEMA(loadRaw, 21);

    // Fusion des calculs dans les objets pour Recharts
    return rawData.map((data, i) => ({
      ...data,
      vfcEMA3: vfcEMA3[i] ? Math.round(vfcEMA3[i]) : null,
      vfcEMA7: vfcEMA7[i] ? Math.round(vfcEMA7[i]) : null,
      loadEMA7: Math.round(loadEMA7[i]),
      loadEMA21: Math.round(loadEMA21[i]),
    }));
  }, [events, dailyMetrics]);

  // 2. Le Coach Virtuel (Analyse algorithmique des tendances)
  const coachInsights = useMemo(() => {
    if (chartData.length === 0) return [];
    const latest = chartData[chartData.length - 1];
    const insights = [];

    // Ratio ACWR (Aiguë vs Chronique)
    const acwr = latest.loadEMA21 > 0 ? (latest.loadEMA7 / latest.loadEMA21).toFixed(2) : 1;
    
    if (acwr > 1.5) {
      insights.push({ type: 'danger', icon: <AlertTriangle size={18}/>, text: `Surcharge ! Votre charge récente (EMA 7) est de ${acwr}x votre habitude (EMA 21). Risque de blessure élevé.` });
    } else if (acwr > 1.2) {
      insights.push({ type: 'warning', icon: <TrendingUp size={18}/>, text: `Surcharge fonctionnelle (Ratio: ${acwr}). Parfait si vous êtes en bloc de développement, attention à ne pas faire durer.` });
    } else if (acwr < 0.8 && latest.loadEMA21 > 0) {
      insights.push({ type: 'info', icon: <TrendingDown size={18}/>, text: `Désentraînement ou Affûtage en cours (Ratio: ${acwr}).` });
    }

    // Tendance VFC
    if (latest.vfcEMA3 && latest.vfcEMA7) {
      if (latest.vfcEMA3 < latest.vfcEMA7 * 0.9) {
        insights.push({ type: 'danger', icon: <Activity size={18}/>, text: `Système nerveux fatigué. La VFC à court terme a chuté sous votre moyenne hebdomadaire.` });
      } else if (latest.vfcEMA3 > latest.vfcEMA7 * 1.05) {
        insights.push({ type: 'good', icon: <Activity size={18}/>, text: `Excellente récupération parasympathique. Le corps assimile très bien l'entraînement actuel.` });
      }
    }

    return insights;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/60 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
          <p className="m-0 mb-2 font-bold text-slate-100 uppercase text-[10px] tracking-wider">Jour {label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="m-0 text-sm font-semibold">
              {p.name} : {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 w-full flex flex-col gap-6">
      
      {/* ENCART COACH VIRTUEL */}
      {coachInsights.length > 0 && (
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
            🤖 Coach AI Analysis
          </h4>
          <div className="space-y-3">
            {coachInsights.map((insight, i) => {
              let bClass = 'bg-white/5 border border-white/5 text-slate-300';
              if (insight.type === 'danger') bClass = 'bg-red-500/10 border border-red-500/20 text-red-200';
              else if (insight.type === 'warning') bClass = 'bg-amber-500/10 border border-amber-500/20 text-amber-200';
              else if (insight.type === 'good') bClass = 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200';
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${bClass}`}>
                  <div className="mt-0.5 opacity-80 shrink-0">{insight.icon}</div>
                  <span className="leading-relaxed">{insight.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[250px] min-h-0">
        
        {/* GRAPHIQUE 1 */}
        <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-0 relative">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 shrink-0">Load Fatigue Analysis (Banister)</p>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAigue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f44336" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f44336" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChronique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4dabf5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4dabf5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                
                <Area type="monotone" dataKey="loadEMA7" name="Acute Fatigue (EMA7)" stroke="#f44336" strokeWidth={2} fillOpacity={1} fill="url(#colorAigue)" />
                <Area type="monotone" dataKey="loadEMA21" name="Chronic Load (EMA21)" stroke="#4dabf5" strokeWidth={2} fillOpacity={1} fill="url(#colorChronique)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPHIQUE 2 */}
        <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-0 relative">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 shrink-0">VFC Recovery Trends (HRV)</p>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                
                <Line type="monotone" dataKey="vfc" name="VFC Nette" stroke="rgba(255,255,255,0.2)" strokeWidth={1} dot={{ r: 2, fill: 'rgba(255,255,255,0.2)', strokeWidth: 0 }} connectNulls />
                <Line type="monotone" dataKey="vfcEMA3" name="VFC EMA3" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vfcEMA7" name="VFC Baseline EMA7" stroke="#e91e63" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
