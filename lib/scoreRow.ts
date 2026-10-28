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

// The four indices, each with its five indicator columns and the display names
// the app and the Score-a-Story tool use, in the same order. Kept here so the
// per-indicator breakdown reads identically everywhere it is shown.
export interface IndexBreakdown {
  key: 'BAI' | 'PSI' | 'SCI' | 'HII';
  name: string;
  color: string;
  total: number; // 0-10
  indicators: { label: string; value: number }[]; // value 0-2
}

const BREAKDOWN_DEF: { key: IndexBreakdown['key']; name: string; color: string; items: [string, string][] }[] = [
  { key: 'BAI', name: 'Biblical Alignment', color: '#B81616', items: [
    ['Scriptural Consistency', 'bai_scriptural_consistency'],
    ['Doctrinal Integrity', 'bai_doctrinal_integrity'],
    ['Moral Framework', 'bai_moral_framework'],
    ['Anthropology', 'bai_anthropology'],
    ['Teleology', 'bai_teleology'],
  ] },
  { key: 'PSI', name: 'Prophetic Significance', color: '#8A6A17', items: [
    ['Textual Linkage', 'psi_textual_linkage'],
    ['Eschatological Category Fit', 'psi_eschatological_fit'],
    ['Historical Pattern Continuity', 'psi_historical_continuity'],
    ['Spiritual Discernment Impact', 'psi_spiritual_impact'],
    ['Theological Restraint', 'psi_theological_restraint'],
  ] },
  { key: 'SCI', name: 'Source Credibility', color: '#1B6B5A', items: [
    ['Primary Source Access', 'sci_primary_source_access'],
    ['Verification & Corroboration', 'sci_verification'],
    ['Transparency & Accountability', 'sci_transparency'],
    ['Track Record Accuracy', 'sci_track_record'],
    ['Editorial Standards', 'sci_editorial_standards'],
  ] },
  { key: 'HII', name: 'Humanities Impact', color: '#2A4A7F', items: [
    ['Human Dignity Recognition', 'hii_human_dignity'],
    ['Compassion & Empathy', 'hii_compassion_empathy'],
    ['Societal Impact Scope', 'hii_societal_impact'],
    ['Justice & Responsibility', 'hii_justice_responsibility'],
    ['Christ-Modeled Care Orientation', 'hii_christ_modeled_care'],
  ] },
];

/** Per-indicator breakdown of a scored row, grouped by index. */
export function breakdownFromRow(row: Record<string, any>): IndexBreakdown[] {
  return BREAKDOWN_DEF.map((d) => {
    const indicators = d.items.map(([label, col]) => ({ label, value: clamp(row[col]) }));
    return {
      key: d.key,
      name: d.name,
      color: d.color,
      total: indicators.reduce((s, i) => s + i.value, 0),
      indicators,
    };
  });
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
