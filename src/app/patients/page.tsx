'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Phone, Calendar, ArrowRight, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  medical_history?: string;
  visit_count: number;
  last_visit_date?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New patient form
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const url = query ? `/api/patients?q=${encodeURIComponent(query)}` : '/api/patients';
      const res = await fetch(url);
      const data = await res.json();
      if (data.patients) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error('Fetch patients failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: parseInt(age, 10),
          gender,
          phone,
          email,
          medical_history: medicalHistory,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setAge('');
        setPhone('');
        setEmail('');
        setMedicalHistory('');
        fetchPatients(searchQuery);
      }
    } catch (err) {
      console.error('Create patient failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Patient Directory</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Search existing patients, review dental charting history, and register new patients.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <UserPlus size={16} />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="panel-card" style={{ padding: '0.875rem 1rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '420px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by patient name, phone (+91), or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {/* Patient List (Table on Desktop, Cards on Mobile) */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', marginBottom: '0.75rem' }}>No patients found matching "{searchQuery}".</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} />
              <span>Register Patient Now</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient Name & ID</th>
                  <th>Age / Gender</th>
                  <th>Contact Phone</th>
                  <th>Visits</th>
                  <th>Medical History</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/patients/${p.id}`}
                        style={{ fontWeight: 600, color: '#0284c7', textDecoration: 'none' }}
                      >
                        {p.name}
                      </Link>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {p.id}
                      </div>
                    </td>
                    <td>{p.age} yrs • {p.gender}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Phone size={12} color="#64748b" />
                        <span>{p.phone}</span>
                      </div>
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
                        {p.visit_count} visits
                      </span>
                    </td>
                    <td>
                      {p.medical_history ? (
                        <span style={{ fontSize: '12px', color: '#b45309' }}>
                          ⚠️ {p.medical_history.slice(0, 30)}...
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>None</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link
                          href={`/patients/${p.id}/presentation`}
                          className="btn btn-secondary btn-sm"
                          style={{ textDecoration: 'none', padding: '4px 8px', fontSize: '11px' }}
                          title="Patient Presentation View"
                        >
                          <FileText size={13} />
                          <span>Case View</span>
                        </Link>
                        <Link
                          href={`/patients/${p.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '11px' }}
                        >
                          <span>Open Chart</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
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
          <div className="panel-card" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="panel-title">Register New Patient</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleCreatePatient}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Ramesh Chandra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="input-field"
                    placeholder="e.g. 35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Gender *</label>
                  <select
                    className="input-field"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email (Optional)</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="e.g. patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Medical History / Allergies</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Penicillin allergy, Diabetes, Hypertension, Bleeding disorders..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                />
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
                  {submitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
