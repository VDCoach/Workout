export const DEFAULT_QUALITIES = [
  { id: 'vo2max', name: 'VO2max', g: 4, o: 3, impacts: [{ id: 'seuil', ratio: 0.6 }, { id: 'ef', ratio: 0.4 }, { id: 'leg', ratio: 0.4 }, { id: 'co2', ratio: 0.4 }, { id: 'plyo', ratio: 0.4 }] },
  { id: 'seuil', name: 'Seuil', g: 5, o: 3, impacts: [{ id: 'vo2max', ratio: 0.3 }, { id: 'ef', ratio: 0.4 }, { id: 'leg', ratio: 0.3 }, { id: 'co2', ratio: 0.3 }, { id: 'plyo', ratio: 0.2 }] },
  { id: 'ef', name: 'Endurance Fondamentale', g: 7, o: 4, impacts: [{ id: 'leg', ratio: 0.2 }, { id: 'co2', ratio: 0.2 }] },
  { id: 'sprint', name: 'Sprint / Alactique', g: 4, o: 2, impacts: [{ id: 'seuil', ratio: 0.3 }, { id: 'vo2max', ratio: 0.4 }, { id: 'ef', ratio: 0.2 }, { id: 'leg', ratio: 0.8 }, { id: 'plyo', ratio: 0.8 }, { id: 'co2', ratio: 0.6 }] },
  { id: 'pull', name: 'Musculation Pull', g: 4, o: 3 },
  { id: 'push', name: 'Musculation Push', g: 4, o: 3 },
  { id: 'leg', name: 'Musculation Leg', g: 4, o: 3, impacts: [{ id: 'plyo', ratio: 0.3 }, { id: 'sprint', ratio: 0.2 }] }, // Erreur de syntaxe corrigée ici
  { id: 'plyo', name: 'Plyométrie', g: 3, o: 2, impacts: [{ id: 'leg', ratio: 0.4 }, { id: 'sprint', ratio: 0.2 }] },
  { id: 'co2', name: 'Tolérance CO2', g: 4, o: 2 },
  { id: 'abdos', name: 'Protocole Abdos', g: 5, o: 3 },
  { id: 'gut', name: 'Gut Training', g: 10, o: 5 },
  { id: 'descente', name: 'Excentrique Descente', g: 11, o: 7, impacts: [{ id: 'leg', ratio: 0.8 }] },
  { id: 'proprio', name: 'Proprioception', g: 3, o: 2 }
];

export function computeCellState(qDef, targetDateStr, eventsForQuality, readinessForDate = 7) {
  const targetTime = new Date(targetDateStr).getTime();
  let bestStatus = 'red';
  let daysLeft = 0;
  let opacity = 1;
  let currentLevel = 0; // Pour le graphique Radar (0 à 100%)
  let recentLoadSum = 0; // Pour tracker le risque de burnout (SNC cramé)

  // Modificateur de récupération :
  // Basé sur une échelle de 10.
  const recoveryMod = readinessForDate < 5 ? 0.8 
                    : readinessForDate < 8 ? 1 
                    : readinessForDate < 10 ? 1.1 
                    : 1.2;

  for (const [eventDate, data] of Object.entries(eventsForQuality || {})) {
    const eventTime = new Date(eventDate).getTime();
    const daysSince = Math.round((targetTime - eventTime) / (1000 * 3600 * 24));

    if (daysSince >= 0) {
      let load = 0;

      if (typeof data === 'object') {
        // Si on dispose des données brutes (Durée, RPEs, Fatigue)
        if (data.duration && data.rpeMusculaire !== undefined && data.rpeCardio !== undefined && data.fatigue !== undefined) {
          // 1. RPE global lissé
          const rpeGlobal = (data.rpeMusculaire + data.rpeCardio) / 2;
          // 2. Charge de base avec exposant non-linéaire pour casser le biais de volume
          const baseLoad = data.duration * Math.pow(rpeGlobal, 1.5);
          // 3. Modificateur de fatigue post-séance (ex: fatigue de 5/10 = x1.0, 10/10 = x1.5)
          const fatigueFactor = 0.5 + (data.fatigue / 10);
          // 4. Charge finale
          load = baseLoad * fatigueFactor;
        } else {
          // Fallback : Si la charge est déjà calculée et stockée en amont
          load = data.load || 0;
        }
      } else {
        // Fallback pour les anciennes données stockées sous forme de nombre simple
        load = data * 5;
      }
      
      // On considère qu'une charge de 1000 est notre 100% avec la nouvelle formule non-linéaire.
      // On cap l'intensité max à 1.2 (120%) pour éviter des durées aberrantes.
      const intensity = Math.min(load / 1000, 1.2); 
      
      // ALGORITHME DE DIFFUSION ELARGIE
      // Un exposant de 1.3 lisse légèrement la distribution de l'effet
      const multiplier = Math.pow(intensity, 1.3) * recoveryMod; 

      const gReal = qDef.g * multiplier;
      const oReal = qDef.o * multiplier;

      // Si la séance date de moins de 3 jours, elle pèse sur la fatigue du Système Nerveux.
      if (daysSince <= 3) recentLoadSum += intensity;

      if (daysSince < gReal) {
        // État VERT : on vérifie si c'est la séance la plus "protectrice" pour cette date
        const currentDaysLeft = gReal - daysSince;
        if (bestStatus !== 'green' || currentDaysLeft > daysLeft) {
          bestStatus = 'green';
          daysLeft = Math.max(0.1, Math.round(currentDaysLeft * 10) / 10);
          // Effet de dégradé : le vert s'assombrit au fil des jours (de 1 à 0.5)
          opacity = 1 - (daysSince / gReal) * 0.5; 
          currentLevel = 100 - (daysSince / gReal) * 20; // Vert = 80-100% de la jauge
        }
      } else if (daysSince < (gReal + oReal) && bestStatus !== 'green') {
        // État ORANGE
        const currentDaysLeft = (gReal + oReal) - daysSince;
        if (bestStatus !== 'orange' || currentDaysLeft > daysLeft) {
          bestStatus = 'orange';
          daysLeft = Math.max(0.1, Math.round(currentDaysLeft * 10) / 10);
          // L'orange s'assombrit également
          opacity = 1 - ((daysSince - gReal) / oReal) * 0.5;
          currentLevel = Math.max(0, 60 - ((daysSince - gReal) / oReal) * 40); // Orange = 20-60%
        }
      }
    }
  }

  // Si on a fait l'équivalent de 1.8x une charge max en 3 jours -> Surcharge / Burnout
  const isBurnout = recentLoadSum > 1.8;

  // Création du texte pour le Tooltip
  let tooltip = 'Qualité dégradée (Rouge)';
  if (bestStatus === 'green') tooltip = `Effet Actif : Reste ${daysLeft} jours`;
  if (bestStatus === 'orange') tooltip = `Fenêtre de rappel : Reste ${daysLeft} jours`;
  if (isBurnout) tooltip += ' ⚠️ RISQUE DE SUR-ENTRAÎNEMENT';

  return { status: bestStatus, opacity, daysLeft, currentLevel: Math.max(0, currentLevel), tooltip, isBurnout };
}