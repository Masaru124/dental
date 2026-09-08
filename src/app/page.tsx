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

export default function DashboardPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<string>('checking');

  useEffect(() => {
    // 1. Trigger DB schema initialization / seed check
    fetch('/api/init')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      })
      .catch(() => setDbStatus('error'));

    // 2. Fetch patients
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (data.patients) {
          setPatients(data.patients);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Practice Dashboard
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: dbStatus === 'connected' ? '#ecfdf5' : '#fffbeb',
                color: dbStatus === 'connected' ? '#065f46' : '#92400e',
                border: dbStatus === 'connected' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: dbStatus === 'connected' ? '#10b981' : '#f59e0b',
                }}
              />
              Neon DB: {dbStatus === 'connected' ? 'Live Cloud Connected' : 'Connecting...'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Welcome back, Dr. Rajesh Sharma • Apex Dental Care & Implant Center
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <Link href="/patients" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <Users size={16} />
            <span>View All Patients</span>
          </Link>
          <Link href="/patients" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} />
            <span>New Patient Consultation</span>
          </Link>
        </div>
      </div>

      {/* Clinical KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Registered Patients
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
              {patients.length}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981' }}>Active clinical records</div>
          </div>
        </div>

        <div className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Urgent Attention
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#991b1b' }}>
              3 Teeth
            </div>
            <div style={{ fontSize: '11px', color: '#ef4444' }}>Deep decay / pulp risk</div>
          </div>
        </div>

        <div className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Treatment Plans
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
              4 Active
            </div>
            <div style={{ fontSize: '11px', color: '#10b981' }}>Structured phases</div>
          </div>
        </div>

        <div className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#f5f3ff',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Pipeline Value
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
              ₹18,400
            </div>
            <div style={{ fontSize: '11px', color: '#8b5cf6' }}>Planned procedures</div>
          </div>
        </div>
      </div>

      {/* 5-Step Dental Clinic Workflow Banner */}
      <div
        className="panel-card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          marginBottom: '1.5rem',
          border: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <Sparkles size={18} color="#38bdf8" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
            Clinic Consultation & Patient Conversion Workflow
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '1.25rem', maxWidth: '75ch' }}>
          Standardized digital protocol: examine findings on the FDI chart, assign treatment priorities,
          convert clinical jargon to simple patient terms with Hindi translation, and generate an official PDF estimate.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>STEP 1</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>Examine Patient</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Check chief complaint & medical alerts</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>STEP 2</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>Record FDI Chart</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Click tooth, mark surfaces (O/M/D/B/L)</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>STEP 3</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>Prioritized Plan</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Set urgent, soon, preventive, or elective</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>STEP 4</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>Patient-Friendly View</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Hindi/English plain language conversion</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>STEP 5</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>PDF Export & Sign</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Download clinical estimate sheet</div>
          </div>
        </div>
      </div>

      {/* Active Patients Quick Access */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h3 className="panel-title">Active Patient Cases</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Select a patient to open dental chart or review case presentation.</p>
          </div>
          <Link href="/patients" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="table-responsive">
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
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{p.id}</div>
                  </td>
                  <td>{p.age} Yrs • {p.gender}</td>
                  <td>{p.phone}</td>
                  <td>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 600,
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {p.visit_count} visits
                    </span>
                  </td>
                  <td>
                    {p.medical_history ? (
                      <span style={{ fontSize: '12px', color: '#b45309' }}>
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
                        style={{ textDecoration: 'none', padding: '4px 8px', fontSize: '11px' }}
                      >
                        <Eye size={13} />
                        <span>Case View</span>
                      </Link>
                      <Link
                        href={`/patients/${p.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '11px' }}
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
