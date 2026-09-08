'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ToothChart, { ToothRecordItem, ToothCondition } from '@/components/ToothChart';
import DentalArch3D from '@/components/DentalArch3D';
import ToothEditorModal from '@/components/ToothEditorModal';
import TreatmentPlanSection from '@/components/TreatmentPlanSection';
import { User, Phone, Calendar, Clock, AlertTriangle, Plus, Eye, ArrowLeft, Box, Grid } from 'lucide-react';
import Link from 'next/link';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [toothRecords, setToothRecords] = useState<Record<string, ToothRecordItem>>({});
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [prefillTreatmentTooth, setPrefillTreatmentTooth] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // View Mode: '3d' | '2d' | 'both'
  const [chartViewMode, setChartViewMode] = useState<'3d' | '2d' | 'both'>('3d');

  // New visit modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const fetchPatientDetails = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      if (data.patient) {
        setPatient(data.patient);
        setVisits(data.visits || []);
        setToothRecords(data.activeToothChart || {});
      }
    } catch (err) {
      console.error('Failed to load patient:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveToothRecord = async (
    toothNumber: string,
    condition: ToothCondition,
    surfaces: string[],
    notes: string
  ) => {
    try {
      const activeVisit = visits[0]?.id;
      const res = await fetch('/api/teeth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          visit_id: activeVisit,
          tooth_number: toothNumber,
          condition,
          surfaces,
          notes,
        }),
      });

      if (res.ok) {
        setToothRecords((prev) => ({
          ...prev,
          [toothNumber]: {
            tooth_number: toothNumber,
            condition,
            surfaces,
            notes,
          },
        }));
        showToast(`Tooth #${toothNumber} updated to ${condition.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Save tooth record failed:', err);
    }
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          chief_complaint: complaint,
          notes: visitNotes,
        }),
      });
      if (res.ok) {
        setShowVisitModal(false);
        setComplaint('');
        setVisitNotes('');
        fetchPatientDetails();
        showToast('New clinical consultation visit started.');
      }
    } catch (err) {
      console.error('Create visit failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Loading patient clinical record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Patient not found.</p>
        <Link href="/patients" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Patients List
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top Breadcrumb & Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link href="/patients" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={14} />
          <span>All Patients</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {/* Chart View Mode Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setChartViewMode('3d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: chartViewMode === '3d' ? 700 : 500,
                background: chartViewMode === '3d' ? '#0284c7' : 'transparent',
                color: chartViewMode === '3d' ? '#ffffff' : '#475569',
                borderRadius: '6px',
              }}
            >
              <Box size={14} />
              <span>Real 3D Arch</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('2d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: chartViewMode === '2d' ? 700 : 500,
                background: chartViewMode === '2d' ? '#0284c7' : 'transparent',
                color: chartViewMode === '2d' ? '#ffffff' : '#475569',
                borderRadius: '6px',
              }}
            >
              <Grid size={14} />
              <span>2D FDI Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('both')}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: chartViewMode === 'both' ? 700 : 500,
                background: chartViewMode === 'both' ? '#0284c7' : 'transparent',
                color: chartViewMode === 'both' ? '#ffffff' : '#475569',
                borderRadius: '6px',
              }}
            >
              Dual View
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowVisitModal(true)}
          >
            <Plus size={14} />
            <span>New Visit</span>
          </button>

          <Link
            href={`/patients/${patientId}/presentation`}
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <Eye size={14} />
            <span>Patient Case View</span>
          </Link>
        </div>
      </div>

      {/* Patient Header Banner */}
      <div className="panel-card" style={{ marginBottom: '1.25rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '18px',
                }}
              >
                {patient.name.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  {patient.name}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  <span>{patient.age} yrs • {patient.gender}</span>
                  <span><Phone size={13} style={{ display: 'inline', verticalAlign: '-1px' }} /> {patient.phone}</span>
                  <span style={{ fontFamily: 'monospace' }}>ID: {patient.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical History Alert Flag */}
          {patient.medical_history && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={15} color="#f59e0b" />
              <span>Medical Alert: {patient.medical_history}</span>
            </div>
          )}
        </div>

        {/* Visit History Timeline Strip */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', overflowX: 'auto' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', alignSelf: 'center' }}>
            Visits ({visits.length}):
          </span>
          {visits.map((v, idx) => (
            <div
              key={v.id}
              style={{
                background: idx === 0 ? '#e0f2fe' : '#f8fafc',
                border: idx === 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                color: idx === 0 ? '#0369a1' : '#475569',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              <strong>{new Date(v.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
              {v.chief_complaint && ` - ${v.chief_complaint.slice(0, 20)}...`}
            </div>
          ))}
        </div>
      </div>

      {/* Real 3D Dental Arch / 2D FDI Chart Views */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {(chartViewMode === '3d' || chartViewMode === 'both') && (
          <DentalArch3D
            records={toothRecords}
            selectedTooth={selectedTooth}
            onSelectTooth={(num) => setSelectedTooth(num)}
          />
        )}

        {(chartViewMode === '2d' || chartViewMode === 'both') && (
          <ToothChart
            records={toothRecords}
            selectedTooth={selectedTooth}
            onSelectTooth={(num) => setSelectedTooth(num)}
          />
        )}
      </div>

      {/* Treatment Plan Section with Live Totals */}
      <TreatmentPlanSection
        patientId={patientId}
        prefillTooth={prefillTreatmentTooth}
        onClearPrefillTooth={() => setPrefillTreatmentTooth(null)}
      />

      {/* Tooth Findings & Surface Editor Modal */}
      {selectedTooth && (
        <ToothEditorModal
          toothNumber={selectedTooth}
          currentRecord={toothRecords[selectedTooth]}
          onSave={handleSaveToothRecord}
          onAddTreatment={(toothNum) => {
            setPrefillTreatmentTooth(toothNum);
          }}
          onClose={() => setSelectedTooth(null)}
        />
      )}

      {/* New Consultation Visit Modal */}
      {showVisitModal && (
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
        >
          <div className="panel-card" style={{ maxWidth: '460px', width: '100%' }}>
            <h3 className="panel-title" style={{ marginBottom: '1rem' }}>Start New Consultation Visit</h3>
            <form onSubmit={handleCreateVisit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Chief Complaint *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Pain in lower right molar, bleeding gums..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Visit / Examination Notes</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Clinical observations, vital signs, radiographic findings..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowVisitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Start Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {toastMessage && (
        <div className="toast-notice">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
