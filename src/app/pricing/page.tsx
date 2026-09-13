'use client';

import React, { useState, useEffect } from 'react';
import {
  BadgeDollarSign,
  Plus,
  Edit2,
  Check,
  X,
  Search,
  RefreshCw,
  Sparkles,
  Building2,
  Sliders,
  ShieldCheck,
  Download,
  FileText,
  CheckCircle2,
  TrendingUp,
  Users,
  Clock,
  Award,
  Landmark,
} from 'lucide-react';

interface PriceItem {
  id: string;
  code: string;
  procedure_name: string;
  category: string;
  default_cost: number | string;
  patient_friendly_en: string;
  patient_friendly_hi: string;
  patient_friendly_kn?: string;
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'procedures' | 'enterprise'>('procedures');

  // Procedure list state
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [editEn, setEditEn] = useState<string>('');
  const [editHi, setEditHi] = useState<string>('');
  const [editKn, setEditKn] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New procedure fields
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Restorative');
  const [newCost, setNewCost] = useState('1500');
  const [newEn, setNewEn] = useState('');
  const [newHi, setNewHi] = useState('');
  const [newKn, setNewKn] = useState('');

  // Enterprise Proposal & ROI Calculator State
  const [hospitalName, setHospitalName] = useState('Manipal Dental Super-Specialty Hospital');
  const [hospitalDirector, setHospitalDirector] = useState('Dr. R. K. Nambiar, MDS, FICD');
  const [chairCount, setChairCount] = useState<number>(10);
  const [licenseModel, setLicenseModel] = useState<'perpetual' | 'saas'>('perpetual');
  const [proposalGenerated, setProposalGenerated] = useState(false);

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
    setEditKn(item.patient_friendly_kn || '');
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
          patient_friendly_kn: editKn,
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id
              ? { ...it, default_cost: editFee, patient_friendly_en: editEn, patient_friendly_hi: editHi, patient_friendly_kn: editKn }
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
          default_cost: parseFloat(newCost) || 0,
          patient_friendly_en: newEn,
          patient_friendly_hi: newHi,
          patient_friendly_kn: newKn,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewCode('');
        setNewName('');
        setNewEn('');
        setNewHi('');
        setNewKn('');
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
      i.patient_friendly_hi.includes(search) ||
      (i.patient_friendly_kn && i.patient_friendly_kn.includes(search))
  );

  // Enterprise Calculations
  const capexPerChair = 45000;
  const amcPerChairYear = 9000;
  const totalCapex = chairCount * capexPerChair;
  const totalAmc = chairCount * amcPerChairYear;
  const fiveYearPerpetualTco = totalCapex + 4 * totalAmc;

  const saasPerChairMonth = 2400;
  const totalSaasAnnual = chairCount * saasPerChairMonth * 12;
  const fiveYearSaasTco = totalSaasAnnual * 5;

  const monthlyChairRevBase = chairCount * 280000;
  const monthlyTurnaroundUplift = chairCount * 38500;
  const monthlyEmiConversionUplift = chairCount * 65000;
  const totalMonthlyUplift = monthlyTurnaroundUplift + monthlyEmiConversionUplift;
  const paybackMonths = licenseModel === 'perpetual' ? (totalCapex / totalMonthlyUplift).toFixed(1) : '0.3';

  const handleGenerateProposal = () => {
    setProposalGenerated(true);
  };

  const handleDownloadProposalCsv = () => {
    const headers = [
      'Enterprise Commercial Proposal',
      'Hospital Name',
      'Medical Director / Dean',
      'Operatory Dental Chairs',
      'Commercial License Model',
      'One-Time Capex (INR)',
      'Annual Maintenance Contract AMC (INR)',
      '5-Year Total Cost of Ownership TCO (INR)',
      'Projected Monthly RevPACH Turnaround Uplift (INR)',
      'Projected Monthly 0% EMI Conversion Uplift (INR)',
      'Net Monthly Revenue Uplift (INR)',
      'Estimated Software Payback Period (Months)',
      'Statutory Accreditation Compliance',
    ];

    const row = [
      '"DentOS 3D Enterprise Hospital Proposal"',
      `"${hospitalName}"`,
      `"${hospitalDirector}"`,
      chairCount,
      licenseModel === 'perpetual' ? '"Perpetual Lifetime License + 20% AMC"' : '"5-Year Enterprise Multi-Chair SaaS"',
      licenseModel === 'perpetual' ? totalCapex : 0,
      licenseModel === 'perpetual' ? totalAmc : totalSaasAnnual,
      licenseModel === 'perpetual' ? fiveYearPerpetualTco : fiveYearSaasTco,
      monthlyTurnaroundUplift,
      monthlyEmiConversionUplift,
      totalMonthlyUplift,
      paybackMonths,
      '"NABH 5th Edition + Section 65B Indian Evidence Act + CDSCO Schedule H1"',
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DentOS_Commercial_Proposal_${hospitalName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Page Header */}
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Clinical Fee Schedule & Hospital Commercial Architecture
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Configure clinical treatment fee catalogs, or model enterprise multi-chair lifetime license economics with Indian hospital ROI analytics.
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
            id="pricing-tab-procedures"
            type="button"
            onClick={() => setActiveTab('procedures')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'procedures' ? 700 : 500,
              background: activeTab === 'procedures' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
              color: activeTab === 'procedures' ? '#ffffff' : '#475569',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <BadgeDollarSign size={14} />
            <span>Clinical Fee Catalog</span>
          </button>

          <button
            id="pricing-tab-enterprise"
            type="button"
            onClick={() => setActiveTab('enterprise')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'enterprise' ? 700 : 500,
              background: activeTab === 'enterprise' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
              color: activeTab === 'enterprise' ? '#ffffff' : '#475569',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={14} />
            <span>Enterprise Hospital ROI & Proposal</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROCEDURES CATALOG */}
      {activeTab === 'procedures' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', maxWidth: '420px', width: '100%' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Search procedure name, category, or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} />
              <span>Add Custom Procedure</span>
            </button>
          </div>

          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading fee schedule...</div>
            ) : (
              <div className="table-responsive">
                <table className="clinical-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Code</th>
                      <th>Clinical Procedure</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right', width: '140px' }}>Standard Fee (₹)</th>
                      <th>Patient Explanation (English)</th>
                      <th>Patient Explanation (Hindi)</th>
                      <th>Patient Explanation (Kannada / ಕನ್ನಡ)</th>
                      <th style={{ textAlign: 'center', width: '110px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const isEditing = editingItem?.id === item.id;
                      return (
                        <tr key={item.id} style={{ background: isEditing ? '#f8fafc' : undefined }}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#475569' }}>
                              {item.code}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.procedure_name}</div>
                          </td>
                          <td>
                            <span className="badge badge-pending" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                              {item.category}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                step="50"
                                className="input-field"
                                value={editFee}
                                onChange={(e) => setEditFee(parseFloat(e.target.value) || 0)}
                                style={{ width: '100px', textAlign: 'right', padding: '4px 6px', fontWeight: 700 }}
                              />
                            ) : (
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                                ₹{Number(item.default_cost).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="input-field"
                                value={editEn}
                                onChange={(e) => setEditEn(e.target.value)}
                                style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                              />
                            ) : (
                              <span style={{ fontSize: '12px', color: '#475569' }}>
                                {item.patient_friendly_en || '—'}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="input-field"
                                value={editHi}
                                onChange={(e) => setEditHi(e.target.value)}
                                style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                              />
                            ) : (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {item.patient_friendly_hi || '—'}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="input-field"
                                value={editKn}
                                onChange={(e) => setEditKn(e.target.value)}
                                style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                              />
                            ) : (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {item.patient_friendly_kn || '—'}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '4px 8px' }}
                                  onClick={handleSaveEdit}
                                  disabled={isSaving}
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px' }}
                                  onClick={() => setEditingItem(null)}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => startEdit(item)}
                              >
                                <Edit2 size={12} />
                                <span>Edit</span>
                              </button>
                            )}
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

      {/* TAB 2: ENTERPRISE HOSPITAL COMMERCIAL ROI & PROPOSAL */}
      {activeTab === 'enterprise' && (
        <div>
          {/* Top Banner */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #090d16, #1e293b)',
              color: '#ffffff',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ENTERPRISE HOSPITAL COMMERCIAL SUITE
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Perpetual On-Premise vs 5-Year Cloud SaaS Calculator
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Multi-Chair Hospital Lifetime License & Economic ROI Modeling
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0', maxWidth: '720px' }}>
                Formally tailored for Indian Dental Hospitals & Chains (Manipal, Apollo White, Clove, Vasan). Demonstrating instant capex payback within 1.5 months via RevPACH idle time savings and 0% EMI conversions.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                id="generate-hospital-proposal-btn"
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateProposal}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  borderColor: '#0284c7',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={16} />
                <span>Generate Executive Proposal</span>
              </button>
            </div>
          </div>

          {/* Interactive Parameters Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Left: Configuration Inputs */}
            <div className="panel-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#0284c7" />
                <span>Hospital Scale & Commercial Parameters</span>
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Hospital / Dental Chain Institution Name</label>
                <input
                  id="hospital-name-input"
                  type="text"
                  className="input-field"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. Manipal Super-Specialty Dental Hospital"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Dean / Medical Director / CFO</label>
                <input
                  id="hospital-director-input"
                  type="text"
                  className="input-field"
                  value={hospitalDirector}
                  onChange={(e) => setHospitalDirector(e.target.value)}
                  placeholder="e.g. Dr. R. K. Nambiar, MDS, FICD"
                />
              </div>

              {/* Chair Slider */}
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    Operatory Dental Chairs Count:
                  </label>
                  <span
                    id="chair-count-display"
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  >
                    {chairCount} Operatory Chairs
                  </span>
                </div>
                <input
                  id="hospital-chair-slider"
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={chairCount}
                  onChange={(e) => setChairCount(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  <span>2 Chairs (Boutique Multi-Op)</span>
                  <span>10 Chairs (Super-Specialty)</span>
                  <span>50 Chairs (Dental College / Chain)</span>
                </div>
              </div>

              {/* License Model Selector */}
              <div>
                <label className="form-label">Commercial Acquisition Model</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    id="license-model-perpetual"
                    onClick={() => setLicenseModel('perpetual')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `2px solid ${licenseModel === 'perpetual' ? '#0284c7' : '#e2e8f0'}`,
                      background: licenseModel === 'perpetual' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                        Perpetual Lifetime + AMC
                      </span>
                      {licenseModel === 'perpetual' && <CheckCircle2 size={16} color="#0284c7" />}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700, marginTop: '4px' }}>
                      ₹45,000 / Chair One-time
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      + 20% Annual AMC (₹9,000 / yr). On-Premise NAS + Local PACS sovereignty.
                    </div>
                  </div>

                  <div
                    id="license-model-saas"
                    onClick={() => setLicenseModel('saas')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `2px solid ${licenseModel === 'saas' ? '#0284c7' : '#e2e8f0'}`,
                      background: licenseModel === 'saas' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                        5-Year Enterprise SaaS
                      </span>
                      {licenseModel === 'saas' && <CheckCircle2 size={16} color="#0284c7" />}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700, marginTop: '4px' }}>
                      ₹2,400 / Chair / Month
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Billed annually (₹28,800 / yr). Zero initial Capex, all cloud hosting included.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Hospital Economics & ROI Dashboard */}
            <div className="panel-card" style={{ padding: '1.5rem', background: '#ffffff' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#16a34a" />
                <span>Hospital Economic Impact & Payback Modeling</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {licenseModel === 'perpetual' ? 'ONE-TIME CAPEX' : 'ANNUAL SAAS BILLING'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    ₹{licenseModel === 'perpetual' ? totalCapex.toLocaleString('en-IN') : totalSaasAnnual.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
                    {licenseModel === 'perpetual' ? `+ ₹${totalAmc.toLocaleString('en-IN')}/yr AMC` : `₹${(totalSaasAnnual / 12).toLocaleString('en-IN')}/mo`}
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                    NET MONTHLY REVENUE UPLIFT
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                    +₹{totalMonthlyUplift.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px', fontWeight: 600 }}>
                    Per month across {chairCount} chairs
                  </div>
                </div>
              </div>

              {/* Uplift Breakdown */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Quantified Clinical & Financial Value Drivers:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#475569' }}>
                      ⏱️ <strong>RevPACH Chair Turnover:</strong> +1.2 patient slots/chair/day
                    </span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                      +₹{monthlyTurnaroundUplift.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#475569' }}>
                      💳 <strong>0% EMI & 3D Smile Conversions:</strong> +28% case acceptance
                    </span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                      +₹{monthlyEmiConversionUplift.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#475569' }}>
                      🛡️ <strong>Statutory Risk Protection:</strong> NABH 5th Ed + CDSCO Schedule H1
                    </span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>
                      100% Audit Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Payback badge */}
              <div
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                  border: '1px solid #6ee7b7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Award size={20} color="#059669" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#065f46' }}>
                    ⚡ Full Software Investment Recovered in {paybackMonths} Months!
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857' }}>
                    Over 5 years, this hospital is projected to generate ₹{(totalMonthlyUplift * 60).toLocaleString('en-IN')} in incremental gross revenues.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Formal Proposal Panel */}
          {proposalGenerated && (
            <div
              id="enterprise-proposal-document"
              className="panel-card"
              style={{
                padding: '2rem',
                border: '2px solid #0284c7',
                borderRadius: '12px',
                background: '#ffffff',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.1)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', letterSpacing: '0.08em' }}>
                    COMMERCIAL QUOTATION & EXECUTIVE MEMORANDUM
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                    DentOS 3D Hospital Operating System
                  </h2>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Prepared for: <strong>{hospitalName}</strong> • Attn: <strong>{hospitalDirector}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Proposal Ref: DENTOS-HOSP-2026-Q3-0913 • Valid for 45 Days
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    id="download-proposal-csv-btn"
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleDownloadProposalCsv}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                  >
                    <Download size={14} />
                    <span>Download Commercial CSV</span>
                  </button>
                </div>
              </div>

              {/* Proposal Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <table className="clinical-table" style={{ border: '1px solid #e2e8f0' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th>Deliverable Component</th>
                      <th>Scope & Enterprise Specification</th>
                      <th style={{ textAlign: 'right' }}>Commercial Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {licenseModel === 'perpetual' ? 'Perpetual Operating License' : '5-Year SaaS Subscription'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {chairCount} Operatory Dental Chairs
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>
                          Full DentOS Suite: 3D interactive dentition, voice charting, operatory turnaround stopwatch, Section 65B legal audit vault, and bilingual patient presentation.
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                        ₹{licenseModel === 'perpetual' ? totalCapex.toLocaleString('en-IN') : totalSaasAnnual.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>Hospital Infrastructure & Security</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Data Sovereignty Guarantee</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>
                          On-Premise NAS sync agent, PACS DICOM server gateway, automated encrypted nightly off-site snapshots, and ISO 27001 data compliance.
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '13px' }}>
                        Included in License
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>NABH 5th Ed & CDSCO Automation</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Statutory Regulatory Pack</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>
                          Class B Autoclave cycle records with spore test validation, implant lot expiry vault, and Schedule H1 statutory register generator.
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '13px' }}>
                        Included in License
                      </td>
                    </tr>
                    {licenseModel === 'perpetual' && (
                      <tr style={{ background: '#f0f9ff' }}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0369a1' }}>Annual Maintenance Contract (AMC)</div>
                          <div style={{ fontSize: '11px', color: '#0284c7' }}>Commencing Year 2 (20% of Capex)</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#0369a1' }}>
                            Guaranteed statutory tax/DCI regulatory updates, unlimited engineer remote diagnostics, and free version upgrades.
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#0369a1' }}>
                          ₹{totalAmc.toLocaleString('en-IN')} / Year
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Implementation Terms & SLA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '12px', color: '#475569' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#0284c7" />
                    <span>Hospital SLAs & Guarantees</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                    <li><strong>99.95% System Uptime SLA:</strong> 24/7 mission-critical operatory reliability.</li>
                    <li><strong>1-Hour Critical Incident Response:</strong> Dedicated L3 healthcare engineering team.</li>
                    <li><strong>Section 65B Admissibility:</strong> Court-certified hash signatures for legal defense.</li>
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Landmark size={16} color="#0284c7" />
                    <span>Milestone Payment Schedule</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                    <li><strong>50% Advance:</strong> On server provisioning & PACS gateway deployment.</li>
                    <li><strong>30% Milestone 2:</strong> On completion of clinical user acceptance sign-off.</li>
                    <li><strong>20% Final Settlement:</strong> Post doctor and nursing staff hands-on certification.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
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
            <h3 className="panel-title" style={{ marginBottom: '1rem' }}>Add Procedural Fee Item</h3>
            <form onSubmit={handleAddProcedure}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Procedure Code *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. D4210"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Clinical Procedure Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Gingivectomy Laser Contouring"
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

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Patient Explanation (Hindi)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. मसूड़ों की लेजर द्वारा सौंदर्य सुधार प्रक्रिया"
                  value={newHi}
                  onChange={(e) => setNewHi(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Patient Explanation (Kannada / ಕನ್ನಡ)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. ವಸಡಿನ ಲೇಸರ್ ಸೌಂದರ್ಯ ಚಿಕಿತ್ಸೆ"
                  value={newKn}
                  onChange={(e) => setNewKn(e.target.value)}
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
