'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Download,
  IndianRupee,
  RefreshCw,
  Landmark,
  X,
  Trash2,
  Send,
} from 'lucide-react';
import { useSession } from '@/components/AppShell';

interface Invoice {
  id: string;
  branch_id: string;
  patient_id: string;
  patient_name: string;
  visit_id: string;
  gstin?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  created_at: string;
  issued_at?: string;
}

const COMMON_PROCEDURES = [
  { name: 'Comprehensive Dental Consultation & Diagnostics', cost: 800 },
  { name: 'Root Canal Treatment (Single Canal)', cost: 3500 },
  { name: 'Composite Light-Cure Restoration', cost: 1400 },
  { name: 'Zirconia Aesthetic Crown (Monolithic)', cost: 7500 },
  { name: 'Full Mouth Ultrasonic Scaling & Polishing', cost: 1800 },
  { name: 'Digital OPG Panoramic Radiograph', cost: 900 },
  { name: 'Surgical Extraction (Impacted 3rd Molar)', cost: 4500 },
];

const COMMON_INSURERS = [
  'Star Health & Allied Insurance',
  'HDFC ERGO General Insurance',
  'Care Health Insurance (Religare)',
  'ICICI Lombard General Insurance',
  'Niva Bupa Health Insurance (Max)',
  'Aditya Birla Health Insurance',
  'Medi Assist TPA',
];

