'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ToothChart, { ToothRecordItem, ToothCondition } from '@/components/ToothChart';
import ToothEditorPanel from '@/components/ToothEditorPanel';
import TreatmentPlanSection from '@/components/TreatmentPlanSection';
import ImagingSection from '@/components/ImagingSection';
import { User, Phone, Calendar, Clock, AlertTriangle, Plus, Eye, ArrowLeft, Box, Grid, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

// Dynamically import DentalArch3D with SSR disabled for maximum page load speed
const DentalArch3D = dynamic(() => import('@/components/DentalArch3D'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '520px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
        Initializing Realistic 3D Dentition Engine...
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>
        Streaming biological PBR enamel & clinical gingiva
      </div>
    </div>
  ),
});

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [toothRecords, setToothRecords] = useState<Record<string, ToothRecordItem>>({});
  const [aiFindings, setAiFindings] = useState<any[]>([]);
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
        setAiFindings(data.aiFindings || []);
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
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div className="skeleton" style={{ height: '36px', width: '220px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="skeleton" style={{ height: '36px', width: '120px' }} />
            <div className="skeleton" style={{ height: '36px', width: '140px' }} />
          </div>
        </div>
        <div className="panel-card skeleton" style={{ height: '90px', marginBottom: '1.25rem' }} />
        <div className="panel-card" style={{ height: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#f8fafc' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Loading 3D Dental Arch & Clinical Charts...</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Fetching FDI tooth records and radiograph diagnostics</div>
        </div>
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

  const patientDisplayName = patient?.full_name || patient?.name || 'Patient';

  return (
    <div>
      {/* Top Patient Bar with Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <Link
          href="/patients"
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          <span>Patient Roster</span>
        </Link>

        {/* View Mode Switcher: 3D Arch, 2D FDI, Dual View */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <button
              type="button"
              onClick={() => setChartViewMode('3d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: chartViewMode === '3d' ? 700 : 500,
                background: chartViewMode === '3d' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
                color: chartViewMode === '3d' ? '#ffffff' : '#475569',
                borderRadius: '8px',
                boxShadow: chartViewMode === '3d' ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Box size={14} />
              <span>3D Real Arch</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('2d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: chartViewMode === '2d' ? 700 : 500,
                background: chartViewMode === '2d' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
                color: chartViewMode === '2d' ? '#ffffff' : '#475569',
                borderRadius: '8px',
                boxShadow: chartViewMode === '2d' ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Grid size={14} />
              <span>2D FDI Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('both')}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: chartViewMode === 'both' ? 700 : 500,
                background: chartViewMode === 'both' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
                color: chartViewMode === 'both' ? '#ffffff' : '#475569',
                borderRadius: '8px',
                boxShadow: chartViewMode === 'both' ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s ease',
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
      <div className="panel-card" style={{ marginBottom: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '20px',
                  boxShadow: '0 0 0 2px #ffffff, 0 0 0 4px rgba(14, 165, 233, 0.35)',
                  flexShrink: 0,
                }}
              >
                {patientDisplayName.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {patientDisplayName}
                  </h1>
                  {patient.abha_number ? (
                    <span className="badge badge-abha" style={{ fontSize: '11px', padding: '3px 10px' }}>
                      ABHA: {patient.abha_number} ({patient.abha_link_status || 'linked'})
                    </span>
                  ) : (
                    <span className="badge badge-abha-unlinked" style={{ fontSize: '11px', padding: '3px 10px' }}>
                      ABHA: Unlinked
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '13px', color: '#64748b', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span>{patient.age} yrs • {patient.gender}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} color="#0284c7" />
                    <span style={{ fontFamily: 'monospace' }}>{patient.phone}</span>
                  </span>
                  <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>Record ID: {patient.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical History / Alerts Flag */}
          {((Array.isArray(patient.medical_alerts) && patient.medical_alerts.length > 0) || patient.medical_alerts || patient.medical_history) && (
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
              <span>
                Medical Alert:{' '}
                {Array.isArray(patient.medical_alerts)
                  ? patient.medical_alerts.join(', ')
                  : patient.medical_alerts || patient.medical_history}
              </span>
            </div>
          )}
        </div>

        {/* Visit History Timeline Strip */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', overflowX: 'auto' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', alignSelf: 'center' }}>
            Visits ({visits.length}):
          </span>
          {visits.map((v, idx) => {
            const rawDate = v.date || v.visit_date || v.created_at;
            const dateStr = rawDate && !isNaN(new Date(rawDate).getTime())
              ? new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : 'Recent';
            return (
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
                <strong>{dateStr}</strong>
                {v.chief_complaint && ` - ${v.chief_complaint.slice(0, 20)}...`}
              </div>
            );
          })}
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
            aiFindings={aiFindings}
          />
        )}
      </div>

      {/* Imaging & AI Radiograph Section */}
      {visits.length > 0 && (
        <ImagingSection
          visitId={visits[0].id}
          patientId={patientId}
          onFindingsGenerated={fetchPatientDetails}
        />
      )}

      {/* Treatment Plan Section with Live Totals */}
      <TreatmentPlanSection
        patientId={patientId}
        prefillTooth={prefillTreatmentTooth}
        onClearPrefillTooth={() => setPrefillTreatmentTooth(null)}
      />

      {/* Tooth Findings & Surface Editor Slide Panel */}
      {selectedTooth && (
        <ToothEditorPanel
          toothNumber={selectedTooth}
          currentRecord={toothRecords[selectedTooth]}
          aiFindings={aiFindings.filter((f) => f.tooth_number === selectedTooth)}
          onSave={handleSaveToothRecord}
          onAddTreatment={(toothNum) => {
            setPrefillTreatmentTooth(toothNum);
          }}
          onClose={() => setSelectedTooth(null)}
        />
      )}

      {/* New Consultation Visit Modal */}
      {showVisitModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="panel-title" style={{ margin: 0, fontSize: '16px' }}>Start New Consultation Visit</h3>
              <button
                type="button"
                onClick={() => setShowVisitModal(false)}
                style={{ color: '#94a3b8', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateVisit}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.15rem' }}>
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
                <div>
                  <label className="form-label">Visit / Examination Notes</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Clinical observations, vital signs, radiographic findings..."
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
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
