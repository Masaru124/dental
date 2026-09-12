'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Globe, CheckCircle2, AlertCircle, Phone, Calendar, Printer } from 'lucide-react';
import ToothChart from '@/components/ToothChart';

interface PresentationData {
  language: string;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
  };
  clinicInfo: {
    name: string;
    address: string;
    phone: string;
    doctorName: string;
  };
  findings: Array<{
    toothNumber: string;
    clinicalCondition: string;
    friendlyDescription: string;
    surfaces?: string[];
    notes?: string;
  }>;
  treatmentPlan: Array<{
    id: string;
    toothNumber: string;
    procedureName: string;
    friendlyProcedureName: string;
    category: string;
    priority: string;
    friendlyPriority: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;
  grandTotal: number;
}

export default function PatientPresentationPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async (selectedLang: 'en' | 'hi') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/presentation/${patientId}?lang=${selectedLang}`);
      const json = await res.json();
      if (json.patient) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load presentation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadData(lang);
    }
  }, [patientId, lang]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Dental_Treatment_Plan_${data?.patient.name.replace(/\s+/g, '_')}_${lang.toUpperCase()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: '1rem' }}>
        <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%' }} />
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Generating Patient Presentation Case Sheet...</div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>Formatting bilingual clinical procedures and dental diagram</div>
      </div>
    );
  }


  // Group items by priority for clear patient understanding
  const urgentItems = data.treatmentPlan.filter((i) => i.priority === 'urgent');
  const soonItems = data.treatmentPlan.filter((i) => i.priority === 'soon');
  const preventiveItems = data.treatmentPlan.filter((i) => i.priority === 'preventive' || i.priority === 'elective');

  const getToothLabel = (toothNumber?: string | null) => {
    if (!toothNumber || toothNumber.toLowerCase() === 'all' || toothNumber === 'undefined') {
      return lang === 'hi' ? 'संपूर्ण मुख' : 'Full Arch / All';
    }
    return `#${toothNumber}`;
  };


  // Convert findings back to map for ToothChart preview
  const toothRecordMap: Record<string, any> = {};
  data.findings.forEach((f) => {
    toothRecordMap[f.toothNumber] = {
      tooth_number: f.toothNumber,
      condition: f.clinicalCondition,
      surfaces: f.surfaces,
      notes: f.friendlyDescription,
    };
  });

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100dvh', padding: '1.5rem 1rem' }}>
      {/* Top Controls Bar (Hidden during PDF print) */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => router.push(`/patients/${patientId}`)}
          className="btn btn-secondary"
          style={{ background: '#ffffff' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Clinical Chart</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Language Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '2px',
              alignItems: 'center',
            }}
          >
            <span style={{ padding: '0 6px', color: '#64748b' }}>
              <Globe size={14} />
            </span>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: lang === 'en' ? 700 : 500,
                background: lang === 'en' ? '#0284c7' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#475569',
                borderRadius: '6px',
              }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: lang === 'hi' ? 700 : 500,
                background: lang === 'hi' ? '#0284c7' : 'transparent',
                color: lang === 'hi' ? '#ffffff' : '#475569',
                borderRadius: '6px',
              }}
            >
              हिंदी (Hindi)
            </button>
          </div>

          {/* Download PDF */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPDF}
            disabled={isExporting}
          >
            <Download size={16} />
            <span>{isExporting ? 'Generating PDF...' : 'Download Official PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable Presentation Document */}
      <div
        ref={printRef}
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          padding: '2.5rem',
        }}
      >
        {/* Clinic Letterhead Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0284c7',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '16px',
                }}
              >
                +
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {data.clinicInfo.name}
              </h1>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {data.clinicInfo.address} | Tel: {data.clinicInfo.phone}
            </p>
            <p style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
              {data.clinicInfo.doctorName}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              {lang === 'hi' ? 'उपचार योजना एवं अनुमान' : 'Patient Care Plan & Estimate'}
            </span>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Patient Details Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              {lang === 'hi' ? 'मरीज का नाम' : 'Patient Name'}
            </span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{data.patient.name}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              {lang === 'hi' ? 'आयु एवं लिंग' : 'Age & Gender'}
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              {data.patient.age} Yrs / {data.patient.gender}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              {lang === 'hi' ? 'फोन नंबर' : 'Phone'}
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{data.patient.phone}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              {lang === 'hi' ? 'मरीज आईडी' : 'Patient ID'}
            </span>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>
              {data.patient.id}
            </div>
          </div>
        </div>

        {/* Section 1: Visual Dental Chart */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            {lang === 'hi' ? '१. आपके दांतों की वर्तमान स्थिति (दंत चार्ट)' : '1. Your Dental Health Overview (Chart)'}
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '0.75rem' }}>
            {lang === 'hi'
              ? 'नीचे दिए गए चार्ट में आपके मुंह की जांच के दौरान पाए गए दांतों की स्थिति दर्शायी गई है:'
              : 'The anatomical chart below highlights areas identified during your comprehensive examination:'}
          </p>

          <ToothChart
            records={toothRecordMap}
            selectedTooth={null}
            onSelectTooth={() => {}}
            readOnly={true}
          />
        </div>

        {/* Section 2: Clinical Findings Explained Simply */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            {lang === 'hi' ? '२. जांच के मुख्य निष्कर्ष (सरल भाषा में)' : '2. Key Findings Explained in Plain Words'}
          </h2>

          {data.findings.length === 0 ? (
            <div style={{ padding: '0.75rem', background: '#ecfdf5', borderRadius: '6px', color: '#065f46', fontSize: '13px' }}>
              ✓ {lang === 'hi' ? 'सभी दांत पूरी तरह स्वस्थ और मजबूत हैं!' : 'All teeth are clean, sound, and healthy!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {data.findings.map((f) => (
                <div
                  key={f.toothNumber}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Tooth #{f.toothNumber}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {f.friendlyDescription}
                    </span>
                  </div>
                  {f.notes && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      Doctor's Note: {f.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Recommended Treatment Plan & Costs */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            {lang === 'hi' ? '३. प्रस्तावित उपचार योजना एवं खर्च' : '3. Recommended Treatment Plan & Transparent Costing'}
          </h2>

          {/* Urgent Phase */}
          {urgentItems.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>
                  {lang === 'hi' ? 'चरण १: तुरंत आवश्यक उपचार (दर्द या संक्रमण से बचाव)' : 'Phase 1: Immediate Priority (Urgent)'}
                </span>
              </div>
              <table className="clinical-table" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <thead>
                  <tr>
                    <th>{lang === 'hi' ? 'दांत' : 'Tooth'}</th>
                    <th>{lang === 'hi' ? 'उपचार प्रक्रिया' : 'Procedure'}</th>
                    <th>{lang === 'hi' ? 'मात्रा' : 'Qty'}</th>
                    <th>{lang === 'hi' ? 'अनुमानित शुल्क' : 'Fee (₹)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{getToothLabel(item.toothNumber)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.friendlyProcedureName}</div>
                        {item.notes && <div style={{ fontSize: '11px', color: '#64748b' }}>{item.notes}</div>}
                      </td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 700 }}>₹{item.totalPrice.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Soon Phase */}
          {soonItems.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#9a3412',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}
              >
                <Calendar size={16} />
                <span>
                  {lang === 'hi' ? 'चरण २: अगले २-४ हफ्तों में कराने योग्य उपचार' : 'Phase 2: Recommended within 2-4 Weeks'}
                </span>
              </div>
              <table className="clinical-table" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <thead>
                  <tr>
                    <th>{lang === 'hi' ? 'दांत' : 'Tooth'}</th>
                    <th>{lang === 'hi' ? 'उपचार प्रक्रिया' : 'Procedure'}</th>
                    <th>{lang === 'hi' ? 'मात्रा' : 'Qty'}</th>
                    <th>{lang === 'hi' ? 'अनुमानित शुल्क' : 'Fee (₹)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {soonItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{getToothLabel(item.toothNumber)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.friendlyProcedureName}</div>
                        {item.notes && <div style={{ fontSize: '11px', color: '#64748b' }}>{item.notes}</div>}
                      </td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 700 }}>₹{item.totalPrice.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Preventive Phase */}
          {preventiveItems.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#065f46',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  {lang === 'hi' ? 'चरण ३: नियमित रोकथाम व रखरखाव' : 'Phase 3: Preventive Care & Maintenance'}
                </span>
              </div>
              <table className="clinical-table" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <thead>
                  <tr>
                    <th>{lang === 'hi' ? 'दांत' : 'Tooth'}</th>
                    <th>{lang === 'hi' ? 'उपचार प्रक्रिया' : 'Procedure'}</th>
                    <th>{lang === 'hi' ? 'मात्रा' : 'Qty'}</th>
                    <th>{lang === 'hi' ? 'अनुमानित शुल्क' : 'Fee (₹)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {preventiveItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{getToothLabel(item.toothNumber)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.friendlyProcedureName}</div>
                        {item.notes && <div style={{ fontSize: '11px', color: '#64748b' }}>{item.notes}</div>}
                      </td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 700 }}>₹{item.totalPrice.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total Cost Summary Banner */}
          <div
            style={{
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                {lang === 'hi' ? 'कुल अनुमानित उपचार लागत' : 'Total Estimated Treatment Cost'}
              </div>
              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>
                {lang === 'hi' ? '*चरणबद्ध किश्तों में भुगतान की सुविधा उपलब्ध' : '*Flexible phased payment options available'}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>
              ₹{data.grandTotal.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Doctor Signature & Clinic Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.5rem',
            marginTop: '2rem',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '400px' }}>
            {lang === 'hi'
              ? 'यह उपचार योजना आपकी नैदानिक जांच पर आधारित है। किसी भी सवाल या समय निर्धारण के लिए कृपया क्लिनिक से संपर्क करें।'
              : 'This treatment plan is customized based on your clinical assessment. For queries or appointments, call our desk directly.'}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '180px', borderBottom: '1px solid #0f172a', marginBottom: '6px' }} />
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
              {data.clinicInfo.doctorName}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Treating Dental Surgeon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
