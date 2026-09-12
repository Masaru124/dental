'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, RefreshCw, PlusCircle, Check } from 'lucide-react';
import { useSession } from '@/components/AppShell';

interface InventoryItem {
  id: string;
  branch_id: string;
  name: string;
  category?: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  unit: string;
  last_restocked_at?: string;
}

export default function InventoryPage() {
  const { activeBranch } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Consumables');
  const [quantity, setQuantity] = useState('10');
  const [threshold, setThreshold] = useState('5');
  const [unit, setUnit] = useState('box');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/inventory?branch_id=${activeBranch}` : '/api/inventory?branch_id=br_koramangala';
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setLowStockCount(data.lowStockCount || 0);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [activeBranch]);

  const handleRestock = async (item: InventoryItem) => {
    const addQty = prompt(`How many units of "${item.name}" are you adding to stock?`, '10');
    if (!addQty) return;

    const added = parseInt(addQty, 10);
    if (isNaN(added) || added <= 0) return;

    try {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          quantity_on_hand: item.quantity_on_hand + added,
          is_restock: true,
        }),
      });
      fetchInventory();
    } catch (err) {
      console.error('Failed to restock item:', err);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: activeBranch || 'br_koramangala',
          name,
          category,
          quantity_on_hand: parseInt(quantity, 10) || 0,
          reorder_threshold: parseInt(threshold, 10) || 5,
          unit,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setName('');
        fetchInventory();
      }
    } catch (err) {
      console.error('Create item failed:', err);
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
            Clinical Inventory & Supplies
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Branch-scoped inventory tracking with automated low-stock reorder thresholds and restock logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchInventory}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={14} />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Alert banner if low stock */}
      {lowStockCount > 0 && (
        <div
          style={{
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '1.25rem',
            fontSize: '13px',
          }}
        >
          <AlertTriangle size={18} color="#ef4444" />
          <span>
            <strong>{lowStockCount} item(s) are below reorder threshold!</strong> Please initiate vendor purchase orders.
          </span>
        </div>
      )}

      {/* Inventory Table */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading inventory stock...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <Package size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
            <p style={{ fontSize: '14px' }}>No inventory items found for this branch.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity on Hand</th>
                  <th>Reorder Threshold</th>
                  <th>Stock Status</th>
                  <th>Last Restocked</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLow = item.quantity_on_hand <= item.reorder_threshold;

                  return (
                    <tr key={item.id} style={{ background: isLow ? '#fff7ed' : undefined }}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-ink, #0f172a)' }}>
                          {item.name}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #64748b)' }}>
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: isLow ? '#c2410c' : '#0f172a' }}>
                          {item.quantity_on_hand} {item.unit}s
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--color-ink-tertiary, #64748b)' }}>
                          {item.reorder_threshold} {item.unit}s
                        </span>
                      </td>
                      <td>
                        {isLow ? (
                          <span
                            className="badge badge-urgent"
                            style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <AlertTriangle size={11} />
                            Low Stock
                          </span>
                        ) : (
                          <span
                            className="badge badge-healthy"
                            style={{ fontSize: '11px' }}
                          >
                            Adequate
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #64748b)' }}>
                        {item.last_restocked_at
                          ? new Date(item.last_restocked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : 'Initial setup'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => handleRestock(item)}
                        >
                          <PlusCircle size={12} />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
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
          <div className="panel-card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 className="panel-title" style={{ marginBottom: '1rem' }}>Add Inventory Item</h3>
            <form onSubmit={handleCreateItem}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 3M Filtek Composite Resin (A2)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="input-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Consumables">Consumables</option>
                    <option value="Restorative">Restorative</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Prosthetics">Prosthetics</option>
                    <option value="Anesthesia">Anesthesia</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit Type</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="box, vial, pack"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Current Stock</label>
                  <input
                    type="number"
                    className="input-field"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Reorder Threshold</label>
                  <input
                    type="number"
                    className="input-field"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
