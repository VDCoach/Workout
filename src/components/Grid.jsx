import { computeCellState } from '../utils/physiology';

export default function Grid({ timeline, events, qualities, dailyMetrics, onCellClick, onMetricClick, onQualityClick }) {
  return (
    <div className="w-full min-w-[800px]">
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-[#161619] text-[10px] uppercase text-slate-500 border-b border-white/10">
            <th className="p-3 w-40 sticky left-0 bg-[#161619] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Quality</th>
            {timeline.map((day) => (
              <th key={day.dateStr} className={`p-2 w-[70px] text-center border-l border-white/5 ${day.offset === 0 ? 'bg-blue-500/10 text-blue-300 font-extrabold border-x border-t border-t-blue-500/50 border-x-blue-500/20 shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)]' : ''}`}>
                <span>{day.display.prefix}</span><br />
                <span className={day.offset === 0 ? 'text-blue-300' : 'text-xs text-slate-400'}>{day.display.date}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-xs">
          {/* LIGNE SPECIALE : READINESS */}
          <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td className="p-3 font-semibold bg-[#161619] sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)] text-blue-400">Readiness (1-10)</td>
            {timeline.map((day) => {
              const score = dailyMetrics[day.dateStr]?.readiness || '-';
              
              const badgeClass = score === '-' ? 'text-slate-600'
                               : score >= 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                               : score >= 5 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                               : 'bg-red-500/20 text-red-400 border border-red-500/30';

              return (
                <td 
                  key={`ready-${day.dateStr}`} 
                  className={`p-1 text-center cursor-pointer hover:bg-white/5 transition-colors border-l border-white/5 ${day.offset === 0 ? 'bg-blue-500/5 border-x border-x-blue-500/20' : ''}`}
                  onClick={() => onMetricClick(day.dateStr, 'readiness', score)}
                >
                  <div className="flex justify-center items-center h-8">
                     <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${badgeClass}`}>
                        {score !== '-' ? `${score}/10` : '-'}
                     </span>
                  </div>
                </td>
              );
            })}
          </tr>

          {/* LIGNE SPECIALE : VFC */}
          <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td className="p-3 font-semibold bg-[#161619] sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)] text-emerald-400">VFC Matinale (ms)</td>
            {timeline.map((day) => {
                const vfc = dailyMetrics[day.dateStr]?.vfc || '-';
                return (
                <td 
                    key={`vfc-${day.dateStr}`} 
                    className={`p-1 text-center cursor-pointer hover:bg-white/5 transition-colors border-l border-white/5 ${day.offset === 0 ? 'bg-blue-500/5 border-x border-x-blue-500/20' : ''}`}
                    onClick={() => onMetricClick(day.dateStr, 'vfc', vfc)}
                >
                    <div className={`flex justify-center items-center h-8 font-bold ${vfc !== '-' ? 'text-emerald-300' : 'text-slate-600'}`}>
                        {vfc}
                    </div>
                </td>
                );
            })}
          </tr>

          {/* LIGNES DES QUALITÉS */}
          {qualities.map((q) => (
            <tr key={q.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td 
                className="p-3 font-semibold bg-[#161619] sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)] text-slate-200 cursor-pointer hover:text-blue-400 transition-colors group"
                onClick={() => onQualityClick(q)}
              >
                {q.name}
                <span className="text-[10px] text-slate-500 float-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity">📊</span>
              </td>
              {timeline.map((day) => {
                const readiness = dailyMetrics[day.dateStr]?.readiness || 7;
                const cellState = computeCellState(q, day.dateStr, events[q.id], readiness);
                const sessionData = events[q.id]?.[day.dateStr];
                
                return (
                  <td 
                    key={day.dateStr}
                    title={cellState.tooltip}
                    className={`p-1 text-center border-l border-white/5 ${day.offset === 0 ? 'bg-blue-500/5 border-x border-x-blue-500/20' : ''}`}
                  >
                     <div 
                        className={`relative flex items-center justify-center w-full h-8 rounded border border-white/5 cursor-pointer cell-interactive bg-${cellState.status} ${cellState.isBurnout ? 'burnout' : ''}`}
                        style={{ opacity: sessionData ? 1 : Math.max(0.2, cellState.opacity) }}
                        onClick={() => onCellClick(q, day.dateStr, sessionData)}
                     >
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded opacity-50 z-0"></div>
                       {cellState.isBurnout && <span className="absolute top-0 right-0 -mt-1 -mr-1 text-[10px] z-20">🔥</span>}
                       {sessionData && (
                         <span className={`relative z-10 badge ${sessionData.isSecondary ? 'badge-secondary' : ''}`}>
                           {sessionData.load}
                           {sessionData.isSecondary && <span className="text-[8px] ml-0.5 opacity-60">S</span>}
                         </span>
                       )}
                     </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
