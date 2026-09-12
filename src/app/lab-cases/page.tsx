'use client';

import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, CheckCircle, Clock, Calendar, ArrowRight, RefreshCw, X, Download, Box, Eye } from 'lucide-react';
import { useSession } from '@/components/AppShell';

interface LabCase {
  id: string;
  branch_id: string;
  visit_id: string;
  tooth_refs: string[];
  lab_name: string;
  job_type: string;
  patient_name?: string;
  status: 'sent' | 'in_progress' | 'ready' | 'returned';
  sent_at: string;
  expected_return_at?: string;
  returned_at?: string;
  cost: number;
  notes?: string;
}

const COLUMNS: Array<{ key: LabCase['status']; label: string; color: string }> = [
  { key: 'sent', label: 'Sent to Lab', color: '#64748b' },
  { key: 'in_progress', label: 'In Production', color: '#0284c7' },
  { key: 'ready', label: 'Ready for Pickup', color: '#f59e0b' },
  { key: 'returned', label: 'Received at Clinic', color: '#10b981' },
];

export default function LabCasesPage() {
  const { activeBranch } = useSession();
  const [cases, setCases] = useState<LabCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStlCase, setSelectedStlCase] = useState<LabCase | null>(null);

  // New case form state
  const [labName, setLabName] = useState('DentCraft Precision Dental Lab');
  const [jobType, setJobType] = useState('Zirconia Crown');
  const [patientName, setPatientName] = useState('');
  const [toothRefs, setToothRefs] = useState('16');
  const [cost, setCost] = useState('3200');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/lab-cases?branch_id=${activeBranch}` : '/api/lab-cases?branch_id=br_koramangala';
      const res = await fetch(url);
      const data = await res.json();
      if (data.cases) {
        setCases(data.cases);
      }
    } catch (err) {
      console.error('Failed to load lab cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [activeBranch]);

  const handleUpdateStatus = async (id: string, nextStatus: LabCase['status']) => {
    try {
      await fetch('/api/lab-cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: nextStatus,
          returned_at: nextStatus === 'returned' ? new Date().toISOString() : undefined,
        }),
      });
      fetchCases();
    } catch (err) {
      console.error('Failed to move lab case:', err);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/lab-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: activeBranch || 'br_koramangala',
          visit_id: 'vis_kor_1', // default demo visit link
          patient_name: patientName,
          lab_name: labName,
          job_type: jobType,
          tooth_refs: toothRefs.split(',').map(s => s.trim()),
          cost: parseFloat(cost) || 0,
          expected_return_at: expectedDate ? new Date(expectedDate).toISOString() : undefined,
          notes,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setPatientName('');
        setNotes('');
        fetchCases();
      }
    } catch (err) {
      console.error('Create lab case failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', letterSpacing: '-0.02em' }}>
            Dental Lab Cases Kanban
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Track crown, bridge, aligner, and prosthesis work with external dental laboratories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchCases}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            <span>New Lab Order</span>
          </button>
        </div>
      </div>

      {/* Direct 3D Intraoral STL Cloud Vault Header */}
      <div
        id="direct-stl-vault-bar"
        className="panel-card"
        style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(224, 231, 255, 0.5))',
          border: '1px solid #c7d2fe',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Box size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e1b4b' }}>
                  Direct 3D Intraoral STL Cloud Vault
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Scanner Direct Sync (TRIOS / Medit / iTero)
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#4338ca', margin: '2px 0 0', lineHeight: 1.3 }}>
                Zero WhatsApp compression or WeTransfer expiration. Real-time CAD/CAM STL & PLY mesh handoff with sub-10µm margin inspection.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>3 Scans Ready for Milling</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colCases = cases.filter((c) => c.status === col.key);

          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: col.color,
                      display: 'inline-block',
                    }}
                  />
                  {col.label}
                </span>
                <span
                  style={{
                    background: 'var(--color-surface, #ffffff)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {colCases.length}
                </span>
              </div>

              {colCases.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  No jobs here
                </div>
              ) : (
                colCases.map((item) => (
                  <div key={item.id} className="kanban-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-ink, #0f172a)' }}>
                        {item.job_type}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background: 'var(--color-accent-subtle, #e0f2fe)',
                          color: 'var(--color-accent-text, #0369a1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.tooth_refs?.map(t => `#${t}`).join(', ') || 'N/A'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #475569)', marginTop: '4px' }}>
                      Patient: <strong>{item.patient_name || 'Walk-in'}</strong>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #64748b)', marginTop: '2px' }}>
                      Lab: {item.lab_name}
                    </div>

                    {/* 3D STL Cloud Asset Badge & Actions */}
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 8px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Box size={13} style={{ color: '#6366f1' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Intraoral STL</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          id="view-3d-scan-btn"
                          type="button"
                          onClick={() => setSelectedStlCase(item)}
                          style={{
                            background: '#e0e7ff',
                            color: '#4338ca',
                            border: 'none',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="View 3D Mesh"
                        >
                          <Eye size={10} />
                          <span>View</span>
                        </button>
                        <button
                          id="download-stl-btn"
                          type="button"
                          onClick={() => {
                            const dummyContent = 'solid dental_scan\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid dental_scan';
                            const blob = new Blob([dummyContent], { type: 'model/stl' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `case_${item.id}_tooth_${item.tooth_refs?.[0] || 'prep'}.stl`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="Download STL File"
                        >
                          <Download size={10} />
                          <span>STL</span>
                        </button>
                      </div>
                    </div>

                    {item.expected_return_at && (
                      <div style={{ fontSize: '11px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        <Calendar size={11} />
                        <span>Due: {new Date(item.expected_return_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}

                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(item.cost).toLocaleString('en-IN')}
                      </span>

                      {/* Next status action */}
                      {col.key === 'sent' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                        >
                          Mark In Production →
                        </button>
                      )}
                      {col.key === 'in_progress' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => handleUpdateStatus(item.id, 'ready')}
                        >
                          Mark Ready →
                        </button>
                      )}
                      {col.key === 'ready' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => handleUpdateStatus(item.id, 'returned')}
                        >
                          Received ✓
                        </button>
                      )}
                      {col.key === 'returned' && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                          ✓ At Clinic
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* New Lab Case Modal */}
      {showModal && (
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
          <div className="panel-card" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="panel-title">Create Dental Lab Order</h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCase}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Patient Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Work Type *</label>
                  <select
                    className="input-field"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="Zirconia Crown">Zirconia Crown</option>
                    <option value="PFM Bridge (3-unit)">PFM Bridge (3-unit)</option>
                    <option value="E-Max Veneer">E-Max Veneer</option>
                    <option value="Complete Denture">Complete Denture</option>
                    <option value="Clear Aligner Set">Clear Aligner Set</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Tooth Numbers</label>
                  <input
                    type="text"
                    className="input-field"
                    value={toothRefs}
                    onChange={(e) => setToothRefs(e.target.value)}
                    placeholder="e.g. 16, 17"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Laboratory Partner *</label>
                <input
                  type="text"
                  className="input-field"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Lab Cost (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Expected Return Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Lab Instructions / Shade Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Shade A2, high translucency, buccal clearance..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating Order...' : 'Send to Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D STL Mesh Inspector Modal */}
      {selectedStlCase && (
        <div
          id="stl-viewer-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="panel-card"
            style={{
              maxWidth: '600px',
              width: '100%',
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box size={20} style={{ color: '#818cf8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Intraoral 3D Scan Mesh Inspector
                </h3>
              </div>
              <button
                id="close-stl-modal-btn"
                type="button"
                onClick={() => setSelectedStlCase(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 3D Simulated Canvas */}
            <div
              style={{
                height: '220px',
                background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
                borderRadius: '12px',
                border: '1px dashed #334155',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  border: '2px solid rgba(99, 102, 241, 0.6)',
                  borderRadius: '16px',
                  transform: 'rotateX(45deg) rotateZ(30deg)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(99, 102, 241, 0.1)',
                }}
              >
                <Box size={48} style={{ color: '#a5b4fc' }} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                Tooth #{selectedStlCase.tooth_refs?.[0] || '16'} Prep Mesh • 248,500 Triangles
              </div>
            </div>

            {/* Mesh Specs */}
            <div
              style={{
                marginTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                background: '#1e293b',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Margin Line:</span>
                <div style={{ color: '#34d399', fontWeight: 700 }}>Continuous &lt;8µm</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Occlusal Clearance:</span>
                <div style={{ color: '#38bdf8', fontWeight: 700 }}>1.8mm (Optimal)</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Scanner Sync:</span>
                <div style={{ color: '#facc15', fontWeight: 700 }}>3Shape Cloud API</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedStlCase(null)}
              >
                Close Inspector
              </button>
              <button
                id="direct-milling-export-btn"
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#4f46e5', borderColor: '#4338ca' }}
                onClick={() => {
                  alert(`Direct CAD/CAM milling packet dispatched to ${selectedStlCase.lab_name}!`);
                  setSelectedStlCase(null);
                }}
              >
                Send to Dental Lab Milling Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
