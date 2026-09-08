'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, UserCheck, RefreshCw } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  details?: any;
  created_at: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error('Fetch logs failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Practice Activity Audit Trail</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Append-only clinical activity logging for medical-legal compliance, patient chart audits, and security.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>No activity logs recorded yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th>Practitioner / User</th>
                  <th>Action Event</th>
                  <th>Structured Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.user_name || 'System'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{log.user_id}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          background:
                            log.action.includes('FINDING')
                              ? '#e0f2fe'
                              : log.action.includes('TREATMENT')
                              ? '#fef3c7'
                              : log.action.includes('PATIENT')
                              ? '#ecfdf5'
                              : '#f1f5f9',
                          color:
                            log.action.includes('FINDING')
                              ? '#0369a1'
                              : log.action.includes('TREATMENT')
                              ? '#92400e'
                              : log.action.includes('PATIENT')
                              ? '#065f46'
                              : '#334155',
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569' }}>
                      {log.details ? JSON.stringify(log.details) : '-'}
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
