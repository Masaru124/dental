'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Sparkles, Landmark, FlaskConical, Package, RefreshCw } from 'lucide-react';
import { useSession } from '@/components/AppShell';

export default function AnalyticsPage() {
  const { user, activeBranch } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/analytics?branch_id=${activeBranch}` : '/api/analytics';
      const res = await fetch(url);
      const analyticsData = await res.json();
      if (!res.ok) throw new Error(analyticsData.error);
      setData(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeBranch]);

  const revenue = data?.revenue || {};
  const patients = data?.patients || {};
  const treatments = data?.treatments || {};
  const aiFindings = data?.aiFindings || {};
  const claims = data?.claims || {};
  const labCases = data?.labCases || {};
  const inventory = data?.inventory || {};
  const branchBreakdown = data?.branchBreakdown || [];

  const acceptanceRate = Number(treatments.total_items) > 0
    ? Math.round(((Number(treatments.accepted) + Number(treatments.completed)) / Number(treatments.total_items)) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', letterSpacing: '-0.02em' }}>
            Executive Practice Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Practice-wide KPIs for revenue realization, treatment plan acceptance, AI diagnostic accuracy, and operational pipeline.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Computing practice metrics...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Revenue & Realization KPIs */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Financial Performance
            </h3>
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Total Invoiced</span>
                <div className="kpi-value">₹{Number(revenue.total_invoiced || 0).toLocaleString('en-IN')}</div>
                <span className="kpi-sub">{revenue.invoice_count || 0} invoices issued</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Collected Revenue</span>
                <div className="kpi-value" style={{ color: '#059669' }}>
                  ₹{Number(revenue.total_paid || 0).toLocaleString('en-IN')}
                </div>
                <span className="kpi-sub">Realized cash in bank</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Pending Invoices</span>
                <div className="kpi-value" style={{ color: '#d97706' }}>
                  ₹{Number(revenue.total_pending || 0).toLocaleString('en-IN')}
                </div>
                <span className="kpi-sub">Awaiting patient settlement</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Treatment Acceptance</span>
                <div className="kpi-value" style={{ color: '#0284c7' }}>
                  {acceptanceRate}%
                </div>
                <span className="kpi-sub">
                  {Number(treatments.accepted || 0) + Number(treatments.completed || 0)} of {treatments.total_items || 0} procedures accepted
                </span>
              </div>
            </div>
          </div>

          {/* Operational KPIs */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Clinical Operations & Diagnostics
            </h3>
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Active Patients</span>
                <div className="kpi-value">{patients.total_patients || 0}</div>
                <span className="kpi-sub">{patients.abha_linked_count || 0} ABHA linked</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">AI Findings Generated</span>
                <div className="kpi-value" style={{ color: '#d97706' }}>
                  {aiFindings.total_findings || 0}
                </div>
                <span className="kpi-sub">
                  {aiFindings.caries_found || 0} caries • {aiFindings.bone_loss_found || 0} bone loss
                </span>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Insurance Pipeline</span>
                <div className="kpi-value">
                  {claims.total_claims || 0}
                </div>
                <span className="kpi-sub">
                  {claims.approved || 0} approved • {claims.submitted || 0} under review
                </span>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Active Lab Orders</span>
                <div className="kpi-value">
                  {labCases.total_cases || 0}
                </div>
                <span className="kpi-sub">
                  {labCases.in_progress || 0} in production • {labCases.ready || 0} ready
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Branch Breakdown Table (for Owners/All Branches view) */}
          {branchBreakdown.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                Branch Performance Matrix
              </h3>
              <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="clinical-table">
                    <thead>
                      <tr>
                        <th>Branch Name</th>
                        <th>Registered Patients</th>
                        <th>Visits (Last 30 Days)</th>
                        <th>Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchBreakdown.map((b: any) => (
                        <tr key={b.branch_id}>
                          <td>
                            <strong style={{ color: 'var(--color-ink, #0f172a)' }}>{b.branch_name}</strong>
                          </td>
                          <td>{b.patient_count} patients</td>
                          <td>{b.visits_30d} visits</td>
                          <td>
                            <strong style={{ color: '#059669' }}>
                              ₹{Number(b.revenue).toLocaleString('en-IN')}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
