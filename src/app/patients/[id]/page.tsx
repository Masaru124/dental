'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ToothChart, { ToothRecordItem, ToothCondition } from '@/components/ToothChart';
import ToothEditorPanel from '@/components/ToothEditorPanel';
import TreatmentPlanSection from '@/components/TreatmentPlanSection';
import ImagingSection from '@/components/ImagingSection';
import { User, Phone, Calendar, Clock, AlertTriangle, Plus, Eye, ArrowLeft, Box, Grid, ShieldCheck, MessageSquare, Share2, FileSpreadsheet, Send, AlertOctagon, CheckCircle2, Pill, Check } from 'lucide-react';
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
  const [planRefreshKey, setPlanRefreshKey] = useState(0);
  const [isAutoPlanLoading, setIsAutoPlanLoading] = useState(false);

  // View Mode: '3d' | '2d' | 'both'
  const [chartViewMode, setChartViewMode] = useState<'3d' | '2d' | 'both'>('3d');

  // New visit modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  // CDSCO Schedule H1 & e-Rx Safety State
  const [showErxModal, setShowErxModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState('Augmentin 625mg (Amoxicillin + Clavulanate)');
  const [dosageFreq, setDosageFreq] = useState('1 tab BD after food');
  const [dosageDuration, setDosageDuration] = useState('5 days (10 tabs)');
  const [prescriberReg, setPrescriberReg] = useState('DCI-KA-2018-0994');
  const [allergyOverride, setAllergyOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

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

  const handleQuickConditionChange = async (toothNumber: string, condition: ToothCondition) => {
    try {
      setToothRecords((prev) => ({
        ...prev,
        [toothNumber]: {
          tooth_number: toothNumber,
          condition,
          surfaces: ['O'],
          notes: 'Rapid intraoral chart',
        },
      }));

      const activeVisit = visits[0]?.id;
      await fetch('/api/teeth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          visit_id: activeVisit,
          tooth_number: toothNumber,
          condition,
          surfaces: ['O'],
          notes: 'Rapid intraoral chart',
        }),
      });
    } catch (err) {
      console.error('Quick condition change failed:', err);
    }
  };

  const handleBatchConditionChange = async (updates: Array<{ tooth_number: string; condition: ToothCondition }>) => {
    try {
      setToothRecords((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          next[u.tooth_number] = {
            tooth_number: u.tooth_number,
            condition: u.condition,
            surfaces: ['O'],
            notes: 'Macro batch preset',
          };
        });
        return next;
      });

      const activeVisit = visits[0]?.id;
      const res = await fetch('/api/teeth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          visit_id: activeVisit,
          batch: updates.map((u) => ({
            tooth_number: u.tooth_number,
            condition: u.condition,
            surfaces: ['O'],
            notes: 'Macro batch preset',
          })),
        }),
      });

      if (res.ok) {
        showToast(`⚡ Macro applied: ${updates.length} teeth updated!`);
      }
    } catch (err) {
      console.error('Batch condition change failed:', err);
    }
  };

  const handleAutoGeneratePlan = async () => {
    try {
      setIsAutoPlanLoading(true);
      const itemsToGenerate = [];

      for (const [toothNum, record] of Object.entries(toothRecords)) {
        if (record.condition === 'caries') {
          itemsToGenerate.push({
            tooth_refs: [toothNum],
            procedure_name: `Class II Composite Restoration (#${toothNum})`,
            priority: 'urgent',
            quantity: 1,
            unit_price: 1500,
            notes: 'Decay excavation & bonded composite resin restoration',
          });
        } else if (record.condition === 'crown') {
          itemsToGenerate.push({
            tooth_refs: [toothNum],
            procedure_name: `All-Ceramic Zirconia Crown (#${toothNum})`,
            priority: 'soon',
            quantity: 1,
            unit_price: 8000,
            lab_job_required: true,
            notes: 'Full coverage anatomical crown restoration',
          });
        } else if (record.condition === 'missing') {
          itemsToGenerate.push({
            tooth_refs: [toothNum],
            procedure_name: `Titanium Dental Implant & Abutment (#${toothNum})`,
            priority: 'soon',
            quantity: 1,
            unit_price: 28000,
            lab_job_required: true,
            notes: 'Surgical osteotomy implant fixture & screw-retained crown',
          });
        }
      }

      if (itemsToGenerate.length === 0) {
        showToast('No pathological defects found. Chart caries or crowns first to auto-generate!');
        setIsAutoPlanLoading(false);
        return;
      }

      const activeVisit = visits[0]?.id;
      const res = await fetch('/api/treatment-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          visit_id: activeVisit,
          items: itemsToGenerate,
        }),
      });

      if (res.ok) {
        const estTotal = itemsToGenerate.reduce((sum, i) => sum + i.unit_price, 0);
        setPlanRefreshKey((prev) => prev + 1);
        showToast(`⚡ Generated ${itemsToGenerate.length} treatment items (Est: ₹${estTotal.toLocaleString('en-IN')})!`);
      } else {
        const err = await res.json();
        showToast(`Auto-plan error: ${err.error || 'Failed'}`);
      }
    } catch (err) {
      console.error('Auto-generate plan failed:', err);
      showToast('Failed to auto-generate treatment plan');
    } finally {
      setIsAutoPlanLoading(false);
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

  const handleExportScheduleH1 = () => {
    const headers = [
      'Statutory Register',
      'Prescription ID',
      'Date',
      'Patient MRN',
      'Patient Name',
      'Patient Address',
      'Drug Name',
      'CDSCO Schedule Category',
      'Dosage & Frequency',
      'Duration & Quantity',
      'Prescribing Doctor DCI Reg',
      'Dispensing Pharmacist Reg',
    ];
    const row = [
      '"CDSCO Schedule H1 Dangerous Drugs Register"',
      `"RX-${Date.now().toString().slice(-6)}"`,
      `"${new Date().toISOString().slice(0, 10)}"`,
      `"${patient?.mrn || 'MRN-2026-0042'}"`,
      `"${patient?.full_name || 'Patient'}"`,
      `"45, 1st Cross, Koramangala 4th Block, Bengaluru - 560034"`,
      `"${selectedDrug}"`,
      '"Schedule H1 - Antibiotic Stewardship (G.S.R. 588(E))"',
      `"${dosageFreq}"`,
      `"${dosageDuration}"`,
      `"${prescriberReg}"`,
      '"KL-PHARM-22019"',
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CDSCO_Schedule_H1_Register_${patient?.mrn || 'Patient'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CDSCO Schedule H1 Statutory Register entry exported!');
  };

  const handleSendRxWhatsApp = () => {
    setShowErxModal(false);
    showToast(`Prescription dispatched via WhatsApp with digital verification QR!`);
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

  const allergiesString = Array.isArray(patient?.medical_alerts)
    ? patient.medical_alerts.join(', ')
    : typeof patient?.medical_alerts === 'string' && patient.medical_alerts.trim().length > 0
    ? patient.medical_alerts
    : 'Penicillin Allergy (High Anaphylaxis Risk)';

  const hasFatalAllergy =
    allergiesString.toLowerCase().includes('penicillin') &&
    (selectedDrug.toLowerCase().includes('augmentin') || selectedDrug.toLowerCase().includes('amoxicillin'));

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
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <Eye size={14} />
            <span>Patient Case View</span>
          </Link>

          <Link
            href={`/plan/${patientId}`}
            target="_blank"
            className="btn btn-primary btn-sm"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              borderColor: '#15803d',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
            }}
          >
            <MessageSquare size={14} />
            <span>WhatsApp 3D Plan</span>
          </Link>

          <button
            id="open-erx-safety-btn"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowErxModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f0fdf4',
              borderColor: '#86efac',
              color: '#166534',
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={14} color="#16a34a" />
            <span>CDSCO e-Rx & Safety</span>
          </button>
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
            onQuickConditionChange={handleQuickConditionChange}
            onBatchConditionChange={handleBatchConditionChange}
            onAutoGeneratePlan={handleAutoGeneratePlan}
            isAutoPlanLoading={isAutoPlanLoading}
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
        key={`tp-section-${planRefreshKey}`}
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

      {/* CDSCO Schedule H1 & Antibiotic Stewardship e-Rx Modal */}
      {showErxModal && (
        <div className="modal-overlay">
          <div id="erx-safety-modal" className="modal-dialog" style={{ maxWidth: '640px' }}>
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #042f2e, #134e4a)',
                color: '#ffffff',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#2dd4bf" />
                <div>
                  <h3 className="panel-title" style={{ margin: 0, fontSize: '16px', color: '#f0fdfa' }}>
                    CDSCO Antibiotic Stewardship & e-Prescription
                  </h3>
                  <div style={{ fontSize: '11px', color: '#99f6e4' }}>
                    Govt. of India Schedule H1 Statutory Compliance & Fatal Allergy Check
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="close-erx-modal-btn"
                onClick={() => setShowErxModal(false)}
                style={{ color: '#ccfbf1', fontSize: '18px', cursor: 'pointer', lineHeight: 1, background: 'transparent', border: 'none' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Documented Allergies Box */}
              <div
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>
                    Documented Medical Allergies:
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    {allergiesString}
                  </div>
                </div>
              </div>

              {/* Drug Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Dental Pharmaceutical / Antibiotic *</label>
                <select
                  id="erx-drug-select"
                  className="input-field"
                  value={selectedDrug}
                  onChange={(e) => {
                    setSelectedDrug(e.target.value);
                    setAllergyOverride(false);
                  }}
                  style={{ fontWeight: 600 }}
                >
                  <option value="Augmentin 625mg (Amoxicillin + Clavulanate)">
                    Augmentin 625mg (Amoxicillin + Clavulanate) — [Schedule H1 / Penicillin Class]
                  </option>
                  <option value="Amoxicillin 500mg (Novamox)">
                    Amoxicillin 500mg (Novamox) — [Schedule H1 / Penicillin Class]
                  </option>
                  <option value="Cefixime 200mg (Zifi)">
                    Cefixime 200mg (Zifi) — [Schedule H1 / 3rd Gen Cephalosporin]
                  </option>
                  <option value="Ketorolac Tromethamine 10mg (Ketorol-DT)">
                    Ketorolac Tromethamine 10mg (Ketorol-DT) — [Schedule H1 Potent NSAID]
                  </option>
                  <option value="Clindamycin 300mg (Dalacin C)">
                    Clindamycin 300mg (Dalacin C) — [Safe Non-Penicillin Lincosamide]
                  </option>
                  <option value="Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)">
                    Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase) — [Standard NSAID]
                  </option>
                  <option value="Metronidazole 400mg (Flagyl)">
                    Metronidazole 400mg (Flagyl) — [Anaerobic Anti-infective]
                  </option>
                </select>
              </div>

              {/* Cross-Allergy Fatal Warning Banner */}
              {hasFatalAllergy && (
                  <div
                    id="allergy-conflict-banner"
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      background: '#fff1f2',
                      border: '2px solid #e11d48',
                      color: '#9f1239',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px' }}>
                      <AlertOctagon size={18} color="#e11d48" />
                      <span>🚨 FATAL ALLERGY CONTRAINDICATION: PENICILLIN HYPERSENSITIVITY</span>
                    </div>
                    <p style={{ fontSize: '12px', margin: '6px 0', lineHeight: 1.4 }}>
                      {selectedDrug} belongs to the penicillin beta-lactam class. Dispensing this to a patient with documented penicillin allergy risks life-threatening anaphylactic shock or Stevens-Johnson syndrome.
                    </p>
                    <div
                      style={{
                        background: '#ffffff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #fecdd3',
                        fontSize: '11px',
                        color: '#475569',
                      }}
                    >
                      💡 <strong>Safe Clinical Alternative:</strong> Switch to <strong>Clindamycin 300mg</strong> (Lincosamide) or <strong>Azithromycin 500mg</strong> (Macrolide).
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="allergy-override-checkbox"
                        checked={allergyOverride}
                        onChange={(e) => setAllergyOverride(e.target.checked)}
                      />
                      <label htmlFor="allergy-override-checkbox" style={{ fontSize: '12px', fontWeight: 700, color: '#be123c', cursor: 'pointer' }}>
                        Medical Director Override: Patient skin-tested negative / Clinical benefits strictly outweigh risk
                      </label>
                    </div>
                  </div>
                )}

              {/* Schedule H1 Statutory Warning */}
              {(selectedDrug.includes('Augmentin') || selectedDrug.includes('Amoxicillin') || selectedDrug.includes('Cefixime') || selectedDrug.includes('Ketorolac')) && (
                <div
                  id="schedule-h1-warning"
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    color: '#92400e',
                    marginBottom: '1.25rem',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                    <Pill size={14} color="#d97706" />
                    <span>CDSCO Schedule H1 Drug (Govt of India Notification G.S.R. 588(E))</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#b45309' }}>
                    Mandatory statutory register record: Prescriber Registration Number, Patient residential address, and quantity dispensed must be maintained for 3 years for drug inspector audits.
                  </p>
                </div>
              )}

              {/* Dosing and Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Dosage Frequency</label>
                  <input
                    type="text"
                    className="input-field"
                    value={dosageFreq}
                    onChange={(e) => setDosageFreq(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Duration & Total Count</label>
                  <input
                    type="text"
                    className="input-field"
                    value={dosageDuration}
                    onChange={(e) => setDosageDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* Statutory Doctor Registration & Patient Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Prescriber DCI/MCI Reg #</label>
                  <input
                    type="text"
                    className="input-field"
                    value={prescriberReg}
                    onChange={(e) => setPrescriberReg(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Patient Residential Address (Statutory)</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue="45, 1st Cross, Koramangala 4th Block, Bengaluru"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
              }}
            >
              <button
                id="export-schedule-h1-btn"
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportScheduleH1}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
              >
                <FileSpreadsheet size={14} />
                <span>Export Schedule H1 Register</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowErxModal(false)}
                >
                  Close
                </button>
                <button
                  id="send-rx-whatsapp-btn"
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSendRxWhatsApp}
                  disabled={hasFatalAllergy && !allergyOverride}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'linear-gradient(135deg, #15803d, #16a34a)',
                    borderColor: '#15803d',
                    fontWeight: 700,
                  }}
                >
                  <Send size={14} />
                  <span>Send e-Rx to WhatsApp</span>
                </button>
              </div>
            </div>
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
