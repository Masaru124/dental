'use client';

import React, { useState, useEffect } from 'react';
import { ToothCondition, ToothRecordItem } from './ToothChart';
import { X, PlusCircle, Check, Sparkles, AlertTriangle } from 'lucide-react';

interface ToothEditorPanelProps {
  toothNumber: string | null;
  currentRecord?: ToothRecordItem;
  aiFindings?: Array<{
    id?: string;
    finding_type: string;
    confidence_score: number | string;
    description: string;
  }>;
  onSave: (toothNumber: string, condition: ToothCondition, surfaces: string[], notes: string) => Promise<void>;
  onAddTreatment: (toothNumber: string) => void;
  onClose: () => void;
}

const TOOTH_NAMES: Record<string, string> = {
  '18': 'Upper Right 3rd Molar (Wisdom)',
  '17': 'Upper Right 2nd Molar',
  '16': 'Upper Right 1st Molar',
  '15': 'Upper Right 2nd Premolar',
  '14': 'Upper Right 1st Premolar',
  '13': 'Upper Right Canine',
  '12': 'Upper Right Lateral Incisor',
  '11': 'Upper Right Central Incisor',
  '21': 'Upper Left Central Incisor',
  '22': 'Upper Left Lateral Incisor',
  '23': 'Upper Left Canine',
  '24': 'Upper Left 1st Premolar',
  '25': 'Upper Left 2nd Premolar',
  '26': 'Upper Left 1st Molar',
  '27': 'Upper Left 2nd Molar',
  '28': 'Upper Left 3rd Molar (Wisdom)',
  '38': 'Lower Left 3rd Molar (Wisdom)',
  '37': 'Lower Left 2nd Molar',
  '36': 'Lower Left 1st Molar',
  '35': 'Lower Left 2nd Premolar',
  '34': 'Lower Left 1st Premolar',
  '33': 'Lower Left Canine',
  '32': 'Lower Left Lateral Incisor',
  '31': 'Lower Left Central Incisor',
  '41': 'Lower Right Central Incisor',
  '42': 'Lower Right Lateral Incisor',
  '43': 'Lower Right Canine',
  '44': 'Lower Right 1st Premolar',
  '45': 'Lower Right 2nd Premolar',
  '46': 'Lower Right 1st Molar',
  '47': 'Lower Right 2nd Molar',
  '48': 'Lower Right 3rd Molar (Wisdom)',
};

const SURFACES = [
  { code: 'O', label: 'Occlusal / Incisal' },
  { code: 'M', label: 'Mesial (Front)' },
  { code: 'D', label: 'Distal (Back)' },
  { code: 'B', label: 'Buccal / Facial (Cheek)' },
  { code: 'L', label: 'Lingual (Tongue)' },
];

export default function ToothEditorPanel({
  toothNumber,
  currentRecord,
  aiFindings = [],
  onSave,
  onAddTreatment,
  onClose,
}: ToothEditorPanelProps) {
  const [condition, setCondition] = useState<ToothCondition>('healthy');
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentRecord) {
      setCondition(currentRecord.condition || 'healthy');
      setSelectedSurfaces(currentRecord.surfaces || []);
      setNotes(currentRecord.notes || '');
    } else {
      setCondition('healthy');
      setSelectedSurfaces([]);
      setNotes('');
    }
  }, [currentRecord, toothNumber]);

  if (!toothNumber) return null;

  const toggleSurface = (code: string) => {
    if (selectedSurfaces.includes(code)) {
      setSelectedSurfaces(selectedSurfaces.filter((s) => s !== code));
    } else {
      setSelectedSurfaces([...selectedSurfaces, code]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(toothNumber, condition, selectedSurfaces, notes);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Check for AI discrepancy
  const toothFindings = aiFindings.filter(f => (f as any).tooth_number === toothNumber || true);
  const hasDiscrepancy = toothFindings.length > 0 && condition === 'healthy';

  return (
    <>
      <div className="slide-panel-overlay" onClick={onClose} />
      <div className="slide-panel">
        {/* Header */}
        <div className="slide-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                background: 'var(--color-accent, #0284c7)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '13px',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              FDI #{toothNumber}
            </span>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink, #0f172a)' }}>
                {TOOTH_NAMES[toothNumber] || `Tooth #${toothNumber}`}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #64748b)' }}>
                Surface Diagnostics & Clinical Findings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--color-ink-muted, #94a3b8)', padding: '6px', borderRadius: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="slide-panel-body">
          {/* AI Finding Alert Banner if present */}
          {aiFindings.length > 0 && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md, 8px)',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: 700, fontSize: '12px' }}>
                <Sparkles size={15} color="#d97706" />
                <span>AI Radiographic Detection</span>
              </div>
              {aiFindings.map((finding, idx) => (
                <div key={idx} style={{ marginTop: '4px', fontSize: '12px', color: '#78350f' }}>
                  <div style={{ fontWeight: 600 }}>
                    {finding.finding_type.toUpperCase()} • {Math.round(Number(finding.confidence_score) * 100)}% Confidence
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px', color: '#92400e' }}>
                    {finding.description}
                  </div>
                </div>
              ))}

              {hasDiscrepancy && (
                <div
                  className="discrepancy-flag"
                  style={{ marginTop: '8px', display: 'flex' }}
                >
                  <AlertTriangle size={12} />
                  <span>Clinical Discrepancy: AI detects lesion, but status is Healthy</span>
                </div>
              )}
            </div>
          )}

          {/* Condition Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>Tooth Condition</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {(['healthy', 'caries', 'filling', 'crown', 'missing'] as ToothCondition[]).map((cond) => {
                const isActive = condition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`badge badge-${cond}`}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md, 8px)',
                      fontSize: '12px',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: isActive ? '2px solid var(--color-ink, #0f172a)' : undefined,
                      fontWeight: isActive ? 800 : 500,
                      transform: isActive ? 'scale(1.02)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Surface Selection */}
          {condition !== 'missing' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Affected Surfaces</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SURFACES.map((surf) => {
                  const isChecked = selectedSurfaces.includes(surf.code);
                  return (
                    <button
                      key={surf.code}
                      type="button"
                      onClick={() => toggleSurface(surf.code)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: isChecked ? '1.5px solid var(--color-accent, #0284c7)' : '1px solid var(--color-ink-muted, #e2e8f0)',
                        background: isChecked ? 'var(--color-accent-subtle, #e0f2fe)' : 'var(--color-surface, #ffffff)',
                        color: isChecked ? 'var(--color-accent-text, #0369a1)' : 'var(--color-ink-secondary, #475569)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontWeight: 800 }}>{surf.code}</span>
                      <span>{surf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clinical Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Clinical Observations</label>
            <textarea
              className="input-field"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cold sensitivity, margin breakdown, localized fracture..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="slide-panel-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check size={16} />
            <span>{isSaving ? 'Saving...' : 'Update Record'}</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              onAddTreatment(toothNumber);
              onClose();
            }}
          >
            <PlusCircle size={16} />
            <span>Plan Tx</span>
          </button>
        </div>
      </div>
    </>
  );
}
