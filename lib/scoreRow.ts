/**
 * D1-4LS score computation for the site, mirroring the app's scoring engine
 * exactly: 20 indicators (0-2 each), summed into four 0-10 indices, and an
 * overall 0-40 that we present as a composite out of 10 (overall / 4).
 *
 * The site only READS these columns from the shared database; the app writes
 * them. This keeps the number on the front page identical to the app's.
 */

// snake_case column names as stored on news_stories
export const INDICATOR_COLUMNS = [
  'bai_scriptural_consistency', 'bai_doctrinal_integrity', 'bai_moral_framework', 'bai_anthropology', 'bai_teleology',
  'psi_textual_linkage', 'psi_eschatological_fit', 'psi_historical_continuity', 'psi_spiritual_impact', 'psi_theological_restraint',
  'sci_primary_source_access', 'sci_verification', 'sci_transparency', 'sci_track_record', 'sci_editorial_standards',
  'hii_human_dignity', 'hii_compassion_empathy', 'hii_societal_impact', 'hii_justice_responsibility', 'hii_christ_modeled_care',
];

export interface StoryScore {
  bai: number;   // 0-10
  psi: number;   // 0-10
  sci: number;   // 0-10
  hii: number;   // 0-10
  overall: number;    // 0-40
  composite: number;  // 0-10, overall / 4
  confidence?: string | null;
  hasScore: boolean;
}

function clamp(v: unknown): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(2, n));
}

/** Build a StoryScore from a DB row that includes the 20 indicator columns. */
export function scoreFromRow(row: Record<string, any>): StoryScore {
  // If the indicator columns are absent/null, treat as unscored.
  const present = INDICATOR_COLUMNS.some((c) => row[c] !== null && row[c] !== undefined);
  const g = (c: string) => clamp(row[c]);

  const bai = g('bai_scriptural_consistency') + g('bai_doctrinal_integrity') + g('bai_moral_framework') + g('bai_anthropology') + g('bai_teleology');
  const psi = g('psi_textual_linkage') + g('psi_eschatological_fit') + g('psi_historical_continuity') + g('psi_spiritual_impact') + g('psi_theological_restraint');
  const sci = g('sci_primary_source_access') + g('sci_verification') + g('sci_transparency') + g('sci_track_record') + g('sci_editorial_standards');
  const hii = g('hii_human_dignity') + g('hii_compassion_empathy') + g('hii_societal_impact') + g('hii_justice_responsibility') + g('hii_christ_modeled_care');
  const overall = bai + psi + sci + hii;

  return {
    bai, psi, sci, hii,
    overall,
    composite: overall / 4,
    confidence: row['score_confidence'] ?? null,
    hasScore: present,
  };
}
