'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ImageIcon, Users, Sparkles, UploadCloud, ExternalLink, ArrowRight, ShieldCheck, Image as ImageIcon2 } from 'lucide-react';
import { useSession } from '@/components/AppShell';

interface Patient {
  id: string;
  name?: string;
  full_name?: string;
  age: number;
  gender: string;
  phone: string;
}

export default function ImagingHubPage() {
  const { activeBranch } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const url = activeBranch ? `/api/patients?branch_id=${activeBranch}` : '/api/patients';
        const res = await fetch(url);
        const data = await res.json();
        if (data.patients) {
          setPatients(data.patients);
        }
      } catch (err) {
        console.error('Failed to load patients for imaging:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [activeBranch]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', letterSpacing: '-0.02em' }}>
              Diagnostic Imaging & AI Suite
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} color="#d97706" />
              AI Diagnostics Active
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Radiographic asset management with automated AI caries detection, bone loss measurement, and FDI tooth mapping.
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <span className="kpi-label">Supported Modalities</span>
          <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 700 }}>
            Bitewing • IOPA • OPG • CBCT
          </div>
          <span className="kpi-sub">DICOM, JPEG, PNG format support</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Diagnostic AI Engine</span>
          <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 700, color: '#d97706' }}>
            Multi-lesion Radiographic
          </div>
          <span className="kpi-sub">Interproximal caries & bone reduction</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Clinical Discrepancy</span>
          <div className="kpi-value" style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>
            Automated Audit
          </div>
          <span className="kpi-sub">Cross-references FDI chart vs AI findings</span>
        </div>
      </div>

      {/* Select Patient to Upload / View Scans */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="panel-title">Select Patient for Radiographic Examination</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Upload new bitewings/periapicals or inspect AI diagnostic overlays inside the patient chart.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading patient cases...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
            <p style={{ fontSize: '14px' }}>No patients found for this branch.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient Name & ID</th>
                  <th>Age / Gender</th>
                  <th>Contact Phone</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-ink, #0f172a)' }}>
                        {p.name || p.full_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {p.id}
                      </div>
                    </td>
                    <td>{p.age} yrs • {p.gender}</td>
                    <td>{p.phone}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/patients/${p.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ImageIcon2 size={13} />
                        <span>Open Scans & AI Chart</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
