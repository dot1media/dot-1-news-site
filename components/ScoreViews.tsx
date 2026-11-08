'use client';

import { useEffect, useState } from 'react';

/**
 * Reader-chosen visualization of the four D1-4LS lenses (each 0 to 10).
 * Three ways to read the same four numbers: horizontal bars, a radar that
 * shows the profile's shape, and numeric rings. The choice is remembered per
 * reader in localStorage. Colors match each lens across the site and app.
 */

type View = 'bars' | 'radar' | 'rings';
const STORE_KEY = 'd1-4ls-view';

interface Props { bai: number; psi: number; sci: number; hii: number; }

interface Lens { key: string; name: string; val: number; color: string; }

const CX = 110, CY = 110, R = 84;
// BAI top, PSI right, SCI bottom, HII left.
const ANGLES: Record<string, number> = { BAI: -90, PSI: 0, SCI: 90, HII: 180 };

function pt(key: string, value: number): [number, number] {
  const a = (ANGLES[key] * Math.PI) / 180;
  const r = (R * Math.max(0, Math.min(10, value))) / 10;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function axisPt(key: string, frac: number): [number, number] {
  const a = (ANGLES[key] * Math.PI) / 180;
  return [CX + R * frac * Math.cos(a), CY + R * frac * Math.sin(a)];
}

export default function ScoreViews({ bai, psi, sci, hii }: Props) {
  const [view, setView] = useState<View>('bars');

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORE_KEY) as View | null;
      if (v === 'bars' || v === 'radar' || v === 'rings') setView(v);
    } catch { /* storage unavailable: keep default */ }
  }, []);

  const choose = (v: View) => {
    setView(v);
    try { localStorage.setItem(STORE_KEY, v); } catch { /* non-fatal */ }
  };

  const lenses: Lens[] = [
    { key: 'BAI', name: 'Biblical Alignment', val: bai, color: '#B81616' },
    { key: 'PSI', name: 'Prophetic Significance', val: psi, color: '#8A6A17' },
    { key: 'SCI', name: 'Source Credibility', val: sci, color: '#1B6B5A' },
    { key: 'HII', name: 'Humanities Impact', val: hii, color: '#2A4A7F' },
  ];

  const order = ['BAI', 'PSI', 'SCI', 'HII'];
  const dataPoints = order.map((k) => pt(k, lenses.find((l) => l.key === k)!.val));
  const polyPoints = dataPoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  return (
    <div className="scoreviews">
      {/* Always expose every lens score to assistive tech, in any view: the radar
          and rings draw the numbers as SVG, which screen readers skip. */}
      <p className="sv-sr">
        Four-lens scores, each out of 10. Biblical Alignment {bai}. Prophetic Significance {psi}. Source Credibility {sci}. Humanities Impact {hii}.
      </p>
      <div className="sv-toggle" role="tablist" aria-label="Score view">
        {(['bars', 'radar', 'rings'] as View[]).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            className={'sv-tab' + (view === v ? ' on' : '')}
            onClick={() => choose(v)}
          >
            {v === 'bars' ? 'Bars' : v === 'radar' ? 'Radar' : 'Rings'}
          </button>
        ))}
      </div>

      {view === 'bars' && (
        <div className="sv-bars">
          {lenses.map((l) => (
            <div className="sv-bar" key={l.key}>
              <span className="sv-bar-name">{l.name}</span>
              <span className="sv-bar-track"><span className="sv-bar-fill" style={{ width: `${(l.val / 10) * 100}%`, background: l.color }} /></span>
              <b className="sv-bar-val">{l.val}<i>/10</i></b>
            </div>
          ))}
        </div>
      )}

      {view === 'radar' && (
        <div className="sv-radar">
          <svg viewBox="0 0 220 220" width="220" height="220" aria-hidden="true">
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <polygon
                key={f}
                points={order.map((k) => axisPt(k, f).map((n) => n.toFixed(1)).join(',')).join(' ')}
                fill="none"
                stroke="var(--rule2)"
                strokeWidth={1}
              />
            ))}
            {order.map((k) => {
              const [x, y] = axisPt(k, 1);
              return <line key={k} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--rule2)" strokeWidth={1} />;
            })}
            <polygon points={polyPoints} fill="rgba(184,22,22,0.16)" stroke="#B81616" strokeWidth={2} strokeLinejoin="round" />
            {order.map((k) => {
              const l = lenses.find((x) => x.key === k)!;
              const [x, y] = pt(k, l.val);
              return <circle key={k} cx={x} cy={y} r={3.5} fill={l.color} />;
            })}
            {order.map((k) => {
              const [x, y] = axisPt(k, 1.14);
              return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={700} fill="var(--muted)">{k}</text>;
            })}
          </svg>
          <div className="sv-radar-legend">
            {lenses.map((l) => (
              <span key={l.key}><i style={{ background: l.color }} />{l.name} <b>{l.val}</b></span>
            ))}
          </div>
        </div>
      )}

      {view === 'rings' && (
        <div className="sv-rings">
          {lenses.map((l) => {
            const circ = 2 * Math.PI * 32;
            const on = (l.val / 10) * circ;
            return (
              <div className="sv-ring" key={l.key}>
                <svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true">
                  <circle cx="42" cy="42" r="32" fill="none" stroke="var(--rule2)" strokeWidth="7" />
                  <circle cx="42" cy="42" r="32" fill="none" stroke={l.color} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${on.toFixed(1)} ${circ.toFixed(1)}`} transform="rotate(-90 42 42)" />
                  <text x="42" y="39" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="800" fill="var(--body)">{l.val}</text>
                  <text x="42" y="54" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--muted)">/ 10</text>
                </svg>
                <span className="sv-ring-key" style={{ color: l.color }}>{l.key}</span>
                <span className="sv-ring-name">{l.name}</span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .scoreviews{margin:4px 0 14px;}
        .sv-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
        .sv-toggle{display:inline-flex;gap:2px;padding:3px;background:var(--rule2);border-radius:9px;margin-bottom:14px;}
        .sv-tab{appearance:none;border:none;background:transparent;color:var(--muted);font-size:12px;font-weight:600;letter-spacing:.3px;padding:5px 13px;border-radius:7px;cursor:pointer;font-family:inherit;}
        .sv-tab.on{background:var(--raised);color:var(--body);box-shadow:0 1px 2px rgba(0,0,0,.14);}
        .sv-bars{display:flex;flex-direction:column;gap:11px;}
        .sv-bar{display:grid;grid-template-columns:150px 1fr auto;align-items:center;gap:10px;}
        .sv-bar-name{font-size:13px;color:var(--body);}
        .sv-bar-track{height:7px;background:var(--rule2);border-radius:4px;overflow:hidden;}
        .sv-bar-fill{display:block;height:100%;border-radius:4px;}
        .sv-bar-val{font-size:13px;color:var(--body);font-weight:700;min-width:42px;text-align:right;}
        .sv-bar-val i{font-style:normal;opacity:.5;font-size:.82em;}
        .sv-radar{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;}
        .sv-radar-legend{display:flex;flex-direction:column;gap:7px;}
        .sv-radar-legend span{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--body);}
        .sv-radar-legend i{width:11px;height:11px;border-radius:3px;flex:none;}
        .sv-radar-legend b{margin-left:auto;}
        .sv-rings{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center;}
        .sv-ring{display:flex;flex-direction:column;align-items:center;gap:3px;}
        .sv-ring-key{font-size:11px;font-weight:800;letter-spacing:.5px;}
        .sv-ring-name{font-size:10.5px;color:var(--muted);line-height:1.25;}
        @media (max-width:520px){.sv-rings{grid-template-columns:repeat(2,1fr);gap:16px;}.sv-bar{grid-template-columns:120px 1fr auto;}}
      `}</style>
    </div>
  );
}
