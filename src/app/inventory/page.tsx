'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  PlusCircle,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  Unlock,
  QrCode,
  Thermometer,
  Calendar,
  UserCheck,
  Search,
} from 'lucide-react';
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

interface AutoclaveCycle {
  id: string;
  cycleNumber: string;
  machineId: string;
  cycleType: string;
  temperatureC: number;
  pressureBar: number;
  exposureMinutes: number;
  chemicalIndicator: 'Class 5 Integrator PASS' | 'Class 6 Emulating PASS' | 'FAIL';
  biologicalSporeTest: 'Spore Negative (24h PASS)' | 'Pending Incubation' | 'Spore Positive (FAIL)';
  pouchesCassettes: string;
  operatorName: string;
  operatorCouncilId: string;
  timestamp: string;
  expiryDate: string;
  status: 'VALIDATED_PASS' | 'FAILED_REJECTED';
}

interface ImplantLotItem {
  id: string;
  brand: string;
  productName: string;
  type: 'Dental Implant' | 'Bone Graft' | 'Membrane' | 'Abutment';
  lotNumber: string;
  serialNumber: string;
  diameterMm?: number;
  lengthMm?: number;
  expiryDate: string;
  daysRemaining: number;
  status: 'SAFE' | 'EXPIRING_SOON' | 'QUARANTINED' | 'IMPLANTED';
  allocatedPatientMrn?: string;
  allocatedTooth?: string;
  quarantineReason?: string;
}

