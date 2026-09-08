'use client';

import React from 'react';

export type ToothCondition = 'healthy' | 'caries' | 'filling' | 'crown' | 'missing';

export interface ToothRecordItem {
  tooth_number: string;
  condition: ToothCondition;
  surfaces?: string[];
  notes?: string;
}

interface ToothChartProps {
  records: Record<string, ToothRecordItem>;
  selectedTooth: string | null;
  onSelectTooth: (toothNumber: string) => void;
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
  healthy: { fill: '#ecfdf5', stroke: '#10b981', label: 'Healthy' },
  caries: { fill: '#fffbeb', stroke: '#f59e0b', label: 'Caries' },
  filling: { fill: '#eff6ff', stroke: '#3b82f6', label: 'Filling' },
  crown: { fill: '#f5f3ff', stroke: '#8b5cf6', label: 'Crown' },
  missing: { fill: '#f1f5f9', stroke: '#94a3b8', label: 'Missing' },
};

export default function ToothChart({
  records,
  selectedTooth,
  onSelectTooth,
  readOnly = false,
}: ToothChartProps) {
  // Tooth anatomy renderer with surfaces
  const renderTooth = (toothNumber: string, isUpper: boolean) => {
    const record = records[toothNumber];
    const condition: ToothCondition = record?.condition || 'healthy';
    const isSelected = selectedTooth === toothNumber;
    const isMissing = condition === 'missing';
    const colors = CONDITION_COLORS[condition];

    return (
      <div
        key={toothNumber}
        onClick={() => onSelectTooth(toothNumber)}
        role="button"
        tabIndex={0}
        aria-label={`Tooth ${toothNumber}, Status: ${colors.label}${record?.notes ? `, Notes: ${record.notes}` : ''}`}
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
          gap: '4px',
          cursor: readOnly ? 'default' : 'pointer',
          padding: '6px 4px',
          borderRadius: '8px',
          background: isSelected ? '#e0f2fe' : 'transparent',
          border: isSelected ? '1.5px solid #0284c7' : '1.5px solid transparent',
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        {/* Upper tooth number header */}
        {isUpper && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? '#0369a1' : '#64748b' }}>
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
              filter: isSelected ? 'drop-shadow(0 2px 4px rgba(2, 132, 199, 0.25))' : 'none',
            }}
          >
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

            {/* Mesial surface indicator if affected */}
            {record?.surfaces?.includes('M') && (
              <path d="M 5 20 Q 12 24 5 28" stroke={colors.stroke} strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Distal surface indicator if affected */}
            {record?.surfaces?.includes('D') && (
              <path d="M 33 20 Q 26 24 33 28" stroke={colors.stroke} strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Missing Tooth 'X' Indicator */}
            {isMissing && (
              <g stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                <line x1="8" y1="12" x2="30" y2="36" />
                <line x1="30" y1="12" x2="8" y2="36" />
              </g>
            )}

            {/* Crown visual rim */}
            {condition === 'crown' && (
              <path
                d={isUpper ? "M 7 36 Q 19 40 31 36" : "M 7 12 Q 19 8 31 12"}
                stroke="#8b5cf6"
                strokeWidth="2"
                fill="none"
              />
            )}
          </svg>
        </div>

        {/* Lower tooth number footer */}
        {!isUpper && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: isSelected ? '#0369a1' : '#64748b' }}>
            {toothNumber}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="panel-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 className="panel-title">FDI 2-Digit Dental Chart</h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Click any tooth to examine surfaces, update condition, or prescribe treatment.
          </p>
        </div>

        {/* Chart Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                <span style={{ color: '#475569', textTransform: 'capitalize' }}>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dental Arch SVG Layout Container */}
      <div
        style={{
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '1.25rem 0.75rem',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ minWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Maxillary Arch (Upper Jaw) */}
          <div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '4px' }}>
              MAXILLARY ARCH (UPPER JAW)
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
              {/* Upper Right Quadrant 1 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {UPPER_TEETH.slice(0, 8).map((t) => renderTooth(t, true))}
              </div>
              {/* Midline Divider */}
              <div style={{ width: '2px', height: '56px', background: '#cbd5e1', margin: '0 6px' }} />
              {/* Upper Left Quadrant 2 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {UPPER_TEETH.slice(8, 16).map((t) => renderTooth(t, true))}
              </div>
            </div>
          </div>

          {/* Arch Separator */}
          <div style={{ borderTop: '1px dashed #cbd5e1', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                top: '-9px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#f8fafc',
                padding: '0 8px',
                fontSize: '10px',
                color: '#94a3b8',
                fontWeight: 600,
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
              <div style={{ width: '2px', height: '56px', background: '#cbd5e1', margin: '0 6px' }} />
              {/* Lower Left Quadrant 3 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {LOWER_TEETH.slice(8, 16).map((t) => renderTooth(t, false))}
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginTop: '4px' }}>
              MANDIBULAR ARCH (LOWER JAW)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
