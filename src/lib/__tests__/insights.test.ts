import {
  calculateTagFrequency,
  calculateMoodEvolution,
  calculatePartnerInteractionStats,
  generateSimpleTagInsight,
  generatePartnerMoodInsight,
  // Les types TagFrequency, MoodEvolution, PartnerInteractionStats sont exportés depuis insights.ts
  // TagFrequency, // Commenté car non utilisé explicitement comme type dans ce fichier
  MoodEvolution, // Réactivé car utilisé
  PartnerInteractionStats, // Réactivé car utilisé
} from '../insights';
import type { Partner as PartnerType } from '../partners';
import type { Encounter as EncounterType } from '../encounters';
import type { JournalEntry as JournalEntryType } from '../journalEntries';


describe('Insights Functions', () => {
  const mockEncounters: EncounterType[] = [
    { id: 'e1', user_id: 'u1', partner_id: 'p1', date: '2023-01-10', mood: 5, tags: ['fun', 'date'], place: 'Restaurant', notes: '', created_at: '', updated_at: '' },
    { id: 'e2', user_id: 'u1', partner_id: 'p2', date: '2023-01-15', mood: 3, tags: ['serious', 'discussion'], place: 'Cafe', notes: '', created_at: '', updated_at: '' },
    { id: 'e3', user_id: 'u1', partner_id: 'p1', date: '2023-02-05', mood: 4, tags: ['fun', 'movie'], place: 'Cinema', notes: '', created_at: '', updated_at: '' },
    { id: 'e4', user_id: 'u1', partner_id: null, date: '2023-02-20', mood: 2, tags: ['solo', 'reflection'], place: 'Home', notes: '', created_at: '', updated_at: '' },
    { id: 'e5', user_id: 'u1', partner_id: 'p1', date: '2023-03-10', mood: 5, tags: ['fun', 'activity'], place: 'Park', notes: '', created_at: '', updated_at: '' },
  ];

  const mockPartners: PartnerType[] = [
    { id: 'p1', user_id: 'u1', name: 'Partner A', created_at: '', updated_at: '' },
    { id: 'p2', user_id: 'u1', name: 'Partner B', created_at: '', updated_at: '' },
  ];
  
  const mockJournalEntries: JournalEntryType[] = [
    { id: 'j1', user_id: 'u1', content: 'Feeling great', mood: 5, entry_type: 'diary', created_at: '2023-01-01T10:00:00Z', updated_at: ''},
    { id: 'j2', user_id: 'u1', content: 'A bit down', mood: 2, entry_type: 'reflection', created_at: '2023-01-05T10:00:00Z', updated_at: ''},
  ];


  describe('calculateTagFrequency', () => {
    it('should correctly calculate tag frequencies', () => {
      const frequency: Record<string, number> = calculateTagFrequency(mockEncounters);
      expect(frequency['fun']).toBe(3);
      expect(frequency['date']).toBe(1);
      expect(frequency['serious']).toBe(1);
      expect(frequency['discussion']).toBe(1);
      expect(frequency['movie']).toBe(1);
      expect(frequency['solo']).toBe(1);
      expect(frequency['reflection']).toBe(1);
      expect(frequency['activity']).toBe(1);
      expect(Object.keys(frequency).length).toBe(8);
    });

    it('should return an empty object for no encounters', () => {
      const frequency = calculateTagFrequency([]);
      expect(frequency).toEqual({});
    });

    it('should handle encounters with no tags', () => {
      const encountersWithNoTags: EncounterType[] = [
        { id: 'e1', user_id: 'u1', partner_id: 'p1', date: '2023-01-10', mood: 5, tags: null, place: 'Restaurant', notes: '', created_at: '', updated_at: '' },
        { id: 'e2', user_id: 'u1', partner_id: 'p1', date: '2023-01-10', mood: 5, tags: ['test'], place: 'Restaurant', notes: '', created_at: '', updated_at: '' },
      ];
      const frequency: Record<string, number> = calculateTagFrequency(encountersWithNoTags);
      expect(frequency['test']).toBe(1);
      expect(Object.keys(frequency).length).toBe(1);
    });
  });

  describe('calculateMoodEvolution', () => {
    const convertEvolutionToArrayToMap = (evolution: MoodEvolution[]): Record<string, { averageMood: number | null; count: number }> => {
        const map: Record<string, { averageMood: number | null; count: number }> = {};
        evolution.forEach(ev => {
            map[ev.date] = { averageMood: ev.averageMood, count: ev.encounterCount };
        });
        return map;
    };

    it('should calculate average mood per month for encounters and journal entries', () => {
      const evolution = calculateMoodEvolution(mockEncounters, mockJournalEntries);
      const evolutionMap = convertEvolutionToArrayToMap(evolution);
      
      expect(evolutionMap['2023-01']?.averageMood).toBeCloseTo(3.75); 
      expect(evolutionMap['2023-01']?.count).toBe(4);
      expect(evolutionMap['2023-02']?.averageMood).toBe(3);
      expect(evolutionMap['2023-02']?.count).toBe(2);
      expect(evolutionMap['2023-03']?.averageMood).toBe(5);
      expect(evolutionMap['2023-03']?.count).toBe(1);
    });
     it('should handle only journal entries for mood evolution', () => {
      const evolution = calculateMoodEvolution([], mockJournalEntries);
      const evolutionMap = convertEvolutionToArrayToMap(evolution);
      expect(evolutionMap['2023-01']?.averageMood).toBeCloseTo(3.5);
      expect(evolutionMap['2023-01']?.count).toBe(2);
    });

    it('should handle only encounters for mood evolution', () => {
      const evolution = calculateMoodEvolution(mockEncounters, []);
      const evolutionMap = convertEvolutionToArrayToMap(evolution);
      expect(evolutionMap['2023-01']?.averageMood).toBe(4);
      expect(evolutionMap['2023-01']?.count).toBe(2);
    });

    it('should return empty array if no data with mood', () => {
      const noMoodEncounters: EncounterType[] = [{ ...mockEncounters[0], mood: null }];
      const noMoodJournal: JournalEntryType[] = [{ ...mockJournalEntries[0], mood: null }];
      const evolution = calculateMoodEvolution(noMoodEncounters, noMoodJournal);
      expect(evolution).toEqual([]);
    });
  });

  describe('calculatePartnerInteractionStats', () => {
    it('should calculate interaction stats for each partner', () => {
      const stats = calculatePartnerInteractionStats(mockEncounters, mockPartners);
      expect(stats.length).toBe(2); // Seulement les partenaires avec rencontres
      const partnerAStats = stats.find(s => s.partnerName === 'Partner A');
      const partnerBStats = stats.find(s => s.partnerName === 'Partner B');

      expect(partnerAStats?.encounterCount).toBe(3);
      expect(partnerAStats?.averageMood).toBeCloseTo((5 + 4 + 5) / 3); 
      
      expect(partnerBStats?.encounterCount).toBe(1);
      expect(partnerBStats?.averageMood).toBe(3);
    });

    it('should not include partners with no encounters in the final stats', () => {
        const partnersWithNew = [...mockPartners, {id: 'p3', user_id: 'u1', name: 'Partner C', created_at:'', updated_at:''}];
        const stats = calculatePartnerInteractionStats(mockEncounters, partnersWithNew);
        // La fonction filtre les partenaires sans rencontres
        expect(stats.length).toBe(2); 
        const partnerCStats = stats.find(s => s.partnerName === 'Partner C');
        expect(partnerCStats).toBeUndefined();
    });
  });

  describe('generateSimpleTagInsight', () => {
    it('should generate insight for most frequent tag', () => {
      const tagFrequency: Record<string, number> = { fun: 3, date: 1, serious: 1 };
      const insight = generateSimpleTagInsight(tagFrequency);
      expect(insight).toContain('"fun"'); // Utiliser des guillemets doubles
      expect(insight).toContain("3 fois");
    });

    it('should return null if no tags', () => {
      const insight = generateSimpleTagInsight({});
      expect(insight).toBeNull();
    });

    it('should return null if most frequent tag count is not greater than 1', () => {
      const tagFrequency: Record<string, number> = { fun: 1, date: 1 };
      const insight = generateSimpleTagInsight(tagFrequency);
      expect(insight).toBeNull();
    });
  });

  describe('generatePartnerMoodInsight', () => {
    it('should generate insight for partner with lowest average mood if count >= 3', () => {
      const partnerStats: PartnerInteractionStats[] = [
        { partnerId: 'p1', partnerName: 'Partner A', encounterCount: 3, averageMood: 4.67 },
        { partnerId: 'p2', partnerName: 'Partner B', encounterCount: 3, averageMood: 2.0 }, // Humeur basse et >= 3 rencontres
      ];
      const insight = generatePartnerMoodInsight(partnerStats);
      expect(insight).toContain("Partner B");
      expect(insight).toContain("2.0");
      expect(insight).toContain("plutôt basse");
    });

     it('should generate insight for partner with highest average mood if count >= 3 and mood >= 4', () => {
      const partnerStats: PartnerInteractionStats[] = [
        { partnerId: 'p1', partnerName: 'Partner A', encounterCount: 3, averageMood: 4.5 },
        { partnerId: 'p2', partnerName: 'Partner B', encounterCount: 2, averageMood: 5 }, // Moins de 3 rencontres
      ];
      const insight = generatePartnerMoodInsight(partnerStats);
      expect(insight).toContain("Partner A");
      expect(insight).toContain("4.5");
      expect(insight).toContain("élevée");
    });
    
    it('should return null if no partner meets criteria (count < 3 or mood not notable)', () => {
      const partnerStats: PartnerInteractionStats[] = [
        { partnerId: 'p1', partnerName: 'Partner A', encounterCount: 2, averageMood: 4.5 }, // count < 3
        { partnerId: 'p2', partnerName: 'Partner B', encounterCount: 3, averageMood: 3.0 }, // mood neutre
      ];
      const insight = generatePartnerMoodInsight(partnerStats);
      expect(insight).toBeNull();
    });

    it('should return null if no partner stats or no moods', () => {
      expect(generatePartnerMoodInsight([])).toBeNull();
      expect(generatePartnerMoodInsight([{partnerId: 'p1', partnerName:'Partner A', encounterCount:0, averageMood: null}])).toBeNull();
    });
  });
});
