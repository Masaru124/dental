'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  AlertCircle,
  FileCheck,
  TrendingUp,
  ArrowRight,
  Plus,
  Stethoscope,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

import { useSession } from '@/components/AppShell';

export default function DashboardPage() {
  const { user, activeBranch, branches } = useSession();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<string>('connected');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPatients = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/patients?branch_id=${activeBranch}` : '/api/patients';
      const res = await fetch(url);
      const data = await res.json();
      if (data.patients) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error('Failed to load dashboard patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [activeBranch]);

  const branchDisplayName = activeBranch
    ? (branches.find(b => b.id === activeBranch)?.name || activeBranch)
    : 'All Practice Branches';

  const filteredPatients = patients.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      (p.medical_alerts && JSON.stringify(p.medical_alerts).toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Practice Dashboard
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '2px 9px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              Neon DB: Connected • Multi-Tenant Active
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
            Welcome back, {user?.name || 'Dr. Rajesh Sharma'} • {branchDisplayName}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <Link href="/analytics" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <TrendingUp size={15} />
            <span>Practice Analytics</span>
          </Link>
          <Link href="/patients" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <Users size={15} />
            <span>Patients</span>
          </Link>
          <Link href="/patients" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={15} />
            <span>New Patient Consultation</span>
          </Link>
        </div>
      </div>

      {/* Clinical KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="kpi-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)',
              }}
            >
              <Users size={22} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>
              Active
            </span>
          </div>
          <div>
            <div className="kpi-label">Registered Patients</div>
            <div className="kpi-value" style={{ marginTop: '2px' }}>
              {patients.length}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <TrendingUp size={13} />
              <span>Full clinical records synchronized</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
              }}
            >
              <AlertCircle size={22} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px' }}>
              Priority
            </span>
          </div>
          <div>
            <div className="kpi-label">Urgent Attention</div>
            <div className="kpi-value" style={{ marginTop: '2px', color: '#dc2626' }}>
              3 Teeth
            </div>
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
              Deep decay / pulp risk flagged
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
              }}
            >
              <FileCheck size={22} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '12px' }}>
              Phase I & II
            </span>
          </div>
          <div>
            <div className="kpi-label">Treatment Plans</div>
            <div className="kpi-value" style={{ marginTop: '2px' }}>
              4 Active
            </div>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
              Structured dental care phases
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
              }}
            >
              <TrendingUp size={22} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: '12px' }}>
              Estimates
            </span>
          </div>
          <div>
            <div className="kpi-label">Pipeline Value</div>
            <div className="kpi-value" style={{ marginTop: '2px' }}>
              ₹18,400
            </div>
            <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, marginTop: '4px' }}>
              Planned clinical procedures
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Dental Clinic Workflow Banner */}
      <div
        className="panel-card"
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e293b 100%)',
          color: '#ffffff',
          marginBottom: '1.75rem',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <Sparkles size={17} color="#38bdf8" />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Clinic Consultation & Digital Conversion Protocol
              </h2>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              Standard Operatory SOP
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '1.25rem', maxWidth: '85ch', lineHeight: 1.6 }}>
            Standardized digital clinical protocol: examine findings on the 3D/2D FDI dental chart, assign priorities,
            convert clinical terminology to plain patient language with Hindi explanations, and issue an official estimate.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {[
              { step: 'STEP 1', title: 'Examine Patient', desc: 'Chief complaint & systemic medical alerts' },
              { step: 'STEP 2', title: 'Record FDI Chart', desc: 'Interactive 3D model & surface selector' },
              { step: 'STEP 3', title: 'Prioritize Plan', desc: 'Urgent, soon, preventive, or elective' },
              { step: 'STEP 4', title: 'Patient View', desc: 'Dual Hindi/English plain explanations' },
              { step: 'STEP 5', title: 'Estimate & Sign', desc: 'One-click GST & NHCX claim generation' },
            ].map((st) => (
              <div
                key={st.step}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em' }}>{st.step}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '3px' }}>{st.title}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Patients Quick Access */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div>
            <h3 className="panel-title" style={{ fontSize: '16px' }}>Active Patient Cases</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Select a patient to open dental chart or review case presentation.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Filter patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ width: '220px', minHeight: '34px', padding: '0.35rem 0.75rem', fontSize: '12px' }}
            />
            <Link href="/patients" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age / Gender</th>
                <th>Phone</th>
                <th>Visits</th>
                <th>Medical History</th>
                <th style={{ textAlign: 'right' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                          color: '#0284c7',
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {p.name?.slice(0, 1) || 'P'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.age} Yrs • {p.gender}</td>
                  <td style={{ color: '#475569', fontFamily: 'monospace', fontSize: '12px' }}>{p.phone}</td>
                  <td>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                      }}
                    >
                      {p.visit_count} visits
                    </span>
                  </td>
                  <td>
                    {p.medical_history ? (
                      <span style={{ fontSize: '11px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        ⚠️ {p.medical_history}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>None recorded</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <Link
                        href={`/patients/${p.id}/presentation`}
                        className="btn btn-outline btn-sm"
                        style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '11px' }}
                      >
                        <Eye size={13} />
                        <span>Case View</span>
                      </Link>
                      <Link
                        href={`/patients/${p.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '11px' }}
                      >
                        <Stethoscope size={13} />
                        <span>Open Chart</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