export default function BillingPage() {
  const { activeBranch } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [lineItems, setLineItems] = useState<{ description: string; amount: number }[]>([
    { description: 'Comprehensive Dental Consultation & Diagnostics', amount: 800 },
  ]);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // File Claim Modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimInvoice, setClaimInvoice] = useState<Invoice | null>(null);
  const [claimPayer, setClaimPayer] = useState(COMMON_INSURERS[0]);
  const [claimPolicyRef, setClaimPolicyRef] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/invoices?branch_id=${activeBranch}` : '/api/invoices?branch_id=br_koramangala';
      const res = await fetch(url);
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const url = activeBranch ? `/api/patients?branch_id=${activeBranch}` : '/api/patients';
      const res = await fetch(url);
      const data = await res.json();
      if (data.patients) {
        setPatients(data.patients);
        if (data.patients.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data.patients[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load patients for billing:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, [activeBranch]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        showToast(`Invoice status updated to ${newStatus.toUpperCase()}`);
        fetchInvoices();
      }
    } catch (err) {
      console.error('Failed to update invoice status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Create Invoice Submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }
    if (lineItems.length === 0) {
      alert('Please add at least one billable procedure.');
      return;
    }

    setIsSubmittingInvoice(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          custom_items: lineItems,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`GST Invoice ${data.invoice.id} created successfully!`);
        setShowCreateModal(false);
        setLineItems([{ description: 'Comprehensive Dental Consultation & Diagnostics', amount: 800 }]);
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Error creating invoice');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  // Submit Insurance Claim
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInvoice) return;

    setIsSubmittingClaim(true);
    try {
      const res = await fetch('/api/insurance-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: claimInvoice.id,
          payer_name: claimPayer,
          policy_reference: claimPolicyRef || 'POL-DENT-' + Math.floor(100000 + Math.random() * 900000),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Insurance claim filed with ${claimPayer} under NHCX!`);
        setShowClaimModal(false);
        setClaimPolicyRef('');
      } else {
        alert(data.error || 'Failed to file claim');
      }
    } catch (err) {
      console.error('Error filing claim:', err);
      alert('Error submitting claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === 'all') return true;
    return inv.status === statusFilter;
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0);
  const totalPending = invoices.filter((i) => i.status === 'issued' || i.status === 'draft').reduce((sum, i) => sum + Number(i.total), 0);

  // Line items totals in modal
  const modalSubtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const modalGst = Math.round((modalSubtotal * 0.18) * 100) / 100;
  const modalTotal = modalSubtotal + modalGst;

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
            GST Invoicing & Billing
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Compliant dental invoicing with SAC 999312 (18% GST), server-side calculated totals, and insurance integration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchInvoices}
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
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <span className="kpi-label">Total Invoiced</span>
          <div className="kpi-value">₹{totalInvoiced.toLocaleString('en-IN')}</div>
          <span className="kpi-sub">{invoices.length} invoices generated</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Total Collected (Paid)</span>
          <div className="kpi-value" style={{ color: '#059669' }}>₹{totalPaid.toLocaleString('en-IN')}</div>
          <span className="kpi-sub">{invoices.filter(i => i.status === 'paid').length} cleared payments</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Outstanding Balance</span>
          <div className="kpi-value" style={{ color: '#d97706' }}>₹{totalPending.toLocaleString('en-IN')}</div>
          <span className="kpi-sub">{invoices.filter(i => i.status === 'issued' || i.status === 'draft').length} pending collection</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
        {[
          { key: 'all', label: 'All Invoices' },
          { key: 'draft', label: 'Draft' },
          { key: 'issued', label: 'Issued (Pending)' },
          { key: 'paid', label: 'Paid' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className="btn btn-sm"
            style={{
              background: statusFilter === tab.key ? 'var(--color-ink, #0f172a)' : 'var(--color-surface, #ffffff)',
              color: statusFilter === tab.key ? '#ffffff' : 'var(--color-ink-secondary, #475569)',
              border: 'var(--border-hairline, 1px solid #cbd5e1)',
              fontWeight: statusFilter === tab.key ? 700 : 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>No invoices found in this view.</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Click <strong>&quot;New Invoice&quot;</strong> above to generate a GST compliant bill.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient Name</th>
                  <th>GSTIN</th>
                  <th>Subtotal</th>
                  <th>GST (18%)</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-ink, #0f172a)' }}>
                        {inv.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-accent-text, #0284c7)' }}>
                        {inv.patient_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-ink-tertiary, #64748b)' }}>
                        {inv.gstin || 'N/A'}
                      </span>
                    </td>
                    <td>₹{Number(inv.subtotal).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-ink-tertiary, #64748b)' }}>
                      ₹{Number(inv.tax_amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--color-ink, #0f172a)' }}>
                        ₹{Number(inv.total).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            inv.status === 'paid'
                              ? '#ecfdf5'
                              : inv.status === 'issued'
                              ? '#fffbeb'
                              : inv.status === 'cancelled'
                              ? '#fef2f2'
                              : '#f1f5f9',
                          color:
                            inv.status === 'paid'
                              ? '#065f46'
                              : inv.status === 'issued'
                              ? '#92400e'
                              : inv.status === 'cancelled'
                              ? '#991b1b'
                              : '#475569',
                          border:
                            inv.status === 'paid'
                              ? '1px solid #a7f3d0'
                              : inv.status === 'issued'
                              ? '1px solid #fde68a'
                              : inv.status === 'cancelled'
                              ? '1px solid #fecaca'
                              : '1px solid #e2e8f0',
                        }}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #64748b)' }}>
                      {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {/* File Insurance Claim Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="File Insurance Claim for this Invoice"
                          onClick={() => {
                            setClaimInvoice(inv);
                            setShowClaimModal(true);
                          }}
                        >
                          <Landmark size={12} color="#0284c7" />
                          <span>Insurance</span>
                        </button>

                        {inv.status === 'draft' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleUpdateStatus(inv.id, 'issued')}
                            disabled={updatingId === inv.id}
                          >
                            Issue
                          </button>
                        )}
                        {inv.status === 'issued' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleUpdateStatus(inv.id, 'paid')}
                            disabled={updatingId === inv.id}
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                            ✓ Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create GST Invoice */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Generate New GST Invoice
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  Compliant Dental Services (SAC 999312 • 18% GST)
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

            <form onSubmit={handleCreateInvoice}>
              {/* Select Patient */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Select Patient *
                </label>
                <select
                  className="input"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  <option value="" disabled>-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.full_name} ({p.phone} • ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Billable Procedures */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Billable Dental Procedures
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => setLineItems([...lineItems, { description: '', amount: 1000 }])}
                  >
                    + Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lineItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Procedure / service name"
                        value={item.description}
                        onChange={(e) => {
                          const next = [...lineItems];
                          next[idx].description = e.target.value;
                          setLineItems(next);
                        }}
                        required
                        style={{ flex: 1, fontSize: '13px' }}
                      />
                      <div style={{ position: 'relative', width: '130px' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '8px', fontSize: '12px', color: '#64748b' }}>₹</span>
                        <input
                          type="number"
                          className="input"
                          placeholder="Amount"
                          value={item.amount || ''}
                          onChange={(e) => {
                            const next = [...lineItems];
                            next[idx].amount = Number(e.target.value);
                            setLineItems(next);
                          }}
                          required
                          style={{ paddingLeft: '22px', fontSize: '13px', width: '100%' }}
                        />
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px', color: '#ef4444' }}
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick procedure templates */}
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>Templates:</span>
                  {COMMON_PROCEDURES.slice(0, 3).map((cp) => (
                    <button
                      key={cp.name}
                      type="button"
                      onClick={() => setLineItems([...lineItems, { description: cp.name, amount: cp.cost }])}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      + {cp.name.split(' ')[0]} (₹{cp.cost})
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <span>Subtotal:</span>
                  <span>₹{modalSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  <span>GST (18% SAC 999312):</span>
                  <span>₹{modalGst.toLocaleString('en-IN')}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0f172a',
                    borderTop: '1px solid #cbd5e1',
                    paddingTop: '6px',
                  }}
                >
                  <span>Grand Total:</span>
                  <span>₹{modalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
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
                  disabled={isSubmittingInvoice}
                >
                  {isSubmittingInvoice ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: File Insurance Claim */}
      {showClaimModal && claimInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  File Insurance Claim
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  Submit pre-auth & settlement claim via NHCX / TPA
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowClaimModal(false)}
                style={{ padding: '4px 6px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim}>
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '1rem',
                  fontSize: '12px',
                  color: '#0369a1',
                }}
              >
                <div><strong>Patient:</strong> {claimInvoice.patient_name}</div>
                <div><strong>Invoice ID:</strong> {claimInvoice.id}</div>
                <div><strong>Claim Value:</strong> ₹{Number(claimInvoice.total).toLocaleString('en-IN')}</div>
              </div>

              {/* Insurance Provider */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Insurance Provider / TPA *
                </label>
                <select
                  className="input"
                  value={claimPayer}
                  onChange={(e) => setClaimPayer(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  {COMMON_INSURERS.map((ins) => (
                    <option key={ins} value={ins}>{ins}</option>
                  ))}
                </select>
              </div>

              {/* Policy Reference */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Policy / TPA Reference Number *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. STAR-IND-9948271 or Member ID"
                  value={claimPolicyRef}
                  onChange={(e) => setClaimPolicyRef(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClaimModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingClaim}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{isSubmittingClaim ? 'Submitting to NHCX...' : 'Submit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
