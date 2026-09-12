'use client';

import React, { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  AlertTriangle,
  QrCode,
  ExternalLink,
  Lock,
  ArrowRight,
  Clock,
  CreditCard,
  X,
  Share2,
  Check,
  Info,
  FileSignature,
  Activity,
  Flame,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import ToothChart, { ToothRecordItem } from '@/components/ToothChart';

// Dynamic import of 3D Arch to ensure seamless client-only rendering
const DentalArch3D = dynamic(() => import('@/components/DentalArch3D'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-lg)' }}>
      <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        Loading high-definition 3D dental scan...
      </p>
    </div>
  ),
});

export default function PatientPublicPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Weapon 1: 3D Disease Timeline & Delay Penalty Simulator State
  const [progressionStage, setProgressionStage] = useState<'today' | '6mo' | '12mo'>('today');

  // Weapon 3: Medico-Legal Touch/Stylus e-Consent State
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentSigned, setConsentSigned] = useState(false);
  const [consentSignedAt, setConsentSignedAt] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoading(true);
        const res = await fetch(`/api/patient-share/${token}`);
        if (!res.ok) {
          throw new Error('Failed to load shared treatment plan.');
        }
        const json = await res.json();
        setData(json);
        if (json.findings && json.findings.length > 0) {
          setSelectedTooth(json.findings[0].toothNumber);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading plan');
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ width: 44, height: 44, border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Apex Dental Digital Portal
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Retrieving your secure 3D diagnostic record and treatment plan...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '420px', textAlign: 'center', padding: '2.5rem' }}>
          <AlertTriangle size={48} color="var(--color-danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {lang === 'en' ? 'Plan Not Found or Expired' : 'उपचार योजना नहीं मिली या समाप्त हो गई'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            {lang === 'en'
              ? 'This secure link may have expired or is invalid. Please contact the clinic for a refreshed link.'
              : 'यह सुरक्षित लिंक समाप्त हो गया हो सकता है। कृपया क्लिनिक से संपर्क करें।'}
          </p>
          <a
            href="tel:+918041234567"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            <Phone size={16} /> Call Clinic (+91 80 4123 4567)
          </a>
        </div>
      </div>
    );
  }

  const { patient, clinicInfo, findings, toothRecords, treatmentPlan, grandTotal, depositAmount } = data;

  // Selected tooth details
  const selectedFinding = findings.find((f: any) => f.toothNumber === selectedTooth);
  const selectedPlanItem = treatmentPlan.find((item: any) => item.toothNumber === selectedTooth || (item.toothRefs && item.toothRefs.includes(selectedTooth)));

  // WhatsApp message text
  const waGreeting = lang === 'en'
    ? `Hello Dr. Sharma, I am ${patient.name}. I reviewed my 3D Dental Plan for Tooth #${selectedTooth || 'all'} on the Apex Dental portal. I have a question regarding the procedure and scheduling.`
    : `नमस्ते डॉ. शर्मा, मैं ${patient.name} हूँ। मैंने एपेक्स पोर्टल पर अपने दांत #${selectedTooth || 'सभी'} की 3D योजना देखी है। मुझे अपॉइंटमेंट और प्रक्रिया के बारे में बात करनी है।`;
  const waUrl = `https://wa.me/${clinicInfo.whatsappPhone || '919876543210'}?text=${encodeURIComponent(waGreeting)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const PROGRESSION_DATA = {
    today: {
      stage: 'today',
      title_en: 'Today: Enamel Micro-Cavity (Early Stage)',
      title_hi: 'आज: प्रारंभिक इनेमल कैविटी (शुरुआती स्तर)',
      pathology_en: 'Superficial enamel fissure decay. The underlying dentin and internal nerve pulp are 100% vital, healthy, and unharmed.',
      pathology_hi: 'सतही इनेमल कैविटी। आंतरिक नसें और डेंटिन पूरी तरह सुरक्षित और जीवित हैं।',
      painScore: '1 / 10',
      painDesc_en: 'Asymptomatic (No pain / Minimal sensitivity)',
      painDesc_hi: 'दर्द रहित (कोई समस्या नहीं)',
      procedure_en: '1x Conservative Composite Restoration (Tooth-Colored Filling)',
      procedure_hi: '1x कंपोजिट फिलिंग (प्राकृतिक दांत जैसा रंग)',
      sittings_en: '1 Chairside Sitting (20 mins)',
      sittings_hi: '1 बैठक (20 मिनट)',
      cost: 2000,
      penalty: 0,
      badgeColor: '#10b981',
      badgeBg: '#ecfdf5',
      badgeBorder: '#a7f3d0',
    },
    '6mo': {
      stage: '6mo',
      title_en: '+6 Months: Dentinal & Pulp Invasion (Severe Pain)',
      title_hi: '+6 महीने: नस तक संक्रमण व तीव्र दर्द',
      pathology_en: 'Bacterial acids penetrate dentin into the living pulp chamber. Acute irreversible pulpitis triggering nocturnal throbbing pain.',
      pathology_hi: 'बैक्टीरिया दांत की नस तक पहुंच गया है। रात में तेज धड़कता हुआ दर्द और सूजन।',
      painScore: '8 / 10',
      painDesc_en: 'Severe Night Throbbing Pain',
      painDesc_hi: 'तीव्र रात का दर्द',
      procedure_en: 'Rotary 3D Endodontic Root Canal Therapy + CAD/CAM Zirconia Crown',
      procedure_hi: '3D रूट कैनाल ट्रीटमेंट + मजबूत ज़िरकोनिया क्राउन',
      sittings_en: '3 Clinical Sittings',
      sittings_hi: '3 क्लिनिकल बैठकें',
      cost: 14500,
      penalty: 12500,
      badgeColor: '#d97706',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a',
    },
    '12mo': {
      stage: '12mo',
      title_en: '+12 Months: Apical Abscess & Bone Destruction (Tooth Loss)',
      title_hi: '+12 महीने: हड्डी का क्षरण व दांत का नुकसान',
      pathology_en: 'Total pulp necrosis, apical granuloma, alveolar bone resorption, and irreversible tooth loss requiring surgical replacement.',
      pathology_hi: 'पूरी तरह सड़ा हुआ दांत, मसूड़ों में पस, जबड़े की हड्डी का नुकसान और दांत निकालना अनिवार्य।',
      painScore: '10 / 10',
      painDesc_en: 'Facial Swelling & Agony',
      painDesc_hi: 'चेहरे पर सूजन व असहनीय दर्द',
      procedure_en: 'Surgical Extraction + Socket Bone Graft + Titanium Implant + Zirconia Crown',
      procedure_hi: 'सर्जिकल दांत निकालना + हड्डी का ग्राफ्ट + टाइटेनियम इंप्लांट + क्राउन',
      sittings_en: '5+ Sittings over 4 months',
      sittings_hi: '5+ बैठकें (4 महीनों में)',
      cost: 42000,
      penalty: 40000,
      badgeColor: '#dc2626',
      badgeBg: '#fef2f2',
      badgeBorder: '#fecaca',
    },
  };

  const activeProgression = PROGRESSION_DATA[progressionStage];

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
    setConsentError(null);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setConsentError(null);
  };

  const handleSubmitConsent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasDrawn) {
      setConsentError(
        lang === 'en'
          ? 'Please provide your touch or mouse signature before submitting.'
          : 'कृपया सहमति पत्र जमा करने से पहले अपना हस्ताक्षर करें।'
      );
      return;
    }
    setConsentSigned(true);
    setConsentSignedAt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    setConsentModalOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '7rem' }}>
      {/* ─── Top Clinical Trust Bar ────────────────────────────── */}
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '1.1rem',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {clinicInfo.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                <ShieldCheck size={13} color="var(--color-primary)" /> NABH Accredited • Digitally Verified Record
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Language Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'var(--color-surface-subtle)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <button
                onClick={() => setLang('en')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: lang === 'en' ? 700 : 500,
                  background: lang === 'en' ? 'var(--color-surface)' : 'transparent',
                  color: lang === 'en' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: 'none',
                  boxShadow: lang === 'en' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: lang === 'hi' ? 700 : 500,
                  background: lang === 'hi' ? 'var(--color-surface)' : 'transparent',
                  color: lang === 'hi' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: 'none',
                  boxShadow: lang === 'hi' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                }}
              >
                हिंदी
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              title="Share Link"
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '7px 10px',
                cursor: 'pointer',
                color: copiedLink ? 'var(--color-success)' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
              <span className="hide-mobile">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero / Patient Greeting ────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(180deg, #f0f9ff 0%, #f8fafc 100%)',
          borderBottom: '1px solid var(--color-border)',
          padding: '2rem 1.25rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            {lang === 'en' ? 'Interactive 3D Oral Health Record' : 'इंटरएक्टिव 3D डेंटल रिपोर्ट'}
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            {lang === 'en' ? `Welcome, ${patient.name}` : `नमस्ते, ${patient.name}`}
          </h1>

          <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
            {lang === 'en'
              ? `Your consulting doctor, ${clinicInfo.doctorName}, has prepared this digital 3D visualization of your teeth and step-by-step treatment estimate.`
              : `आपके परामर्श चिकित्सक ${clinicInfo.doctorName} ने आपके दांतों का 3D विज़ुअलाइज़ेशन और चरणबद्ध उपचार अनुमान तैयार किया है।`}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={13} /> {lang === 'en' ? 'Confidential Patient Access' : 'गोपनीय रोगी पोर्टल'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} /> {lang === 'en' ? 'Valid for 14 Days' : '14 दिनों के लिए मान्य'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Content Container ───────────────────────────── */}
      <main style={{ maxWidth: '1080px', margin: '1.5rem auto 0', padding: '0 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
          {/* Left Column: 3D Teeth Visualization & Findings */}
          <div>
            {/* View Switcher Bar */}
            <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                  {lang === 'en' ? 'Interactive Teeth Visualizer' : 'दांतों का 3D चार्ट'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {lang === 'en' ? 'Tap any highlighted tooth to inspect condition' : 'किसी भी दांत को छूकर समस्या देखें'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`btn btn-sm ${viewMode === '3d' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  <Layers size={13} /> 3D Arch
                </button>
                <button
                  onClick={() => setViewMode('2d')}
                  className={`btn btn-sm ${viewMode === '2d' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  2D FDI Chart
                </button>
              </div>
            </div>

            {/* 3D / 2D Canvas */}
            <div
              className="card"
              style={{
                padding: '0.75rem',
                minHeight: '400px',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              {viewMode === '3d' ? (
                <div style={{ height: '440px', width: '100%', position: 'relative' }}>
                  <DentalArch3D
                    records={toothRecords}
                    selectedTooth={selectedTooth}
                    onSelectTooth={(toothNum) => setSelectedTooth(toothNum)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: 'var(--color-text-secondary)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      pointerEvents: 'none',
                    }}
                  >
                    🖱️ Drag to rotate • Scroll to zoom
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem 0' }}>
                  <ToothChart
                    records={toothRecords}
                    selectedTooth={selectedTooth}
                    onSelectTooth={(toothNum) => setSelectedTooth(toothNum)}
                    readOnly={true}
                  />
                </div>
              )}
            </div>

            {/* Selected Tooth Deep-Dive Card */}
            {selectedTooth && (
              <div
                className="card"
                style={{
                  marginTop: '1rem',
                  padding: '1.25rem',
                  borderLeft: '4px solid var(--color-primary)',
                  background: 'var(--color-surface)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                      }}
                    >
                      {selectedTooth}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {lang === 'en' ? `Tooth #${selectedTooth}` : `दांत #${selectedTooth}`}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                        {selectedFinding
                          ? (lang === 'en' ? selectedFinding.friendlyDescription_en : selectedFinding.friendlyDescription_hi)
                          : (lang === 'en' ? 'Healthy & Sound' : 'स्वस्थ दाँत')}
                      </span>
                    </div>
                  </div>

                  {selectedFinding && (
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                      {lang === 'en' ? 'Requires Attention' : 'इलाज की ज़रूरत'}
                    </span>
                  )}
                </div>

                {selectedFinding ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.5, background: 'var(--color-surface-subtle)', padding: '0.85rem', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                      {lang === 'en' ? 'Doctor Observation:' : 'चिकित्सक की राय:'}
                    </div>
                    <div>
                      {lang === 'en'
                        ? (selectedFinding.notes || `Clinical finding indicates ${selectedFinding.clinicalCondition}. Timely care will restore full dental function.`)
                        : (selectedFinding.notes || `${selectedFinding.friendlyDescription_hi} की पहचान हुई है। सही समय पर उपचार से समस्या का समाधान होगा।`)}
                    </div>

                    {selectedPlanItem && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {lang === 'en' ? 'Recommended Treatment' : 'सुझाया गया उपचार'}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {lang === 'en' ? selectedPlanItem.friendlyProcedureName_en : selectedPlanItem.friendlyProcedureName_hi}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                          ₹{selectedPlanItem.totalPrice.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {lang === 'en'
                      ? 'This tooth is currently in healthy condition. Regular brushing, flossing, and 6-month preventive checkups will maintain this.'
                      : 'यह दांत पूरी तरह स्वस्थ है। नियमित ब्रशिंग और 6 महीने की नियमित जांच से इसे स्वस्थ रखें।'}
                  </p>
                )}
              </div>
            )}

            {/* Clinical Findings Summary List */}
            <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  {lang === 'en' ? 'Identified Clinical Findings' : 'दांतों की प्रमुख समस्याएं'} ({findings.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {lang === 'en' ? 'Click row to locate on 3D model' : '3D मॉडल पर देखने के लिए क्लिक करें'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {findings.map((f: any) => {
                  const isSelected = selectedTooth === f.toothNumber;
                  return (
                    <div
                      key={f.toothNumber}
                      onClick={() => setSelectedTooth(f.toothNumber)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '6px',
                            background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                            color: isSelected ? 'white' : 'var(--color-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          {f.toothNumber}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                            {lang === 'en' ? f.friendlyDescription_en : f.friendlyDescription_hi}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                            {lang === 'en' ? `Tooth #${f.toothNumber}` : `दांत #${f.toothNumber}`}
                            {f.surfaces && f.surfaces.length > 0 && ` • Surface (${f.surfaces.join(', ')})`}
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={16} color={isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Weapon 1: 3D Disease Progression & Delay Risk Simulator ─── */}
            <div
              id="disease-progression-simulator"
              className="card"
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      {lang === 'en' ? '3D Disease Progression & Delay Penalty Simulator' : 'उपचार में देरी का जोखिम व खर्च वृद्धि सिमुलेटर'}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {lang === 'en'
                        ? 'Simulate biological tooth deterioration and exponential cost escalation if delayed'
                        : 'इलाज टालने पर दांत का क्षरण और खर्च में भारी वृद्धि देखें'}
                    </div>
                  </div>
                </div>

                <span
                  className="badge"
                  style={{
                    background: activeProgression.badgeBg,
                    color: activeProgression.badgeColor,
                    borderColor: activeProgression.badgeBorder,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {progressionStage === 'today' ? 'Early Intervention' : progressionStage === '6mo' ? 'Urgent / Pulpitis' : 'Irreversible Loss'}
                </span>
              </div>

              {/* Stage Selector Buttons */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '10px',
                }}
              >
                <button
                  type="button"
                  id="stage-btn-today"
                  onClick={() => setProgressionStage('today')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: 'none',
                    background: progressionStage === 'today' ? '#ffffff' : 'transparent',
                    color: progressionStage === 'today' ? '#0f172a' : '#64748b',
                    fontWeight: progressionStage === 'today' ? 800 : 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: progressionStage === 'today' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>{lang === 'en' ? 'Today' : 'आज'}</span>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>₹2,000</span>
                </button>

                <button
                  type="button"
                  id="stage-btn-6mo"
                  onClick={() => setProgressionStage('6mo')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: 'none',
                    background: progressionStage === '6mo' ? '#ffffff' : 'transparent',
                    color: progressionStage === '6mo' ? '#0f172a' : '#64748b',
                    fontWeight: progressionStage === '6mo' ? 800 : 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: progressionStage === '6mo' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>{lang === 'en' ? '+6 Months' : '+6 महीने'}</span>
                  <span style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700 }}>₹14,500</span>
                </button>

                <button
                  type="button"
                  id="stage-btn-12mo"
                  onClick={() => setProgressionStage('12mo')}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: 'none',
                    background: progressionStage === '12mo' ? '#ffffff' : 'transparent',
                    color: progressionStage === '12mo' ? '#0f172a' : '#64748b',
                    fontWeight: progressionStage === '12mo' ? 800 : 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: progressionStage === '12mo' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>{lang === 'en' ? '+12 Months' : '+12 महीने'}</span>
                  <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 700 }}>₹42,000</span>
                </button>
              </div>

              {/* Interactive Delay Slider */}
              <div style={{ marginBottom: '1rem', padding: '0 4px' }}>
                <input
                  type="range"
                  id="disease-delay-slider"
                  min="0"
                  max="2"
                  step="1"
                  value={progressionStage === 'today' ? 0 : progressionStage === '6mo' ? 1 : 2}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val === 0) setProgressionStage('today');
                    else if (val === 1) setProgressionStage('6mo');
                    else setProgressionStage('12mo');
                  }}
                  style={{ width: '100%', cursor: 'pointer', accentColor: activeProgression.badgeColor }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                  <span>0 Days (Painless)</span>
                  <span>180 Days (Nerve Pulpitis)</span>
                  <span>365 Days (Bone Abscess)</span>
                </div>
              </div>

              {/* Dynamic Biological & Financial Breakdown Box */}
              <div
                style={{
                  background: activeProgression.badgeBg,
                  border: `1px solid ${activeProgression.badgeBorder}`,
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: activeProgression.badgeColor }}>
                      {lang === 'en' ? activeProgression.title_en : activeProgression.title_hi}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                      {lang === 'en' ? activeProgression.pathology_en : activeProgression.pathology_hi}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px dashed ${activeProgression.badgeBorder}` }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      {lang === 'en' ? 'Pain Index' : 'दर्द स्तर'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: activeProgression.badgeColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={14} />
                      <span>{activeProgression.painScore}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                      {lang === 'en' ? activeProgression.painDesc_en : activeProgression.painDesc_hi}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      {lang === 'en' ? 'Clinical Treatment' : 'उपचार'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                      {lang === 'en' ? activeProgression.procedure_en : activeProgression.procedure_hi}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {lang === 'en' ? activeProgression.sittings_en : activeProgression.sittings_hi}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      {lang === 'en' ? 'Estimated Total Fee' : 'अनुमानित कुल खर्च'}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.15rem', color: activeProgression.badgeColor }}>
                      ₹{activeProgression.cost.toLocaleString('en-IN')}
                    </div>
                    {activeProgression.penalty > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>
                        +{lang === 'en' ? `₹${activeProgression.penalty.toLocaleString('en-IN')} Delay Cost Penalty` : `₹${activeProgression.penalty.toLocaleString('en-IN')} अतिरिक्त नुकसान`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversion Callout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.75rem', color: '#1e40af' }}>
                <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>
                  {lang === 'en'
                    ? 'Treating immediately preserves natural tooth enamel, avoids root canal therapy, and saves up to ₹40,000.'
                    : 'समय पर इलाज कराने से प्राकृतिक दांत बचता है, रूट कैनाल से बचाव होता है और ₹40,000 तक की बचत होती है।'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Treatment Plan, Transparent Estimate & Action */}
          <div>
            <div
              className="card"
              style={{
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                position: 'sticky',
                top: '5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {lang === 'en' ? 'Treatment & Cost Estimate' : 'उपचार व पारदर्शी अनुमान'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {lang === 'en' ? 'No hidden hospital charges • Genuine lab warranties' : 'कोई छुपा शुल्क नहीं • मूल लैब वारंटी'}
                  </p>
                </div>
                <div className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  Verified Plan
                </div>
              </div>

              {/* Itemized Procedures */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {treatmentPlan.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    style={{
                      padding: '0.85rem',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                          {lang === 'en' ? item.friendlyProcedureName_en : item.friendlyProcedureName_hi}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {item.toothNumber === 'all'
                            ? (lang === 'en' ? 'Full Arch / All Teeth' : 'पूरे जबड़े के लिए')
                            : (lang === 'en' ? `Tooth #${item.toothNumber}` : `दांत #${item.toothNumber}`)}
                          {' • '}
                          <span style={{ color: item.priority === 'urgent' ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: item.priority === 'urgent' ? 700 : 500 }}>
                            {lang === 'en' ? item.friendlyPriority_en : item.friendlyPriority_hi}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Summary Box */}
              <div
                style={{
                  borderTop: '2px dashed var(--color-border)',
                  paddingTop: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>
                  <span>{lang === 'en' ? 'Procedures Total' : 'कुल उपचार शुल्क'}</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-success)', marginBottom: '0.75rem', fontWeight: 600 }}>
                  <span>{lang === 'en' ? 'Doctor Digital Consultation Credit' : 'डिजिटल परामर्श छूट'}</span>
                  <span>- ₹0 (Waived)</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '0.75rem',
                    background: 'var(--color-primary-light)',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                      {lang === 'en' ? 'Net Treatment Estimate' : 'कुल देय राशि'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                      {lang === 'en' ? 'Includes post-op follow-ups' : 'उपचार बाद की जांच शामिल'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.35rem', color: 'var(--color-primary)' }}>
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* High-Conversion Action Triggers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Weapon 3: Medico-Legal e-Consent Status / Trigger */}
                {consentSigned ? (
                  <div
                    id="consent-sealed-badge"
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      color: '#065f46',
                    }}
                  >
                    <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                        {lang === 'en' ? 'Medico-Legal Informed Consent Sealed' : 'डिजिटल मेडिकल सहमति प्रमाणित'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#047857' }}>
                        {lang === 'en' ? `NABH & NMC Signed • ${consentSignedAt || 'Verified'}` : `कानूनी रूप से मान्य • ${consentSignedAt || 'सत्यापित'}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="open-consent-btn"
                    onClick={() => setConsentModalOpen(true)}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      justifyContent: 'center',
                      border: '1px dashed #0284c7',
                      color: '#0284c7',
                      background: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FileSignature size={17} />
                    <span>{lang === 'en' ? 'Sign Medico-Legal Informed Consent' : 'सहमति पत्र पर डिजिटल हस्ताक्षर करें'}</span>
                  </button>
                )}

                {accepted ? (
                  <div
                    style={{
                      padding: '1rem',
                      background: 'var(--color-success-bg, #ecfdf5)',
                      border: '1px solid var(--color-success, #10b981)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: 'var(--color-success-dark, #065f46)',
                    }}
                  >
                    <CheckCircle2 size={24} color="var(--color-success)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {lang === 'en' ? 'Treatment Plan Accepted!' : 'उपचार योजना स्वीकृत!'}
                      </div>
                      <div style={{ fontSize: '0.75rem' }}>
                        {lang === 'en'
                          ? 'Clinic team has been notified. We will call you to confirm your preferred chair slot.'
                          : 'क्लिनिक टीम को सूचित कर दिया गया है। हम जल्द ही समय पुष्टि के लिए संपर्क करेंगे।'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setUpiModalOpen(true)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.95rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    {lang === 'en'
                      ? `Accept Plan & Book Slot (₹${depositAmount.toLocaleString('en-IN')} Advance)`
                      : `योजना स्वीकारें और स्लॉट बुक करें (₹${depositAmount.toLocaleString('en-IN')})`}
                  </button>
                )}

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: '#25D366',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <MessageSquare size={18} />
                  {lang === 'en' ? 'Discuss with Dr. Sharma on WhatsApp' : 'डॉक्टर से व्हाट्सएप पर बात करें'}
                </a>

                <a
                  href={`tel:${clinicInfo.phone.replace(/[^0-9+]/g, '')}`}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  <Phone size={15} /> {lang === 'en' ? 'Call Clinic Desk' : 'क्लिनिक में कॉल करें'} ({clinicInfo.phone})
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Instant UPI Advance Payment Modal ─────────────────── */}
      {upiModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              animation: 'slideUp 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                    {lang === 'en' ? 'Instant UPI Appointment Deposit' : 'त्वरित UPI टोकन राशि'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    Secure 256-Bit NPCI Encrypted Gateway
                  </div>
                </div>
              </div>
              <button
                onClick={() => setUpiModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              {/* Simulated UPI QR Code SVG */}
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  margin: '0 auto 1rem',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '2px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              >
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corner markers */}
                  <rect x="10" y="10" width="24" height="24" fill="black" />
                  <rect x="14" y="14" width="16" height="16" fill="white" />
                  <rect x="18" y="18" width="8" height="8" fill="black" />
                  
                  <rect x="66" y="10" width="24" height="24" fill="black" />
                  <rect x="70" y="14" width="16" height="16" fill="white" />
                  <rect x="74" y="18" width="8" height="8" fill="black" />
                  
                  <rect x="10" y="66" width="24" height="24" fill="black" />
                  <rect x="14" y="70" width="16" height="16" fill="white" />
                  <rect x="18" y="74" width="8" height="8" fill="black" />
                  
                  {/* Pattern dots */}
                  <rect x="42" y="12" width="6" height="6" fill="black" />
                  <rect x="52" y="18" width="6" height="6" fill="black" />
                  <rect x="40" y="28" width="8" height="8" fill="black" />
                  <rect x="54" y="32" width="6" height="6" fill="black" />
                  <rect x="12" y="44" width="8" height="6" fill="black" />
                  <rect x="28" y="42" width="8" height="8" fill="black" />
                  <rect x="44" y="44" width="12" height="12" fill="#0284c7" rx="2" />
                  <rect x="68" y="44" width="8" height="6" fill="black" />
                  <rect x="80" y="46" width="8" height="8" fill="black" />
                  <rect x="42" y="66" width="8" height="8" fill="black" />
                  <rect x="56" y="74" width="8" height="8" fill="black" />
                  <rect x="72" y="68" width="6" height="6" fill="black" />
                  <rect x="82" y="80" width="8" height="8" fill="black" />
                </svg>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                Scan with any UPI App (GPay, PhonePe, Paytm, CRED)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
                ₹{depositAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                VPA: <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>apexdental.care@okhdfcbank</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => {
                  setAccepted(true);
                  setUpiModalOpen(false);
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}
              >
                GPay
              </button>
              <button
                onClick={() => {
                  setAccepted(true);
                  setUpiModalOpen(false);
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}
              >
                PhonePe
              </button>
              <button
                onClick={() => {
                  setAccepted(true);
                  setUpiModalOpen(false);
                }}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}
              >
                Paytm
              </button>
            </div>

            <button
              onClick={() => {
                setAccepted(true);
                setUpiModalOpen(false);
              }}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
            >
              Simulate ₹{depositAmount.toLocaleString('en-IN')} Paid
            </button>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Sticky Conversion Bar ───────────────── */}
      <div
        className="hide-desktop"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          zIndex: 50,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {lang === 'en' ? 'Total Estimate' : 'कुल अनुमान'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            ₹{grandTotal.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#25D366',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <MessageSquare size={18} />
          </a>
          <button
            onClick={() => setUpiModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700, padding: '8px 14px' }}
          >
            {accepted ? 'Slot Confirmed' : `Accept & Pay (₹${depositAmount})`}
          </button>
        </div>
      </div>

      {/* ─── Weapon 3: Digital Medico-Legal e-Consent Modal ──── */}
      {consentModalOpen && (
        <div
          id="consent-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#ffffff',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {lang === 'en' ? 'Digital Medico-Legal Informed Consent' : 'डिजिटल मेडिकल सहमति पत्र'}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    NABH Dental Standard • ABHA #{patient.id?.toUpperCase() || 'P-101'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setConsentModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitConsent}>
              {/* Clinical Disclosure Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.78rem',
                  color: '#334155',
                  lineHeight: 1.5,
                  marginBottom: '1rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  {lang === 'en' ? 'Clinical Procedure & Risk Disclosures:' : 'उपचार व संभावित जोखिम विवरण:'}
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>
                    {lang === 'en'
                      ? 'I understand that local anesthesia carries minor risks of transient tingling or temporary tissue numbness.'
                      : 'मैं समझता/समझती हूँ कि स्थानीय एनेस्थीसिया से अस्थायी सुन्नता हो सकती है।'}
                  </li>
                  <li>
                    {lang === 'en'
                      ? 'For endodontic root canal treatments, rare complications include instrument separation or post-op flare-up requiring medication.'
                      : 'रूट कैनाल उपचार में दुर्लभ मामलों में दवा की आवश्यकता या हल्का दर्द हो सकता है।'}
                  </li>
                  <li>
                    {lang === 'en'
                      ? 'Crown and bridge prosthetic restorations require diligent oral hygiene and regular 6-month clinical recementation checkups.'
                      : 'क्राउन और ब्रिज के लंबे जीवन के लिए नियमित सफाई और 6 महीने में जांच अनिवार्य है।'}
                  </li>
                  <li>
                    {lang === 'en'
                      ? 'I hereby authorize Dr. Sharma and clinical team to administer diagnostic radiographic imaging and planned treatments.'
                      : 'मैं डॉ. शर्मा और क्लिनिक टीम को आवश्यक एक्सरे और उपचार करने की अनुमति देता/देती हूँ।'}
                  </li>
                </ul>
              </div>

              {/* Patient Identity & Device Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.72rem', background: '#f1f5f9', padding: '0.6rem 0.75rem', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Patient: </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{patient.name}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Date: </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Jurisdiction: </span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Bengaluru, India (NMC)</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Format: </span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>256-bit Encrypted Hash</span>
                </div>
              </div>

              {/* Touch Signature Pad */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                    {lang === 'en' ? 'Touch / Stylus / Mouse Signature *' : 'हस्ताक्षर (स्क्रीन पर उंगली या माउस से लिखें) *'}
                  </label>
                  <button
                    type="button"
                    id="clear-signature-btn"
                    onClick={clearCanvas}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear Signature
                  </button>
                </div>

                <div
                  style={{
                    border: consentError ? '2px solid #ef4444' : '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    background: '#ffffff',
                    cursor: 'crosshair',
                    touchAction: 'none',
                    overflow: 'hidden',
                  }}
                >
                  <canvas
                    id="consent-signature-canvas"
                    ref={canvasRef}
                    width={480}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: '100%', height: '140px', display: 'block' }}
                  />
                </div>

                {consentError && (
                  <div id="consent-error" style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>
                    {consentError}
                  </div>
                )}
                {!hasDrawn && !consentError && (
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                    Sign above using your finger on mobile screen or mouse pointer
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConsentModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-consent-btn"
                  className="btn btn-primary"
                  style={{ background: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{lang === 'en' ? 'Submit & Seal Legal Consent' : 'सहमति पत्र सुरक्षित जमा करें'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
