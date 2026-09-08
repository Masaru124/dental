'use client';

import React, { useState, useEffect } from 'react';
import { ToothCondition, ToothRecordItem } from './ToothChart';
import { X, PlusCircle, Check } from 'lucide-react';

interface ToothEditorModalProps {
  toothNumber: string | null;
  currentRecord?: ToothRecordItem;
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

export default function ToothEditorModal({
  toothNumber,
  currentRecord,
  onSave,
  onAddTreatment,
  onClose,
}: ToothEditorModalProps) {
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="panel-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                FDI #{toothNumber}
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                {TOOTH_NAMES[toothNumber] || `Tooth ${toothNumber}`}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Clinical examination & surface diagnostics
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

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
                    borderRadius: '8px',
                    fontSize: '12px',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: isActive ? '2px solid #0f172a' : undefined,
                    fontWeight: isActive ? 700 : 500,
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

        {/* Surface Selection (only if not missing) */}
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
                      border: isChecked ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                      background: isChecked ? '#e0f2fe' : '#ffffff',
                      color: isChecked ? '#0369a1' : '#475569',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{surf.code}</span>
                    <span>{surf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clinical Notes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ marginBottom: '0.25rem' }}>Dentist Clinical Notes</label>
          <textarea
            className="input-field"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Sensitivity to cold, localized mesial fracture, margin wear..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check size={16} />
            <span>{isSaving ? 'Saving Finding...' : 'Update Tooth Record'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={() => {
              onAddTreatment(toothNumber);
              onClose();
            }}
          >
            <PlusCircle size={16} />
            <span>Plan Treatment for Tooth #{toothNumber}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
