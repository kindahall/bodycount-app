import { Encounter } from './encounters';
import { Partner } from './partners';
import { JournalEntry } from './journalEntries'; // Ajout de l'import

// --- Types pour les résultats d'analyse ---
export interface TagFrequency {
  tag: string;
  count: number;
}

export interface MoodEvolution {
  date: string; // ou un type de date plus spécifique si nécessaire
  averageMood: number | null;
  encounterCount: number;
}

export interface PartnerInteractionStats {
  partnerId: string;
  partnerName: string;
  encounterCount: number;
  averageMood: number | null;
}

// --- Fonctions d'analyse ---

/**
 * Calcule la fréquence de chaque tag utilisé dans les rencontres.
 */
export const calculateTagFrequency = (encounters: Encounter[]): Record<string, number> => {
  const tagMap: Record<string, number> = {};
  encounters.forEach(encounter => {
    encounter.tags?.forEach(tag => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });
  return tagMap;
};

/**
 * Calcule l'évolution de l'humeur moyenne par période (ex: par mois).
 * Pour simplifier, nous allons regrouper par mois de la date de la rencontre.
 */
export const calculateMoodEvolution = (encounters: Encounter[], journalEntries: JournalEntry[]): MoodEvolution[] => {
  const moodByMonth = new Map<string, { totalMood: number; count: number }>();

  const processEntry = (dateStr: string, mood: number | null | undefined) => {
    if (mood !== null && mood !== undefined) {
      const monthYear = new Date(dateStr).toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit' }); // YYYY-MM
      const currentMonthData = moodByMonth.get(monthYear) || { totalMood: 0, count: 0 };
      currentMonthData.totalMood += mood;
      currentMonthData.count += 1;
      moodByMonth.set(monthYear, currentMonthData);
    }
  };

  encounters.forEach(encounter => {
    processEntry(encounter.date, encounter.mood);
  });

  journalEntries.forEach(entry => {
    if (entry.created_at) { // Assurer que created_at existe
        processEntry(entry.created_at, entry.mood);
    }
  });

  return Array.from(moodByMonth, ([date, data]) => ({
    date,
    averageMood: data.count > 0 ? data.totalMood / data.count : null,
    encounterCount: data.count,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calcule des statistiques d'interaction par partenaire.
 */
export const calculatePartnerInteractionStats = (encounters: Encounter[], partners: Partner[]): PartnerInteractionStats[] => {
  const statsMap = new Map<string, { partnerName: string; totalMood: number; encounterCount: number }>();

  partners.forEach(partner => {
    if(partner.id) {
      statsMap.set(partner.id, { partnerName: partner.name, totalMood: 0, encounterCount: 0 });
    }
  });

  encounters.forEach(encounter => {
    if (encounter.partner_id) {
      const stat = statsMap.get(encounter.partner_id);
      if (stat) {
        stat.encounterCount += 1;
        if (encounter.mood !== null && encounter.mood !== undefined) {
          stat.totalMood += encounter.mood;
        }
      }
    }
  });

  return Array.from(statsMap.values())
    .filter(stat => stat.encounterCount > 0) // Ne montrer que les partenaires avec des rencontres
    .map(stat => ({
      partnerId: partners.find(p => p.name === stat.partnerName)?.id || "unknown", // Retrouver l'ID pour la clé
      partnerName: stat.partnerName,
      encounterCount: stat.encounterCount,
      averageMood: stat.encounterCount > 0 && stat.totalMood > 0 ? stat.totalMood / stat.encounterCount : null,
    }))
    .sort((a,b) => b.encounterCount - a.encounterCount);
};

// Exemple d'insight simple basé sur la fréquence des tags
export const generateSimpleTagInsight = (tagFrequencies: Record<string, number>): string | null => {
  const sortedTags = Object.entries(tagFrequencies)
    .sort(([, countA], [, countB]) => countB - countA);

  if (sortedTags.length === 0) {
    return null;
  }
  const [mostFrequentTag, count] = sortedTags[0];
  if (count > 1) { // Ne donner un insight que si le tag apparaît plus d'une fois
    return `Le tag "${mostFrequentTag}" apparaît fréquemment dans vos rencontres (utilisé ${count} fois). Cela pourrait indiquer un thème récurrent.`;
  }
  return null;
};

// Exemple d'insight simple basé sur l'humeur avec un partenaire
export const generatePartnerMoodInsight = (partnerStats: PartnerInteractionStats[]): string | null => {
    // Trier pour potentiellement prioriser (optionnel, mais peut rendre les insights plus cohérents)
    // Ici, nous allons d'abord chercher un partenaire avec une humeur basse notable.
    const lowMoodPartner = partnerStats.find(p =>
        p.encounterCount >= 3 &&
        p.averageMood !== null &&
        p.averageMood <= 2.5
    );

    if (lowMoodPartner && lowMoodPartner.averageMood) {
        return `Vos rencontres avec ${lowMoodPartner.partnerName} semblent avoir une humeur moyenne plutôt basse (${lowMoodPartner.averageMood.toFixed(1)}/5).`;
    }

    // Sinon, chercher un partenaire avec une humeur élevée notable.
    const highMoodPartner = partnerStats.find(p =>
        p.encounterCount >= 3 &&
        p.averageMood !== null &&
        p.averageMood >= 4
    );

    if (highMoodPartner && highMoodPartner.averageMood) {
        return `Vos rencontres avec ${highMoodPartner.partnerName} ont tendance à avoir une humeur moyenne élevée (${highMoodPartner.averageMood.toFixed(1)}/5) !`;
    }
    
    return null;
};