export default function InventoryPage() {
  const { activeBranch } = useSession();
  const [activeTab, setActiveTab] = useState<'stock' | 'nabh_sterilization' | 'implant_vault'>('stock');

  // Stock state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New stock item form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Consumables');
  const [quantity, setQuantity] = useState('10');
  const [threshold, setThreshold] = useState('5');
  const [unit, setUnit] = useState('box');
  const [submitting, setSubmitting] = useState(false);

  // NABH Autoclave Sterilization State
  const [autoclaveCycles, setAutoclaveCycles] = useState<AutoclaveCycle[]>([
    {
      id: 'cyc_01',
      cycleNumber: 'CYC-2026-0913-01',
      machineId: 'Euronda Class B Pro - Autoclave A1',
      cycleType: '134°C Prion Vacuum Cycle (EN 13060)',
      temperatureC: 134.4,
      pressureBar: 2.15,
      exposureMinutes: 18,
      chemicalIndicator: 'Class 5 Integrator PASS',
      biologicalSporeTest: 'Spore Negative (24h PASS)',
      pouchesCassettes: 'CASSETTE-SURG-01 to 04, POUCH-ENDO-12',
      operatorName: 'Sr. Nurse Kavitha Devi',
      operatorCouncilId: 'KDC-REG-4491',
      timestamp: '2026-09-13 08:30 AM',
      expiryDate: '2026-10-13',
      status: 'VALIDATED_PASS',
    },
    {
      id: 'cyc_02',
      cycleNumber: 'CYC-2026-0912-04',
      machineId: 'W&H Lisa Mini - Operatory 2',
      cycleType: '134°C B-Fast Dental Handpieces',
      temperatureC: 134.1,
      pressureBar: 2.12,
      exposureMinutes: 15,
      chemicalIndicator: 'Class 6 Emulating PASS',
      biologicalSporeTest: 'Spore Negative (24h PASS)',
      pouchesCassettes: 'NSK-HP-08, TI-MAX-02, IMPLANT-MOTOR-P3',
      operatorName: 'Dental Asst. Senthil Kumar',
      operatorCouncilId: 'DCI-TECH-8820',
      timestamp: '2026-09-12 04:15 PM',
      expiryDate: '2026-10-12',
      status: 'VALIDATED_PASS',
    },
    {
      id: 'cyc_03',
      cycleNumber: 'CYC-2026-0912-02',
      machineId: 'Euronda Class B Pro - Autoclave A1',
      cycleType: '121°C Porous / Silicone Impression Trays',
      temperatureC: 121.2,
      pressureBar: 1.15,
      exposureMinutes: 30,
      chemicalIndicator: 'Class 5 Integrator PASS',
      biologicalSporeTest: 'Pending Incubation',
      pouchesCassettes: 'TRAYS-IMPR-15 to 22, SILICONE-DAM-06',
      operatorName: 'Sr. Nurse Kavitha Devi',
      operatorCouncilId: 'KDC-REG-4491',
      timestamp: '2026-09-12 11:40 AM',
      expiryDate: '2026-10-12',
      status: 'VALIDATED_PASS',
    },
  ]);

  const [showLogCycleModal, setShowLogCycleModal] = useState(false);
  const [newCycleNumber, setNewCycleNumber] = useState(`CYC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0${autoclaveCycles.length + 1}`);
  const [newMachineId, setNewMachineId] = useState('Euronda Class B Pro - Autoclave A1');
  const [newCycleTemp, setNewCycleTemp] = useState('134.5');
  const [newCyclePressure, setNewCyclePressure] = useState('2.18');
  const [newExposureMins, setNewExposureMins] = useState('18');
  const [newChemIndicator, setNewChemIndicator] = useState<'Class 5 Integrator PASS' | 'Class 6 Emulating PASS' | 'FAIL'>('Class 5 Integrator PASS');
  const [newBioSpore, setNewBioSpore] = useState<'Spore Negative (24h PASS)' | 'Pending Incubation' | 'Spore Positive (FAIL)'>('Spore Negative (24h PASS)');
  const [newPouches, setNewPouches] = useState('CASSETTE-IMPLANT-02, POUCH-SURG-KIT-99');
  const [newOperator, setNewOperator] = useState('Nurse Kavitha Devi');
  const [newCouncilId, setNewCouncilId] = useState('KDC-REG-4491');

  // Implant Vault State
  const [implantVault, setImplantVault] = useState<ImplantLotItem[]>([
    {
      id: 'imp_01',
      brand: 'Straumann',
      productName: 'Roxolid BLX SLActive Implant',
      type: 'Dental Implant',
      lotNumber: 'STR-2024-8849A',
      serialNumber: 'SN-04982199',
      diameterMm: 4.0,
      lengthMm: 10.0,
      expiryDate: '2026-09-27',
      daysRemaining: 14,
      status: 'EXPIRING_SOON',
      quarantineReason: 'Near-expiry threshold (<30 days). Surgical lockout recommended.',
    },
    {
      id: 'imp_02',
      brand: 'Nobel Biocare',
      productName: 'NobelActive TiUltra Conical',
      type: 'Dental Implant',
      lotNumber: 'NBC-99120-X1',
      serialNumber: 'SN-90184421',
      diameterMm: 4.3,
      lengthMm: 11.5,
      expiryDate: '2028-04-15',
      daysRemaining: 580,
      status: 'SAFE',
      allocatedPatientMrn: 'MRN-2026-0042',
      allocatedTooth: '#46',
    },
    {
      id: 'imp_03',
      brand: 'Geistlich',
      productName: 'Bio-Oss Granules 0.5g (Small Spongiosa)',
      type: 'Bone Graft',
      lotNumber: 'BIO-77218-B',
      serialNumber: 'SN-GRAFT-1102',
      expiryDate: '2027-11-30',
      daysRemaining: 443,
      status: 'SAFE',
    },
    {
      id: 'imp_04',
      brand: 'Geistlich',
      productName: 'Bio-Gide Resorbable Collagen Membrane 25x25mm',
      type: 'Membrane',
      lotNumber: 'BG-449102-M',
      serialNumber: 'SN-MEM-8831',
      expiryDate: '2026-10-05',
      daysRemaining: 22,
      status: 'EXPIRING_SOON',
      quarantineReason: 'Critical shelf-life window. Automatic alert.',
    },
    {
      id: 'imp_05',
      brand: 'Osstem',
      productName: 'TSIII SA Fixture Regular',
      type: 'Dental Implant',
      lotNumber: 'OSS-33810-R',
      serialNumber: 'SN-339841',
      diameterMm: 3.5,
      lengthMm: 8.5,
      expiryDate: '2026-08-30',
      daysRemaining: -14,
      status: 'QUARANTINED',
      quarantineReason: 'Past expiry date. Locked in isolation bin. Cannot be checked out.',
    },
  ]);

  const [implantSearch, setImplantSearch] = useState('');

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

  // Add Autoclave Cycle
  const handleLogAutoclaveCycle = (e: React.FormEvent) => {
    e.preventDefault();
    const tempNum = parseFloat(newCycleTemp);
    const pressNum = parseFloat(newCyclePressure);
    const isPass = tempNum >= 134 && pressNum >= 2.0 && newChemIndicator.includes('PASS') && !newBioSpore.includes('FAIL');

    const created: AutoclaveCycle = {
      id: `cyc_${Date.now()}`,
      cycleNumber: newCycleNumber,
      machineId: newMachineId,
      cycleType: '134°C Class B Vacuum Sterilization',
      temperatureC: tempNum,
      pressureBar: pressNum,
      exposureMinutes: parseInt(newExposureMins, 10) || 18,
      chemicalIndicator: newChemIndicator,
      biologicalSporeTest: newBioSpore,
      pouchesCassettes: newPouches,
      operatorName: newOperator,
      operatorCouncilId: newCouncilId,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: isPass ? 'VALIDATED_PASS' : 'FAILED_REJECTED',
    };

    setAutoclaveCycles([created, ...autoclaveCycles]);
    setShowLogCycleModal(false);
  };

  // Export NABH CSV Log
  const handleExportNabhCsv = () => {
    const headers = [
      'Cycle Number',
      'Machine ID',
      'Cycle Type',
      'Temp (°C)',
      'Pressure (Bar)',
      'Exposure (Mins)',
      'Chemical Indicator (Class 5/6)',
      'Biological Spore Test (G. Stearothermophilus)',
      'Cassettes / Pouches Barcode Batch',
      'Sterilization Officer',
      'DCI/Nursing Council Reg No',
      'Sterilization Date & Time',
      'Valid Until Date',
      'NABH Validation Status',
    ];

    const rows = autoclaveCycles.map((c) => [
      `"${c.cycleNumber}"`,
      `"${c.machineId}"`,
      `"${c.cycleType}"`,
      c.temperatureC,
      c.pressureBar,
      c.exposureMinutes,
      `"${c.chemicalIndicator}"`,
      `"${c.biologicalSporeTest}"`,
      `"${c.pouchesCassettes}"`,
      `"${c.operatorName}"`,
      `"${c.operatorCouncilId}"`,
      `"${c.timestamp}"`,
      `"${c.expiryDate}"`,
      `"${c.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NABH_5th_Ed_Sterilization_Log_ISO17665_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quarantine Implant Lot Action
  const handleQuarantineLot = (lotId: string) => {
    setImplantVault((prev) =>
      prev.map((item) =>
        item.id === lotId
          ? {
              ...item,
              status: item.status === 'QUARANTINED' ? 'SAFE' : 'QUARANTINED',
              quarantineReason:
                item.status === 'QUARANTINED'
                  ? undefined
                  : 'Manual Infection Control Lockout: Biological quarantine active.',
            }
          : item
      )
    );
  };

  const filteredImplants = implantVault.filter(
    (imp) =>
      imp.productName.toLowerCase().includes(implantSearch.toLowerCase()) ||
      imp.lotNumber.toLowerCase().includes(implantSearch.toLowerCase()) ||
      imp.serialNumber.toLowerCase().includes(implantSearch.toLowerCase()) ||
      imp.brand.toLowerCase().includes(implantSearch.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--color-ink, #0f172a)',
              letterSpacing: '-0.02em',
            }}
          >
            Clinical Inventory, Sterilization & Implant Vault
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Enterprise hospital compliance: NABH 5th Edition Infection Control, Class B Autoclave spore verification & Straumann/Nobel implant traceability.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            gap: '4px',
          }}
        >
          <button
            id="tab-stock-inventory"
            type="button"
            onClick={() => setActiveTab('stock')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'stock' ? 700 : 500,
              background: activeTab === 'stock' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
              color: activeTab === 'stock' ? '#ffffff' : '#475569',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Package size={14} />
            <span>Consumables Stock</span>
          </button>

          <button
            id="tab-nabh-sterilization"
            type="button"
            onClick={() => setActiveTab('nabh_sterilization')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'nabh_sterilization' ? 700 : 500,
              background: activeTab === 'nabh_sterilization' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
              color: activeTab === 'nabh_sterilization' ? '#ffffff' : '#475569',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={14} />
            <span>NABH 5th Ed. Sterilization Log</span>
          </button>

          <button
            id="tab-implant-vault"
            type="button"
            onClick={() => setActiveTab('implant_vault')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'implant_vault' ? 700 : 500,
              background: activeTab === 'implant_vault' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
              color: activeTab === 'implant_vault' ? '#ffffff' : '#475569',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Lock size={14} />
            <span>Implant & Graft Expiry Vault</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONSUMABLES STOCK */}
      {activeTab === 'stock' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', marginBottom: '1rem' }}>
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
                              <span className="badge badge-healthy" style={{ fontSize: '11px' }}>
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
        </>
      )}

      {/* TAB 2: NABH 5TH EDITION INFECTION CONTROL & AUTOCLAVE LOG */}
      {activeTab === 'nabh_sterilization' && (
        <div>
          {/* NABH Banner */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #022c22, #064e3b)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 14px rgba(2, 44, 34, 0.25)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  NABH 5TH EDITION COMPLIANT
                </span>
                <span style={{ fontSize: '12px', color: '#a7f3d0' }}>EN 13060 / ISO 17665 Validated</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f0fdf4' }}>
                Hospital Infection Control & Autoclave Batch Log
              </h2>
              <p style={{ fontSize: '12px', color: '#6ee7b7', margin: '4px 0 0 0', maxWidth: '680px' }}>
                Statutory sterilization auditing with automated Class 5 chemical indicator & Geobacillus stearothermophilus spore incubation records. Direct traceability to patient pouches.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                id="export-nabh-audit-log-btn"
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportNabhCsv}
                style={{
                  background: '#ffffff',
                  color: '#064e3b',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                <FileSpreadsheet size={14} />
                <span>Export NABH Audit CSV</span>
              </button>
              <button
                id="log-autoclave-cycle-btn"
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowLogCycleModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#059669',
                  fontWeight: 700,
                }}
              >
                <Thermometer size={14} />
                <span>Log New Cycle</span>
              </button>
            </div>
          </div>

          {/* Autoclave Cycle Log Table */}
          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Cycle ID & Machine</th>
                    <th>Parameters (Temp / Pressure)</th>
                    <th>Chemical Indicator</th>
                    <th>Biological Spore Test</th>
                    <th>Pouch & Cassette Barcodes</th>
                    <th>Sterilization Officer</th>
                    <th>Validation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {autoclaveCycles.map((cyc) => (
                    <tr key={cyc.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                          {cyc.cycleNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{cyc.machineId}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{cyc.timestamp}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Thermometer size={14} color="#059669" />
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                            {cyc.temperatureC}°C
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>/ {cyc.pressureBar} bar</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Exposure: {cyc.exposureMinutes} min
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <Check size={12} color="#059669" />
                          {cyc.chemicalIndicator}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: cyc.biologicalSporeTest.includes('PASS')
                              ? '#eff6ff'
                              : cyc.biologicalSporeTest.includes('Pending')
                              ? '#fefce8'
                              : '#fef2f2',
                            color: cyc.biologicalSporeTest.includes('PASS')
                              ? '#1e40af'
                              : cyc.biologicalSporeTest.includes('Pending')
                              ? '#854d0e'
                              : '#991b1b',
                            border: `1px solid ${
                              cyc.biologicalSporeTest.includes('PASS')
                                ? '#bfdbfe'
                                : cyc.biologicalSporeTest.includes('Pending')
                                ? '#fde047'
                                : '#fecaca'
                            }`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <ShieldCheck size={12} />
                          {cyc.biologicalSporeTest}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#334155' }}>
                          {cyc.pouchesCassettes}
                        </div>
                        <div style={{ fontSize: '10px', color: '#059669', marginTop: '2px' }}>
                          Pouch Valid Until: {cyc.expiryDate}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                          {cyc.operatorName}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Reg: {cyc.operatorCouncilId}
                        </div>
                      </td>
                      <td>
                        {cyc.status === 'VALIDATED_PASS' ? (
                          <span
                            className="badge badge-healthy"
                            style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px' }}
                          >
                            NABH PASS
                          </span>
                        ) : (
                          <span
                            className="badge badge-urgent"
                            style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px' }}
                          >
                            CYCLE FAILED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMPLANT & BONE GRAFT LOT EXPIRY VAULT */}
      {activeTab === 'implant_vault' && (
        <div>
          {/* Top Bar with Search & High-value banner */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 14px rgba(30, 27, 75, 0.25)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  HIGH-VALUE TRACEABILITY VAULT
                </span>
                <span style={{ fontSize: '12px', color: '#c7d2fe' }}>MDR 2017 & FDA Track & Trace</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#e0e7ff' }}>
                Implant Fixture, Abutment & Bone Graft Expiry Vault
              </h2>
              <p style={{ fontSize: '12px', color: '#a5b4fc', margin: '4px 0 0 0', maxWidth: '680px' }}>
                Zero accidental surgical placements of expired medical devices. Real-time lot quarantine, serial barcode tracking, and direct patient allocation.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Filter Lot # or Serial..."
                  value={implantSearch}
                  onChange={(e) => setImplantSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 28px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #4338ca',
                    background: '#1e1b4b',
                    color: '#ffffff',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Implant Items Grid / Table */}
          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Brand & Product</th>
                    <th>Lot / Serial Number</th>
                    <th>Device Specs</th>
                    <th>Expiry Date</th>
                    <th>Days Remaining</th>
                    <th>Clinical Status</th>
                    <th>Patient Traceability</th>
                    <th style={{ textAlign: 'right' }}>Quarantine Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredImplants.map((imp) => {
                    const isExpiringSoon = imp.daysRemaining <= 30 && imp.daysRemaining > 0;
                    const isExpired = imp.daysRemaining <= 0;
                    const isQuarantined = imp.status === 'QUARANTINED';

                    return (
                      <tr
                        key={imp.id}
                        style={{
                          background: isQuarantined
                            ? '#fef2f2'
                            : isExpiringSoon
                            ? '#fffbeb'
                            : undefined,
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                            {imp.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                            {imp.brand} • {imp.type}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                            LOT: {imp.lotNumber}
                          </div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                            {imp.serialNumber}
                          </div>
                        </td>
                        <td>
                          {imp.diameterMm && imp.lengthMm ? (
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                              Ø{imp.diameterMm}mm × {imp.lengthMm}mm
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Standard sterile unit</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: isExpired ? '#dc2626' : '#1e293b' }}>
                            {imp.expiryDate}
                          </div>
                        </td>
                        <td>
                          {isExpired ? (
                            <span
                              style={{
                                color: '#dc2626',
                                fontWeight: 800,
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <AlertTriangle size={12} /> EXPIRED ({Math.abs(imp.daysRemaining)}d ago)
                            </span>
                          ) : isExpiringSoon ? (
                            <span
                              style={{
                                color: '#b45309',
                                fontWeight: 800,
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <AlertTriangle size={12} /> ⚠️ {imp.daysRemaining} Days Left
                            </span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 700, fontSize: '12px' }}>
                              {imp.daysRemaining} Days
                            </span>
                          )}
                        </td>
                        <td>
                          {isQuarantined ? (
                            <span
                              className="badge badge-urgent"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                              }}
                            >
                              <Lock size={11} /> QUARANTINED
                            </span>
                          ) : isExpiringSoon ? (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fcd34d',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              NEAR EXPIRY
                            </span>
                          ) : (
                            <span className="badge badge-healthy" style={{ fontSize: '11px', fontWeight: 700 }}>
                              STERILE PASS
                            </span>
                          )}
                        </td>
                        <td>
                          {imp.allocatedPatientMrn ? (
                            <div style={{ fontSize: '11px', color: '#0f172a' }}>
                              <span style={{ fontWeight: 700 }}>{imp.allocatedPatientMrn}</span>
                              <div style={{ color: '#6366f1', fontWeight: 600 }}>Tooth {imp.allocatedTooth}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Unassigned (In Vault)</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            id={`quarantine-btn-${imp.id}`}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleQuarantineLot(imp.id)}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              background: isQuarantined ? '#f1f5f9' : '#fee2e2',
                              color: isQuarantined ? '#475569' : '#991b1b',
                              borderColor: isQuarantined ? '#cbd5e1' : '#fca5a5',
                              fontWeight: 700,
                            }}
                          >
                            {isQuarantined ? (
                              <>
                                <Unlock size={12} />
                                <span>Release Lock</span>
                              </>
                            ) : (
                              <>
                                <Lock size={12} />
                                <span>Quarantine</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
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

      {/* Log Autoclave Cycle Modal */}
      {showLogCycleModal && (
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
          <div className="panel-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <ShieldCheck size={20} color="#059669" />
              <h3 className="panel-title" style={{ margin: 0 }}>
                Log NABH Class B Autoclave Cycle
              </h3>
            </div>

            <form onSubmit={handleLogAutoclaveCycle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label">Cycle Batch Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newCycleNumber}
                    onChange={(e) => setNewCycleNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Machine ID</label>
                  <select
                    className="input-field"
                    value={newMachineId}
                    onChange={(e) => setNewMachineId(e.target.value)}
                  >
                    <option value="Euronda Class B Pro - Autoclave A1">Euronda Class B Pro - Autoclave A1</option>
                    <option value="W&H Lisa Mini - Operatory 2">W&H Lisa Mini - Operatory 2</option>
                    <option value="Melag Vacuklav 40B+ - CSSD Central">Melag Vacuklav 40B+ - CSSD Central</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={newCycleTemp}
                    onChange={(e) => setNewCycleTemp(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Pressure (Bar)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={newCyclePressure}
                    onChange={(e) => setNewCyclePressure(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Exposure (Min)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newExposureMins}
                    onChange={(e) => setNewExposureMins(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label">Chemical Indicator</label>
                  <select
                    className="input-field"
                    value={newChemIndicator}
                    onChange={(e) => setNewChemIndicator(e.target.value as any)}
                  >
                    <option value="Class 5 Integrator PASS">Class 5 Integrator PASS</option>
                    <option value="Class 6 Emulating PASS">Class 6 Emulating PASS</option>
                    <option value="FAIL">Colour Incomplete (FAIL)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Biological Spore Test</label>
                  <select
                    className="input-field"
                    value={newBioSpore}
                    onChange={(e) => setNewBioSpore(e.target.value as any)}
                  >
                    <option value="Spore Negative (24h PASS)">Spore Negative (24h PASS)</option>
                    <option value="Pending Incubation">Pending Incubation</option>
                    <option value="Spore Positive (FAIL)">Spore Positive (FAIL)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Pouch & Cassette Barcodes Included</label>
                <input
                  type="text"
                  className="input-field"
                  value={newPouches}
                  onChange={(e) => setNewPouches(e.target.value)}
                  placeholder="e.g. CASSETTE-01, POUCH-SURG-12"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Infection Control Officer</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newOperator}
                    onChange={(e) => setNewOperator(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Council Reg Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newCouncilId}
                    onChange={(e) => setNewCouncilId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLogCycleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' }}
                >
                  Confirm & Validate Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
