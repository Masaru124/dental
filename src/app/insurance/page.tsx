'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send,
  Plus,
  X,
  FileText,
} from 'lucide-react';
import { useSession } from '@/components/AppShell';

interface Claim {
  id: string;
  invoice_id: string;
  invoice_total: number;
  patient_name: string;
  payer_name: string;
  policy_reference?: string;
  claim_status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  rejection_reason?: string;
  nhcx_reference_id?: string;
  submitted_at?: string;
  resolved_at?: string;
  created_at: string;
}

interface InvoiceOption {
  id: string;
  patient_name: string;
  total: number;
  created_at: string;
}

const CLAIM_PIPELINE_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
];

const COMMON_INSURERS = [
  'Star Health & Allied Insurance',
  'HDFC ERGO General Insurance',
  'Care Health Insurance (Religare)',
  'ICICI Lombard General Insurance',
  'Niva Bupa Health Insurance (Max)',
  'Aditya Birla Health Insurance',
  'Bajaj Allianz General Insurance',
  'Medi Assist TPA',
];

export default function InsuranceClaimsPage() {
  const { activeBranch } = useSession();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New Claim Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedPayer, setSelectedPayer] = useState(COMMON_INSURERS[0]);
  const [policyRef, setPolicyRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/insurance-claims?branch_id=${activeBranch}` : '/api/insurance-claims?branch_id=br_koramangala';
      const res = await fetch(url);
      const data = await res.json();
      if (data.claims) {
        setClaims(data.claims);
      }
    } catch (err) {
      console.error('Failed to load insurance claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const url = activeBranch ? `/api/invoices?branch_id=${activeBranch}` : '/api/invoices?branch_id=br_koramangala';
      const res = await fetch(url);
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
        if (data.invoices.length > 0 && !selectedInvoiceId) {
          setSelectedInvoiceId(data.invoices[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load invoices for insurance claim:', err);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchInvoices();
  }, [activeBranch]);

  const handleUpdateClaimStatus = async (id: string, newStatus: string, reason?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/insurance-claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          claim_status: newStatus,
          rejection_reason: reason,
          nhcx_reference_id: newStatus === 'submitted' ? 'NHCX-' + Math.floor(100000 + Math.random() * 900000) : undefined,
        }),
      });
      if (res.ok) {
        showToast(`Claim status updated to ${newStatus.toUpperCase()}`);
        fetchClaims();
      }
    } catch (err) {
      console.error('Failed to update claim:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Please select an invoice to file a claim against.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/insurance-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          payer_name: selectedPayer,
          policy_reference: policyRef || 'POL-DENT-' + Math.floor(100000 + Math.random() * 900000),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Insurance claim filed with ${selectedPayer} under NHCX!`);
        setShowCreateModal(false);
        setPolicyRef('');
        fetchClaims();
      } else {
        alert(data.error || 'Failed to submit claim');
      }
    } catch (err) {
      console.error('Error submitting claim:', err);
      alert('Error submitting insurance claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={16} color="#10b981" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', letterSpacing: '-0.02em' }}>
            Insurance Claims (NHCX / TPA)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Track pre-auth & settlement pipelines across Star Health, HDFC ERGO, Care Insurance, and NHCX protocols.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchClaims}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>File New Claim</span>
          </button>
        </div>
      </div>

      {/* Claims List */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading insurance claims...
          </div>
        ) : claims.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <Landmark size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>No insurance claims submitted yet.</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Click <strong>&quot;File New Claim&quot;</strong> above to file an insurance claim against an issued patient invoice.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Patient</th>
                  <th>Insurance Payer</th>
                  <th>Invoice Value</th>
                  <th>Status Pipeline</th>
                  <th>NHCX Reference</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => {
                  const isRejected = claim.claim_status === 'rejected';

                  return (
                    <tr key={claim.id}>
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-ink, #0f172a)' }}>
                          {claim.id}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #94a3b8)' }}>
                          {new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-accent-text, #0284c7)' }}>
                          {claim.patient_name}
                        </span>
                        {claim.policy_reference && (
                          <div style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #64748b)' }}>
                            Policy: {claim.policy_reference}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{claim.payer_name}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>
                          ₹{Number(claim.invoice_total).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        {isRejected ? (
                          <div className="pipeline-step rejected">
                            <XCircle size={13} />
                            <span>Rejected: {claim.rejection_reason || 'Documentation incomplete'}</span>
                          </div>
                        ) : (
                          <div className="status-pipeline">
                            {CLAIM_PIPELINE_STEPS.map((step, idx) => {
                              const stepIndex = CLAIM_PIPELINE_STEPS.findIndex(s => s.key === claim.claim_status);
                              const isCompleted = stepIndex > idx;
                              const isActive = claim.claim_status === step.key;

                              return (
                                <React.Fragment key={step.key}>
                                  <span
                                    className={`pipeline-step ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}
                                  >
                                    {isCompleted && '✓ '}
                                    {step.label}
                                  </span>
                                  {idx < CLAIM_PIPELINE_STEPS.length - 1 && (
                                    <span className="pipeline-connector" />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-ink-tertiary, #64748b)' }}>
                          {claim.nhcx_reference_id || 'Pending Link'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {claim.claim_status === 'submitted' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                                onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                                disabled={updatingId === claim.id}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '11px', color: '#dc2626' }}
                                onClick={() => handleUpdateClaimStatus(claim.id, 'rejected', 'Policy pre-existing condition clause')}
                                disabled={updatingId === claim.id}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {claim.claim_status === 'approved' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleUpdateClaimStatus(claim.id, 'paid')}
                              disabled={updatingId === claim.id}
                            >
                              Settle Payment
                            </button>
                          )}
                          {claim.claim_status === 'paid' && (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                              ✓ Disbursed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: File New Claim */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '560px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Submit NHCX Insurance Claim
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  Link an issued dental invoice to insurance payer & TPA
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '4px 6px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateClaim}>
              {/* Select Invoice */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Select Dental Invoice *
                </label>
                {invoices.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#ef4444' }}>
                    No invoices available. Please generate an invoice from the Billing section first.
                  </p>
                ) : (
                  <select
                    className="input"
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    required
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="" disabled>-- Choose Invoice --</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.patient_name} — Invoice #{inv.id} (₹{Number(inv.total).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Insurance Payer */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Insurance Provider / TPA *
                </label>
                <select
                  className="input"
                  value={selectedPayer}
                  onChange={(e) => setSelectedPayer(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  {COMMON_INSURERS.map((ins) => (
                    <option key={ins} value={ins}>{ins}</option>
                  ))}
                </select>
              </div>

              {/* Policy Number */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Policy Number / Member Card ID *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. STAR-IND-884920 or MEDI-9921"
                  value={policyRef}
                  onChange={(e) => setPolicyRef(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || invoices.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Transmitting to NHCX...' : 'Submit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
