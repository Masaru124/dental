'use client';

import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, CheckCircle, Clock, Calendar, ArrowRight, RefreshCw, X } from 'lucide-react';
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
    </div>
  );
}
