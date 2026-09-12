'use client';

import React from 'react';

export type ToothCondition = 'healthy' | 'caries' | 'filling' | 'crown' | 'missing';

export interface ToothRecordItem {
  tooth_number: string;
  condition: ToothCondition;
  surfaces?: string[];
  notes?: string;
}

export interface AIFindingItem {
  id?: string;
  imaging_asset_id?: string;
  tooth_number: string;
  finding_type: string;
  confidence_score: number | string;
  description: string;
  generated_at?: string;
}

interface ToothChartProps {
  records: Record<string, ToothRecordItem>;
  selectedTooth: string | null;
  onSelectTooth: (toothNumber: string) => void;
  aiFindings?: AIFindingItem[];
  readOnly?: boolean;
}

// FDI 32 adult teeth numbering
const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28'
];

const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38'
];

const CONDITION_COLORS: Record<ToothCondition, { fill: string; stroke: string; label: string }> = {
  healthy: { fill: 'var(--color-healthy-bg, #ecfdf5)', stroke: 'var(--color-healthy, #10b981)', label: 'Healthy' },
  caries: { fill: 'var(--color-caries-bg, #fffbeb)', stroke: 'var(--color-caries, #f59e0b)', label: 'Caries' },
  filling: { fill: 'var(--color-filling-bg, #eff6ff)', stroke: 'var(--color-filling, #3b82f6)', label: 'Filling' },
  crown: { fill: 'var(--color-crown-bg, #f5f3ff)', stroke: 'var(--color-crown, #8b5cf6)', label: 'Crown' },
  missing: { fill: 'var(--color-missing-bg, #f1f5f9)', stroke: 'var(--color-missing, #94a3b8)', label: 'Missing' },
};

