import { useState } from 'react';

export default function ScoreModal({ info, qualities, onClose, onSave }) {
  const existing = info.currentData || { rpeMusc: '', rpeCardio: '', fatigue: '', duration: '' };
  
  const [rpeMusc, setRpeMusc] = useState(existing.rpeMusc || '');
  const [rpeCardio, setRpeCardio] = useState(existing.rpeCardio || '');
  const [fatigue, setFatigue] = useState(existing.fatigue || '');
  const [duration, setDuration] = useState(existing.duration || '');
  const [applyImpacts, setApplyImpacts] = useState(true);

  // Derive impacts for display
  const qDef = qualities.find(q => q.id === info.qId);
  const hasImpacts = qDef && qDef.impacts && qDef.impacts.length > 0;

  // La charge (Load) est calculée sur la moyenne des deux RPE pondérée par la durée
  const load = rpeMusc && rpeCardio && duration 
    ? Math.round(((Number(rpeMusc) + Number(rpeCardio)) / 2) * Number(duration)) 
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rpeMusc && rpeCardio && fatigue && duration) {
      onSave({ 
        rpeMusc: Number(rpeMusc), 
        rpeCardio: Number(rpeCardio), 
        fatigue: Number(fatigue), 
        duration: Number(duration), 
        load 
      }, applyImpacts);
    } else {
      onSave(null, applyImpacts);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-100 tracking-tight m-0">{info.qName}</h3>
        <p className="text-sm font-semibold text-blue-400 mt-1 mb-6">Séance du {info.dateStr}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Durée (min)</label>
            <input type="number" min="1" max="600" value={duration} onChange={(e) => setDuration(e.target.value)} autoFocus />
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 input-group !mb-0">
              <label>RPE Musculaire</label>
              <input type="number" min="1" max="10" placeholder="1-10" value={rpeMusc} onChange={(e) => setRpeMusc(e.target.value)} />
            </div>
            <div className="flex-1 input-group !mb-0">
              <label>RPE Cardio</label>
              <input type="number" min="1" max="10" placeholder="1-10" value={rpeCardio} onChange={(e) => setRpeCardio(e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label>Fatigue Perçue Globale (1-10)</label>
            <input type="number" min="1" max="10" value={fatigue} onChange={(e) => setFatigue(e.target.value)} placeholder="Épuisement après séance" />
          </div>

          <div className="load-preview flex flex-col gap-2">
            <div>Charge Calculée : <strong className="text-lg">{load > 0 ? load : '-'}</strong></div>
            {hasImpacts && (
              <div className="mt-2 pt-2 border-t border-blue-500/20">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-300 hover:text-blue-200 transition-colors">
                  <input type="checkbox" checked={applyImpacts} onChange={e => setApplyImpacts(e.target.checked)} className="rounded border-none accent-blue-500" />
                  Appliquer les impacts secondaires : {qDef.impacts.map(i => {
                    const targetName = qualities.find(q => q.id === i.id)?.name || i.id;
                    return `${targetName} (${i.ratio * 100}%)`;
                  }).join(', ')}
                </label>
              </div>
            )}
            {existing?.isSecondary && (
              <div className="mt-1 text-xs text-amber-500">
                ℹ️ Cette séance a été générée automatiquement en tant qu'impact secondaire.
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-delete" onClick={() => { onSave(null); onClose(); }}>Supprimer</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-save">Valider</button>
          </div>
        </form>
      </div>
    </div>
  );
}
