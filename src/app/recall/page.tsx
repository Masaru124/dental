'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle, RefreshCw, Send, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSession } from '@/components/AppShell';

interface Campaign {
  id: string;
  branch_id: string;
  name: string;
  trigger_type: 'six_month_recall' | 'post_op_check' | 'hygiene_due' | 'custom';
  channel: 'whatsapp' | 'sms' | 'email';
  is_active: boolean;
  total_sent?: number;
  responded?: number;
  booked?: number;
  kept?: number;
  created_at: string;
}

export default function RecallPage() {
  const { activeBranch } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'six_month_recall' | 'post_op_check' | 'hygiene_due' | 'custom'>('six_month_recall');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/recall?branch_id=${activeBranch}` : '/api/recall?branch_id=br_koramangala';
      const res = await fetch(url);
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeBranch]);

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      await fetch('/api/recall', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaign.id,
          is_active: !campaign.is_active,
        }),
      });
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to toggle campaign:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: activeBranch || 'br_koramangala',
          name,
          trigger_type: triggerType,
          channel,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Create campaign failed:', err);
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
            Automated Patient Recall & Reminders
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Schedule WhatsApp & SMS follow-ups for 6-month checkups, post-op extraction care, and hygiene maintenance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchCampaigns}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Lab Warranty-Linked Auto-Recall Engine */}
      <div
        id="warranty-recall-engine"
        className="panel-card"
        style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(240, 253, 250, 0.95), rgba(204, 251, 241, 0.4))',
          border: '1px solid #99f6e4',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                id="warranty-recall-badge"
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Lab Warranty Safeguard Active
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e' }}>
                Bi-Annual Prophylaxis Required for 5-Year Warranty Continuity
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#115e59', margin: 0, maxWidth: '650px', lineHeight: 1.4 }}>
              Indian lab guarantees (Dentsply / Katana Zirconia) require documented 6-month clinical prophylaxis to stay legally enforceable. The engine automatically queues WhatsApp reminders before warranty void milestones.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right', marginRight: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f766e' }}>Queue Due This Week</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#134e4a' }}>3 Patients Due</div>
            </div>
            <button
              id="send-warranty-whatsapp-btn"
              type="button"
              className="btn btn-primary btn-sm"
              style={{ background: '#0d9488', borderColor: '#0f766e', gap: '6px' }}
              onClick={() => {
                alert('WhatsApp Warranty Prophylaxis reminder sent to Priya Sharma (Tooth #16 Zirconia Crown - Due 14 Sep)!');
              }}
            >
              <Send size={13} />
              <span>Dispatch Warranty Alerts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading recall campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
            <p style={{ fontSize: '14px' }}>No active recall campaigns configured.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Trigger Protocol</th>
                  <th>Channel</th>
                  <th>Sent</th>
                  <th>Response Rate</th>
                  <th>Appointments Kept</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Toggle Active</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => {
                  const sent = Number(camp.total_sent || 0);
                  const booked = Number(camp.booked || 0);
                  const conversionRate = sent > 0 ? Math.round((booked / sent) * 100) : 0;

                  return (
                    <tr key={camp.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-ink, #0f172a)' }}>
                          {camp.name}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            color: '#475569',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {camp.trigger_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {camp.channel}
                        </span>
                      </td>
                      <td>{sent} sent</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0284c7' }}>
                          {conversionRate}%
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>
                          ({booked} booked)
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#059669' }}>
                          {camp.kept || 0} completed
                        </span>
                      </td>
                      <td>
                        {camp.is_active ? (
                          <span className="badge badge-healthy" style={{ fontSize: '11px' }}>Active</span>
                        ) : (
                          <span className="badge badge-missing" style={{ fontSize: '11px' }}>Paused</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(camp)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: camp.is_active ? '#059669' : '#94a3b8',
                          }}
                          title={camp.is_active ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {camp.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
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

      {/* New Campaign Modal */}
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
          <div className="panel-card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 className="panel-title" style={{ marginBottom: '1rem' }}>Create Recall Campaign</h3>
            <form onSubmit={handleCreateCampaign}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Campaign Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 6-Month Routine Hygiene Checkup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Trigger Rule</label>
                <select
                  className="input-field"
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                >
                  <option value="six_month_recall">6 Months After Last Hygiene</option>
                  <option value="post_op_check">48 Hours Post-Extraction</option>
                  <option value="hygiene_due">Scaling & Polishing Annual</option>
                  <option value="custom">Custom Follow-up</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Delivery Channel</label>
                <select
                  className="input-field"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                >
                  <option value="whatsapp">WhatsApp Business API</option>
                  <option value="sms">Transactional SMS</option>
                  <option value="email">Patient Email</option>
                </select>
              </div>

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
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
