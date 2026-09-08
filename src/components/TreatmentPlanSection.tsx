'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Eye, FileDown, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export interface TreatmentItem {
  id: string;
  patient_id: string;
  tooth_number: string;
  procedure_name: string;
  priority: 'urgent' | 'soon' | 'preventive' | 'elective';
  quantity: number;
  unit_price: number | string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface PriceItem {
  id: string;
  code: string;
  procedure_name: string;
  category: string;
  default_cost: number | string;
  patient_friendly_en: string;
  patient_friendly_hi: string;
}

interface TreatmentPlanProps {
  patientId: string;
  prefillTooth?: string | null;
  onClearPrefillTooth?: () => void;
}

const PRIORITY_META = {
  urgent: { label: 'Urgent', color: 'badge-urgent', icon: AlertTriangle, desc: 'Immediate care needed' },
  soon: { label: 'Soon', color: 'badge-soon', icon: Clock, desc: 'Next 2-4 weeks' },
  preventive: { label: 'Preventive', color: 'badge-preventive', icon: ShieldCheck, desc: 'Maintenance & prevention' },
  elective: { label: 'Elective', color: 'badge-elective', icon: CheckCircle, desc: 'Aesthetic / elective' },
};

export default function TreatmentPlanSection({
  patientId,
  prefillTooth,
  onClearPrefillTooth,
}: TreatmentPlanProps) {
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [priceList, setPriceList] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding/editing
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toothNumber, setToothNumber] = useState('All');
  const [procedureName, setProcedureName] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'soon' | 'preventive' | 'elective'>('soon');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(1200);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/treatment-plan?patient_id=${patientId}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load plan items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceList = async () => {
    try {
      const res = await fetch('/api/price-list');
      const data = await res.json();
      if (data.items) {
        setPriceList(data.items);
        if (data.items.length > 0 && !procedureName) {
          setProcedureName(data.items[0].procedure_name);
          setUnitPrice(Number(data.items[0].default_cost));
        }
      }
    } catch (err) {
      console.error('Failed to load price list:', err);
    }
  };

  useEffect(() => {
    fetchPlan();
    fetchPriceList();
  }, [patientId]);

  // Handle prefill tooth from ToothChart
  useEffect(() => {
    if (prefillTooth) {
      setToothNumber(prefillTooth);
      setPriority('urgent');
      setShowModal(true);
      if (onClearPrefillTooth) onClearPrefillTooth();
    }
  }, [prefillTooth]);

  const handleProcedureSelect = (name: string) => {
    setProcedureName(name);
    const matched = priceList.find((p) => p.procedure_name === name);
    if (matched) {
      setUnitPrice(Number(matched.default_cost));
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        // Update
        await fetch('/api/treatment-plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            tooth_number: toothNumber,
            procedure_name: procedureName,
            priority,
            quantity,
            unit_price: unitPrice,
            notes,
          }),
        });
      } else {
        // Create
        await fetch('/api/treatment-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            tooth_number: toothNumber,
            procedure_name: procedureName,
            priority,
            quantity,
            unit_price: unitPrice,
            notes,
          }),
        });
      }
      setShowModal(false);
      setEditingId(null);
      fetchPlan();
    } catch (err) {
      console.error('Failed to save item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this procedure from the treatment plan?')) return;
    try {
      await fetch(`/api/treatment-plan?id=${id}`, { method: 'DELETE' });
      fetchPlan();
    } catch (err) {
      console.error('Delete item failed:', err);
    }
  };

  const startEdit = (item: TreatmentItem) => {
    setEditingId(item.id);
    setToothNumber(item.tooth_number);
    setProcedureName(item.procedure_name);
    setPriority(item.priority);
    setQuantity(item.quantity);
    setUnitPrice(Number(item.unit_price));
    setNotes(item.notes || '');
    setShowModal(true);
  };

  // Grand Total calculation per prompt specification:
  // const total = treatmentPlan.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const grandTotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );

  const urgentTotal = items
    .filter((i) => i.priority === 'urgent')
    .reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);

  const soonTotal = items
    .filter((i) => i.priority === 'soon')
    .reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);

  const electiveTotal = items
    .filter((i) => i.priority === 'elective' || i.priority === 'preventive')
    .reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);

  return (
    <div className="panel-card" style={{ marginTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="panel-title">Clinical Treatment Plan & Costing</h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Structured clinical procedures with prioritization, custom costing, and patient-ready presentation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <Link
            href={`/patients/${patientId}/presentation`}
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
          >
            <Eye size={16} />
            <span>Present to Patient</span>
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingId(null);
              setToothNumber('All');
              setShowModal(true);
            }}
          >
            <Plus size={16} />
            <span>Add Procedure</span>
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#f8fafc', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Grand Total Estimate
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
            ₹{grandTotal.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: '#0284c7' }}>{items.length} procedures planned</span>
        </div>

        <div style={{ background: '#fef2f2', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>
            Urgent Care Phase
          </span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b', marginTop: '4px' }}>
            ₹{urgentTotal.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: '#b91c1c' }}>Immediate infection/pain risk</span>
        </div>

        <div style={{ background: '#fff7ed', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: 600, textTransform: 'uppercase' }}>
            Recommended Soon
          </span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#9a3412', marginTop: '4px' }}>
            ₹{soonTotal.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: '#c2410c' }}>Next 2-4 weeks</span>
        </div>

        <div style={{ background: '#ecfdf5', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
          <span style={{ fontSize: '11px', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>
            Preventive & Elective
          </span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#065f46', marginTop: '4px' }}>
            ₹{electiveTotal.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: '#047857' }}>Maintenance & aesthetics</span>
        </div>
      </div>

      {/* Procedures Table */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
          <p style={{ fontSize: '14px', marginBottom: '0.75rem' }}>No procedures added to treatment plan yet.</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            <span>Add First Procedure</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="clinical-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Tooth</th>
                <th>Procedure</th>
                <th>Priority</th>
                <th style={{ width: '60px' }}>Qty</th>
                <th style={{ width: '120px' }}>Unit Cost</th>
                <th style={{ width: '130px' }}>Subtotal</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const prio = PRIORITY_META[item.priority];
                const subtotal = Number(item.quantity) * Number(item.unit_price);
                return (
                  <tr key={item.id}>
                    <td>
                      <span
                        style={{
                          background: item.tooth_number === 'All' ? '#f1f5f9' : '#e0f2fe',
                          color: item.tooth_number === 'All' ? '#475569' : '#0369a1',
                          fontWeight: 700,
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.tooth_number === 'All' ? 'Full Arch' : `#${item.tooth_number}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.procedure_name}</div>
                      {item.notes && <div style={{ fontSize: '12px', color: '#64748b' }}>{item.notes}</div>}
                    </td>
                    <td>
                      <span className={`badge ${prio.color}`}>
                        {prio.label}
                      </span>
                    </td>
                    <td>{item.quantity}</td>
                    <td>₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{subtotal.toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          style={{ padding: '6px', color: '#0284c7' }}
                          title="Edit Procedure"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ padding: '6px', color: '#ef4444' }}
                          title="Delete Procedure"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
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
          <div
            className="panel-card"
            style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="panel-title">{editingId ? 'Edit Procedure' : 'Add Treatment Procedure'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleSaveItem}>
              {/* Tooth Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Tooth Selection (FDI)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 16, 46, 21 or 'All' for Full Mouth"
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  required
                />
              </div>

              {/* Procedure Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Procedure from Price Catalog</label>
                <select
                  className="input-field"
                  value={procedureName}
                  onChange={(e) => handleProcedureSelect(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                >
                  {priceList.map((p) => (
                    <option key={p.id} value={p.procedure_name}>
                      {p.procedure_name} ({p.category}) - ₹{Number(p.default_cost).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Or enter custom procedure name"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  required
                />
              </div>

              {/* Priority Segmented Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Treatment Priority</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {(['urgent', 'soon', 'preventive', 'elective'] as const).map((p) => {
                    const isSel = priority === p;
                    const meta = PRIORITY_META[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`badge ${meta.color}`}
                        style={{
                          padding: '6px 4px',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: isSel ? '2px solid #0f172a' : undefined,
                          fontWeight: isSel ? 700 : 500,
                        }}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Quantity Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    className="input-field"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Unit Price (₹ INR)</label>
                  <input
                    type="number"
                    step="50"
                    className="input-field"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Clinical Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Clinical / Rationale Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Deep cavity encroaching pulp space, patient reports acute nocturnal throbbing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Procedure' : 'Add to Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