export default function ToothChart({
  records,
  selectedTooth,
  onSelectTooth,
  aiFindings = [],
  readOnly = false,
}: ToothChartProps) {
  // Map AI findings by tooth number
  const aiFindingsByTooth = React.useMemo(() => {
    const map: Record<string, AIFindingItem[]> = {};
    for (const f of aiFindings) {
      if (!map[f.tooth_number]) map[f.tooth_number] = [];
      map[f.tooth_number].push(f);
    }
    return map;
  }, [aiFindings]);

  // Tooth anatomy renderer with surfaces and AI overlay
  const renderTooth = (toothNumber: string, isUpper: boolean) => {
    const record = records[toothNumber];
    const condition: ToothCondition = record?.condition || 'healthy';
    const isSelected = selectedTooth === toothNumber;
    const isMissing = condition === 'missing';
    const colors = CONDITION_COLORS[condition] || CONDITION_COLORS.healthy;
    const toothAiFindings = aiFindingsByTooth[toothNumber] || [];
    const hasAiFinding = toothAiFindings.length > 0;
    
    // Check for discrepancy: AI detected caries/bone_loss but dentist charted healthy
    const hasDiscrepancy = hasAiFinding && condition === 'healthy';

    return (
      <div
        key={toothNumber}
        onClick={() => onSelectTooth(toothNumber)}
        role="button"
        tabIndex={0}
        aria-label={`Tooth ${toothNumber}, Status: ${colors.label}${hasAiFinding ? `, AI Finding: ${toothAiFindings[0].finding_type}` : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectTooth(toothNumber);
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          cursor: readOnly ? 'default' : 'pointer',
          padding: '6px 4px',
          borderRadius: 'var(--radius-md, 8px)',
          background: isSelected ? 'var(--color-accent-subtle, #e0f2fe)' : 'transparent',
          border: isSelected ? '2px solid var(--color-accent, #0284c7)' : '2px solid transparent',
          position: 'relative',
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        {/* Upper tooth number header */}
        {isUpper && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--color-accent-text, #0369a1)' : 'var(--color-ink-secondary, #64748b)' }}>
            {toothNumber}
          </span>
        )}

        {/* Anatomical Tooth SVG with Surface Segments */}
        <div style={{ position: 'relative', width: '38px', height: '48px' }}>
          <svg
            viewBox="0 0 38 48"
            style={{
              width: '100%',
              height: '100%',
              filter: isSelected ? 'drop-shadow(0 2px 4px rgba(2, 132, 199, 0.3))' : 'none',
            }}
          >
            {/* AI Highlight Halo / Glow */}
            {hasAiFinding && (
              <path
                d={
                  isUpper
                    ? "M 10 4 C 10 1, 28 1, 28 4 C 34 14, 36 28, 34 38 C 32 44, 6 44, 4 38 C 2 28, 4 14, 10 4 Z"
                    : "M 4 10 C 6 4, 32 4, 34 10 C 36 20, 34 34, 28 44 C 28 47, 10 47, 10 44 C 4 34, 2 20, 4 10 Z"
                }
                fill="none"
                stroke={hasDiscrepancy ? "#ef4444" : "#f59e0b"}
                strokeWidth="4"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            )}

            {/* Tooth Root & Crown Outline */}
            <path
              d={
                isUpper
                  ? "M 10 4 C 10 1, 28 1, 28 4 C 34 14, 36 28, 34 38 C 32 44, 6 44, 4 38 C 2 28, 4 14, 10 4 Z"
                  : "M 4 10 C 6 4, 32 4, 34 10 C 36 20, 34 34, 28 44 C 28 47, 10 47, 10 44 C 4 34, 2 20, 4 10 Z"
              }
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="2"
            />

            {/* Central Occlusal / Incisal Surface */}
            {!isMissing && (
              <circle
                cx="19"
                cy="24"
                r="7"
                fill={record?.surfaces?.includes('O') ? colors.stroke : '#ffffff'}
                stroke={colors.stroke}
                strokeWidth="1.5"
                opacity={record?.surfaces?.includes('O') ? 0.85 : 0.6}
              />
            )}

            {/* Mesial surface indicator */}
            {record?.surfaces?.includes('M') && (
              <path d="M 5 20 Q 12 24 5 28" stroke={colors.stroke} strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Distal surface indicator */}
            {record?.surfaces?.includes('D') && (
              <path d="M 33 20 Q 26 24 33 28" stroke={colors.stroke} strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Missing Tooth 'X' Indicator */}
            {isMissing && (
              <g stroke="var(--color-ink-muted, #64748b)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="8" y1="12" x2="30" y2="36" />
                <line x1="30" y1="12" x2="8" y2="36" />
              </g>
            )}

            {/* Crown visual rim */}
            {condition === 'crown' && (
              <path
                d={isUpper ? "M 7 36 Q 19 40 31 36" : "M 7 12 Q 19 8 31 12"}
                stroke="var(--color-crown, #8b5cf6)"
                strokeWidth="2"
                fill="none"
              />
            )}
          </svg>

          {/* AI Badge Overlay (Top Right of Tooth) */}
          {hasAiFinding && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                background: hasDiscrepancy ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 800,
                borderRadius: '999px',
                padding: '1px 4px',
                lineHeight: 1.2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                letterSpacing: '-0.02em',
              }}
              title={toothAiFindings.map(f => `${f.finding_type} (${Math.round(Number(f.confidence_score) * 100)}%)`).join(', ')}
            >
              AI
            </div>
          )}
        </div>

        {/* Lower tooth number footer */}
        {!isUpper && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--color-accent-text, #0369a1)' : 'var(--color-ink-secondary, #64748b)' }}>
            {toothNumber}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="panel-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 className="panel-title">FDI 2-Digit Dental Chart</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Click any tooth to examine surfaces, update clinical findings, or inspect AI overlays.
          </p>
        </div>

        {/* Chart Legend with AI Indicator */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['healthy', 'caries', 'filling', 'crown', 'missing'] as ToothCondition[]).map((cond) => {
            const c = CONDITION_COLORS[cond];
            return (
              <div key={cond} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: c.fill,
                    border: `1.5px solid ${c.stroke}`,
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: 'var(--color-ink-secondary, #475569)', textTransform: 'capitalize' }}>{c.label}</span>
              </div>
            );
          })}
          {/* AI Legend Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span
              style={{
                width: '14px',
                height: '10px',
                borderRadius: '3px',
                background: '#f59e0b',
                color: '#ffffff',
                fontSize: '8px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              AI
            </span>
            <span style={{ color: '#d97706', fontWeight: 600 }}>AI Finding</span>
          </div>
        </div>
      </div>

      {/* Dental Arch SVG Layout Container */}
      <div
        style={{
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          background: 'var(--color-canvas-subtle, #f8fafc)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '1.25rem 0.75rem',
          border: 'var(--border-hairline, 1px solid #e2e8f0)',
        }}
      >
        <div style={{ minWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Maxillary Arch (Upper Jaw) */}
          <div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-ink-tertiary, #94a3b8)', letterSpacing: '0.05em', marginBottom: '4px' }}>
              MAXILLARY ARCH (UPPER JAW)
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
              {/* Upper Right Quadrant 1 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {UPPER_TEETH.slice(0, 8).map((t) => renderTooth(t, true))}
              </div>
              {/* Midline Divider */}
              <div style={{ width: '2px', height: '56px', background: 'var(--color-ink-muted, #cbd5e1)', margin: '0 6px' }} />
              {/* Upper Left Quadrant 2 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {UPPER_TEETH.slice(8, 16).map((t) => renderTooth(t, true))}
              </div>
            </div>
          </div>

          {/* Arch Separator */}
          <div style={{ borderTop: '1px dashed var(--color-ink-muted, #cbd5e1)', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                top: '-9px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--color-canvas-subtle, #f8fafc)',
                padding: '0 8px',
                fontSize: '10px',
                color: 'var(--color-ink-tertiary, #94a3b8)',
                fontWeight: 700,
              }}
            >
              OCCLUSAL PLANE
            </span>
          </div>

          {/* Mandibular Arch (Lower Jaw) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
              {/* Lower Right Quadrant 4 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {LOWER_TEETH.slice(0, 8).map((t) => renderTooth(t, false))}
              </div>
              {/* Midline Divider */}
              <div style={{ width: '2px', height: '56px', background: 'var(--color-ink-muted, #cbd5e1)', margin: '0 6px' }} />
              {/* Lower Left Quadrant 3 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {LOWER_TEETH.slice(8, 16).map((t) => renderTooth(t, false))}
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-ink-tertiary, #94a3b8)', letterSpacing: '0.05em', marginTop: '4px' }}>
              MANDIBULAR ARCH (LOWER JAW)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
