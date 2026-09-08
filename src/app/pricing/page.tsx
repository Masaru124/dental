'use client';

import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, Plus, Edit2, Check, X, Search, RefreshCw, Sparkles } from 'lucide-react';

interface PriceItem {
  id: string;
  code: string;
  procedure_name: string;
  category: string;
  default_cost: number | string;
  patient_friendly_en: string;
  patient_friendly_hi: string;
}

export default function PricingPage() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [editEn, setEditEn] = useState<string>('');
  const [editHi, setEditHi] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New procedure fields
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Restorative');
  const [newCost, setNewCost] = useState('1500');
  const [newEn, setNewEn] = useState('');
  const [newHi, setNewHi] = useState('');

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/price-list');
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (err) {
      console.error('Fetch prices failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const startEdit = (item: PriceItem) => {
    setEditingItem(item);
    setEditFee(Number(item.default_cost));
    setEditEn(item.patient_friendly_en);
    setEditHi(item.patient_friendly_hi);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/price-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          default_cost: editFee,
          patient_friendly_en: editEn,
          patient_friendly_hi: editHi,
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id
              ? { ...it, default_cost: editFee, patient_friendly_en: editEn, patient_friendly_hi: editHi }
              : it
          )
        );
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Save price failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/price-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          procedure_name: newName,
          category: newCategory,
          default_cost: parseFloat(newCost),
          patient_friendly_en: newEn || newName,
          patient_friendly_hi: newHi || newName,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewCode('');
        setNewName('');
        setNewEn('');
        setNewHi('');
        fetchPrices();
      }
    } catch (err) {
      console.error('Add procedure failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.procedure_name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      i.patient_friendly_en.toLowerCase().includes(search.toLowerCase()) ||
      i.patient_friendly_hi.includes(search)
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Clinical Fee Schedule & Bilingual Catalog
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Configure standard treatment fees, procedural categories, and patient-friendly explanations in English & Hindi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add Custom Procedure</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel-card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '460px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search procedure name, category, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {/* Price Table with Edit Capability */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading fee schedule...</div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Code</th>
                  <th>Clinical Procedure</th>
                  <th>Category</th>
                  <th style={{ width: '130px' }}>Standard Fee (₹)</th>
                  <th>Patient-Friendly (English)</th>
                  <th>Patient-Friendly (हिंदी / Hindi)</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', fontSize: '12px' }}>
                        {item.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.procedure_name}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          background: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#475569',
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                        ₹{Number(item.default_cost).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#334155' }}>
                      {item.patient_friendly_en}
                    </td>
                    <td style={{ fontSize: '13px', color: '#0369a1', fontWeight: 500 }}>
                      {item.patient_friendly_hi}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                      >
                        <Edit2 size={12} />
                        <span>Edit Fee</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Fee Modal */}
      {editingItem && (
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
          <div className="panel-card" style={{ maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="panel-title">Edit Procedure Fee</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{editingItem.procedure_name} ({editingItem.code})</p>
              </div>
              <button onClick={() => setEditingItem(null)} style={{ color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Standard Fee (₹ INR) *</label>
              <input
                type="number"
                step="50"
                className="input-field"
                value={editFee}
                onChange={(e) => setEditFee(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Patient-Friendly Explanation (English)</label>
              <input
                type="text"
                className="input-field"
                value={editEn}
                onChange={(e) => setEditEn(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Patient-Friendly Explanation (हिंदी / Hindi)</label>
              <input
                type="text"
                className="input-field"
                value={editHi}
                onChange={(e) => setEditHi(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                <Check size={14} />
                <span>{isSaving ? 'Saving...' : 'Update Fee'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Procedure Modal */}
      {showAddModal && (
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
          <div className="panel-card" style={{ maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="panel-title">Add Custom Procedure</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProcedure}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Code *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. D9999"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Procedure Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Laser Gum Contouring"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="input-field"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Restorative">Restorative</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Prosthodontics">Prosthodontics</option>
                    <option value="Oral Surgery">Oral Surgery</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Cosmetic">Cosmetic</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Standard Fee (₹) *</label>
                  <input
                    type="number"
                    step="50"
                    className="input-field"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Patient Explanation (English)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Aesthetic gum reshaping treatment"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Patient Explanation (Hindi)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. मसूड़ों की लेजर द्वारा सौंदर्य सुधार प्रक्रिया"
                  value={newHi}
                  onChange={(e) => setNewHi(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  <Plus size={14} />
                  <span>{isSaving ? 'Adding...' : 'Save Procedure'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
