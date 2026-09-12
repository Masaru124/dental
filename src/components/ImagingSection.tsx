'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, Sparkles, Image, CheckCircle, AlertCircle, FileText, ExternalLink } from 'lucide-react';

interface ImagingAsset {
  id: string;
  visit_id: string;
  tooth_number?: string;
  type: 'bitewing' | 'periapical' | 'panoramic' | 'cbct' | 'intraoral_photo';
  file_ref: string;
  file_name?: string;
  file_size?: number;
  uploaded_at: string;
  uploaded_by?: string;
  finding_count?: number;
}

interface ImagingSectionProps {
  visitId: string;
  patientId: string;
  onFindingsGenerated?: () => void;
}

export default function ImagingSection({
  visitId,
  patientId,
  onFindingsGenerated,
}: ImagingSectionProps) {
  const [assets, setAssets] = useState<ImagingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState('16');
  const [imageType, setImageType] = useState<'bitewing' | 'periapical' | 'panoramic' | 'cbct' | 'intraoral_photo'>('bitewing');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchAssets = async () => {
    if (!visitId) return;
    try {
      const res = await fetch(`/api/imaging?visit_id=${visitId}`);
      const data = await res.json();
      if (data.assets) {
        setAssets(data.assets);
      }
    } catch (err) {
      console.error('Failed to load imaging assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [visitId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);

    try {
      // 1. Upload file binary via /api/upload
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'File upload failed');

      // 2. Register metadata + trigger AI findings via /api/imaging
      const metaRes = await fetch('/api/imaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_id: visitId,
          tooth_number: selectedTooth,
          type: imageType,
          file_ref: uploadData.url,
          file_name: uploadData.fileName,
          file_size: uploadData.fileSize,
        }),
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.error || 'Metadata record failed');

      setUploadSuccess(`Upload complete! AI detected ${metaData.aiFindings?.length || 0} finding(s).`);
      fetchAssets();
      if (onFindingsGenerated) onFindingsGenerated();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="panel-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="panel-title">Diagnostic Imaging & Radiographs</h3>
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
              AI Diagnosis Active
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Upload Bitewing, Periapical, or OPG scans. AI runs automatic caries & bone loss analysis.
          </p>
        </div>
      </div>

      {/* Upload Controls Bar */}
      <div
        style={{
          background: 'var(--color-canvas-subtle, #f8fafc)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '1rem',
          border: 'var(--border-hairline, 1px solid #e2e8f0)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Target Tooth</label>
          <input
            type="text"
            className="input-field"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            value={selectedTooth}
            onChange={(e) => setSelectedTooth(e.target.value)}
            placeholder="e.g. 16, 46, All"
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Scan Modality</label>
          <select
            className="input-field"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            value={imageType}
            onChange={(e) => setImageType(e.target.value as any)}
          >
            <option value="bitewing">Bitewing Radiograph</option>
            <option value="periapical">Periapical (IOPA)</option>
            <option value="panoramic">Panoramic (OPG)</option>
            <option value="cbct">CBCT 3D Volume</option>
            <option value="intraoral_photo">Intraoral Photograph</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Upload Scan File</label>
          <label
            className="btn btn-primary btn-sm"
            style={{
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UploadCloud size={15} />
            <span>{uploading ? 'Analyzing scan...' : 'Upload & Analyze'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.dcm"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Success banner */}
      {uploadSuccess && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md, 8px)',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '1rem',
          }}
        >
          <CheckCircle size={16} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Assets Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '12px' }}>
          Loading radiographs...
        </div>
      ) : assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
          <Image size={24} style={{ margin: '0 auto 6px', color: '#cbd5e1' }} />
          <p style={{ fontSize: '13px' }}>No imaging assets uploaded for this visit yet.</p>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>Upload a radiograph above to see AI finding detection.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              style={{
                border: 'var(--border-hairline, 1px solid #e2e8f0)',
                borderRadius: 'var(--radius-md, 8px)',
                overflow: 'hidden',
                background: 'var(--color-surface, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: '140px',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {asset.file_ref.startsWith('http') ? (
                  <img
                    src={asset.file_ref}
                    alt={asset.file_name || 'Radiograph'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Image size={32} color="#475569" />
                    <span>Radiograph Scan</span>
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {asset.type.replace('_', ' ')}
                </span>
                {asset.tooth_number && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'var(--color-accent, #0284c7)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    #{asset.tooth_number}
                  </span>
                )}
              </div>
              <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink, #0f172a)' }} className="truncate">
                    {asset.file_name || 'Radiograph scan'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #94a3b8)', marginTop: '2px' }}>
                    {new Date(asset.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: (asset.finding_count || 0) > 0 ? '#d97706' : '#10b981',
                    }}
                  >
                    {(asset.finding_count || 0) > 0 ? `⚡ ${asset.finding_count} AI Finding(s)` : '✓ Clear'}
                  </span>
                  {asset.file_ref.startsWith('http') && (
                    <a
                      href={asset.file_ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent, #0284c7)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11px' }}
                    >
                      <ExternalLink size={12} />
                      <span>View</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
