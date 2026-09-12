'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Download,
  IndianRupee,
  RefreshCw,
  Landmark,
  X,
  Trash2,
  Send,
  Layers,
  Armchair,
  PieChart,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  User,
  Award,
  ShieldAlert,
  UserCheck,
  Calculator,
  Receipt,
  Share2,
} from 'lucide-react';
import { useSession } from '@/components/AppShell';

interface Invoice {
  id: string;
  branch_id: string;
  patient_id: string;
  patient_name: string;
  visit_id: string;
  gstin?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  created_at: string;
  issued_at?: string;
}

interface TreatmentMilestone {
  id: string;
  patientId: string;
  patientName: string;
  treatmentName: string;
  totalCost: number;
  advanceCollected: number;
  milestones: Array<{
    sittingNumber: number;
    title: string;
    clinicalScope: string;
    amount: number;
    status: 'completed' | 'in_progress' | 'scheduled' | 'pending';
    scheduledDate?: string;
    paidAt?: string;
  }>;
}

const COMMON_PROCEDURES = [
  { name: 'Comprehensive Dental Consultation & Diagnostics', cost: 800 },
  { name: 'Root Canal Treatment (Single Canal)', cost: 3500 },
  { name: 'Composite Light-Cure Restoration', cost: 1400 },
  { name: 'Zirconia Aesthetic Crown (Monolithic)', cost: 7500 },
  { name: 'Full Mouth Ultrasonic Scaling & Polishing', cost: 1800 },
  { name: 'Digital OPG Panoramic Radiograph', cost: 900 },
  { name: 'Surgical Extraction (Impacted 3rd Molar)', cost: 4500 },
];

const COMMON_INSURERS = [
  'Star Health & Allied Insurance',
  'HDFC ERGO General Insurance',
  'Care Health Insurance (Religare)',
  'ICICI Lombard General Insurance',
  'Niva Bupa Health Insurance (Max)',
  'Aditya Birla Health Insurance',
  'Medi Assist TPA',
];

const SAMPLE_MILESTONE_LEDGERS: TreatmentMilestone[] = [
  {
    id: 'mls_001',
    patientId: 'pat_aarav_101',
    patientName: 'Aarav Patel',
    treatmentName: 'Full Arch Fixed Zirconia Bridge (Teeth #14 to #17)',
    totalCost: 48000,
    advanceCollected: 20000,
    milestones: [
      {
        sittingNumber: 1,
        title: 'Sitting 1: Abutment Prep & Optical 3D Impression',
        clinicalScope: 'Gingival retraction, crown preparation, digital intraoral scan',
        amount: 20000,
        status: 'completed',
        paidAt: '2026-09-08',
      },
      {
        sittingNumber: 2,
        title: 'Sitting 2: Lab CAD/CAM Bisque & Framework Trial',
        clinicalScope: 'Verification of passive seating, contact points, and shade matching',
        amount: 14000,
        status: 'in_progress',
        scheduledDate: '2026-09-15',
      },
      {
        sittingNumber: 3,
        title: 'Sitting 3: Final Resin Cementation & Occlusion Lock',
        clinicalScope: 'Permanent bonding, articulative bite registration, hygiene protocol',
        amount: 14000,
        status: 'pending',
        scheduledDate: '2026-09-22',
      },
    ],
  },
  {
    id: 'mls_002',
    patientId: 'pat_sneha_102',
    patientName: 'Sneha Kulkarni',
    treatmentName: 'Anterior Aesthetic Smile Design (4 Ceramic Veneers)',
    totalCost: 32000,
    advanceCollected: 12000,
    milestones: [
      {
        sittingNumber: 1,
        title: 'Sitting 1: Minimal Prep & Direct Composite Mockup',
        clinicalScope: 'Enamel reduction, digital shade matching, chairside temporaries',
        amount: 12000,
        status: 'completed',
        paidAt: '2026-09-10',
      },
      {
        sittingNumber: 2,
        title: 'Sitting 2: Veneer Try-in & Patient Aesthetic Approval',
        clinicalScope: 'Glycerin try-in paste verification of shape, smile line, and translucency',
        amount: 10000,
        status: 'in_progress',
        scheduledDate: '2026-09-16',
      },
      {
        sittingNumber: 3,
        title: 'Sitting 3: Light-Cured Adhesive Bonding & Polish',
        clinicalScope: 'Hydrofluoric etch, silane coupling, Variolink bonding, margin polish',
        amount: 10000,
        status: 'pending',
        scheduledDate: '2026-09-24',
      },
    ],
  },
  {
    id: 'mls_003',
    patientId: 'pat_vikram_103',
    patientName: 'Vikram Malhotra',
    treatmentName: 'Molar Endodontic Therapy + E-Max Endocrown',
    totalCost: 14500,
    advanceCollected: 6500,
    milestones: [
      {
        sittingNumber: 1,
        title: 'Sitting 1: Access Opening & Ca(OH)2 Dressing',
        clinicalScope: 'Pulp extirpation, rotary glide path, apex locator working length',
        amount: 6500,
        status: 'completed',
        paidAt: '2026-09-11',
      },
      {
        sittingNumber: 2,
        title: 'Sitting 2: Bioceramic Warm Vertical Obturation',
        clinicalScope: 'Bioceramic sealer obturation, post-endodontic fiber core build-up',
        amount: 4000,
        status: 'in_progress',
        scheduledDate: '2026-09-14',
      },
      {
        sittingNumber: 3,
        title: 'Sitting 3: CAD/CAM Lithium Disilicate Cementation',
        clinicalScope: 'CAD/CAM milling, margin burnish, dual-cure adhesive cementation',
        amount: 4000,
        status: 'pending',
        scheduledDate: '2026-09-18',
      },
    ],
  },
];

const OPERATORY_ECONOMICS = [
  {
    operatoryId: 'op_1',
    name: 'Operatory 1: Surgical & Implant Suite',
    doctor: 'Dr. Rajesh Sharma, MDS',
    hourlyOverhead: 1200,
    bookedHours: 36.5,
    grossRevenue: 194500,
    labWorkCost: 38000,
    disposableMaterialCost: 11200,
    overheadCost: 43800,
    netClinicProfit: 101500,
    profitPerHour: 2780,
    utilizationRate: '91.2%',
    activeCases: 14,
  },
  {
    operatoryId: 'op_2',
    name: 'Operatory 2: Prostho & Aesthetic Studio',
    doctor: 'Dr. Ananya Roy, BDS',
    hourlyOverhead: 1050,
    bookedHours: 32.0,
    grossRevenue: 152000,
    labWorkCost: 31000,
    disposableMaterialCost: 8400,
    overheadCost: 33600,
    netClinicProfit: 79000,
    profitPerHour: 2468,
    utilizationRate: '80.0%',
    activeCases: 18,
  },
  {
    operatoryId: 'op_3',
    name: 'Operatory 3: General & Pediatric Bay',
    doctor: 'Dr. Sanjay Gupta, BDS',
    hourlyOverhead: 850,
    bookedHours: 44.0,
    grossRevenue: 98000,
    labWorkCost: 6500,
    disposableMaterialCost: 7900,
    overheadCost: 37400,
    netClinicProfit: 46200,
    profitPerHour: 1050,
    utilizationRate: '88.0%',
    activeCases: 32,
  },
];

const LAB_RECONCILIATION = [
  {
    caseNo: 'LC-8821',
    patient: 'Aarav Patel',
    doctor: 'Dr. Rajesh Sharma, MDS',
    procedure: 'Monolithic Zirconia Crown (#46)',
    labPartner: 'DentCraft CAD/CAM Labs',
    patientBilled: 8500,
    labCost: 2800,
    netClinicProfit: 5700,
    marginPercent: '67.1%',
    status: 'In Fabrication',
    warranty: '10-Year Authenticity Card',
  },
  {
    caseNo: 'LC-8824',
    patient: 'Sneha Kulkarni',
    doctor: 'Dr. Rajesh Sharma, MDS',
    procedure: '4-Unit E-Max Pressed Veneers (#12-#22)',
    labPartner: 'Apex Aesthetics Milling Centre',
    patientBilled: 32000,
    labCost: 9800,
    netClinicProfit: 22200,
    marginPercent: '69.4%',
    status: 'Trial Ready',
    warranty: '7-Year Warranty Card',
  },
  {
    caseNo: 'LC-8828',
    patient: 'Rohan Mehra',
    doctor: 'Dr. Ananya Roy, BDS',
    procedure: 'Laser Sintered Co-Cr Bridge (#14-#16)',
    labPartner: 'DentCraft CAD/CAM Labs',
    patientBilled: 14000,
    labCost: 4200,
    netClinicProfit: 9800,
    marginPercent: '70.0%',
    status: 'Delivered to Clinic',
    warranty: '5-Year Warranty Card',
  },
  {
    caseNo: 'LC-8831',
    patient: 'Kavita Verma',
    doctor: 'Dr. Rajesh Sharma, MDS',
    procedure: 'Clear Aligner Treatment (Series 1-12)',
    labPartner: 'Illusion Aligners & Biotech',
    patientBilled: 45000,
    labCost: 18000,
    netClinicProfit: 27000,
    marginPercent: '60.0%',
    status: 'Dispatched',
    warranty: 'Treatment Guarantee Certificate',
  },
];

const CONSULTANT_SETTLEMENTS = [
  {
    caseId: 'CON-901',
    patient: 'Aarav Patel',
    doctor: 'Dr. Vikram Malhotra',
    specialty: 'Visiting Implantologist',
    agreedSplit: '50%',
    procedure: 'Full Arch Immediate Implant & Bone Graft (#46)',
    grossBilled: 35000,
    labAndHardwareCost: 7500,
    chairOverheadCost: 1500,
    distributablePool: 26000,
    grossConsultantFee: 13000,
    tdsRate: '10% (Sec 194J)',
    tdsAmount: 1300,
    netDisbursable: 11700,
    hospitalRetained: 14800,
    status: 'Pending Settlement',
    panNo: 'ABCDE1234F',
    bankAccount: 'HDFC •••• 4412',
    utrRef: null as string | null,
    disbursedAt: null as string | null,
  },
  {
    caseId: 'CON-902',
    patient: 'Sneha Kulkarni',
    doctor: 'Dr. Ananya Roy',
    specialty: 'Visiting Orthodontist',
    agreedSplit: '40%',
    procedure: 'Clear Aligner Series (Stage 1-12) & IPR',
    grossBilled: 45000,
    labAndHardwareCost: 14000,
    chairOverheadCost: 1500,
    distributablePool: 29500,
    grossConsultantFee: 11800,
    tdsRate: '10% (Sec 194J)',
    tdsAmount: 1180,
    netDisbursable: 10620,
    hospitalRetained: 19200,
    status: 'Disbursed via NEFT',
    panNo: 'PQRS5678M',
    bankAccount: 'ICICI •••• 8821',
    utrRef: 'NEFT-HDFC-992182',
    disbursedAt: '2026-09-10',
  },
  {
    caseId: 'CON-903',
    patient: 'Rohan Mehra',
    doctor: 'Dr. Sameer Khan',
    specialty: 'Visiting Periodontist',
    agreedSplit: '45%',
    procedure: 'Surgical Periodontal Flap & Laser Depigmentation',
    grossBilled: 18000,
    labAndHardwareCost: 2000,
    chairOverheadCost: 1000,
    distributablePool: 15000,
    grossConsultantFee: 6750,
    tdsRate: '10% (Sec 194J)',
    tdsAmount: 675,
    netDisbursable: 6075,
    hospitalRetained: 9250,
    status: 'Pending Settlement',
    panNo: 'XYZK9921P',
    bankAccount: 'Axis •••• 1092',
    utrRef: null as string | null,
    disbursedAt: null as string | null,
  },
];

export default function BillingPage() {
  const { activeBranch } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // View Switcher: 'invoices' | 'milestones' | 'chairs' | 'lab' | 'consultants'
  const [billingView, setBillingView] = useState<'invoices' | 'milestones' | 'chairs' | 'lab' | 'consultants'>('invoices');

  // Weapon 2: Visiting Specialist Commission & 194J TDS State
  const [consultantCases, setConsultantCases] = useState(CONSULTANT_SETTLEMENTS);
  const [selectedConsultantFilter, setSelectedConsultantFilter] = useState('all');
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [activeDisburseCase, setActiveDisburseCase] = useState<any | null>(null);
  const [disburseUtr, setDisburseUtr] = useState('');

  // Milestone State
  const [milestonesLedger, setMilestonesLedger] = useState<TreatmentMilestone[]>(SAMPLE_MILESTONE_LEDGERS);
  const [selectedMilestonePatient, setSelectedMilestonePatient] = useState<string>('all');

  // Advance Deposit Modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advancePatient, setAdvancePatient] = useState('pat_aarav_101');
  const [advanceAmount, setAdvanceAmount] = useState('15000');
  const [advanceNote, setAdvanceNote] = useState('Advance sitting deposit for Crown & Bridge work');

  // New Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [lineItems, setLineItems] = useState<{ description: string; amount: number }[]>([
    { description: 'Comprehensive Dental Consultation & Diagnostics', amount: 800 },
  ]);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // File Claim Modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimInvoice, setClaimInvoice] = useState<Invoice | null>(null);
  const [claimPayer, setClaimPayer] = useState(COMMON_INSURERS[0]);
  const [claimPolicyRef, setClaimPolicyRef] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const url = activeBranch ? `/api/invoices?branch_id=${activeBranch}` : '/api/invoices?branch_id=br_koramangala';
      const res = await fetch(url);
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const url = activeBranch ? `/api/patients?branch_id=${activeBranch}` : '/api/patients';
      const res = await fetch(url);
      const data = await res.json();
      if (data.patients) {
        setPatients(data.patients);
        if (data.patients.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data.patients[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load patients for billing:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, [activeBranch]);

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingId(invoiceId);
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoiceId, status: newStatus }),
      });
      const data = await res.json();
      if (data.invoice) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: data.invoice.status } : inv))
        );
        showToast(`Invoice #${invoiceId.slice(-6).toUpperCase()} updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating invoice status:', err);
      alert('Failed to update invoice status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || lineItems.length === 0) return;

    setIsSubmittingInvoice(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          branch_id: activeBranch || 'br_koramangala',
          line_items: lineItems,
        }),
      });
      const data = await res.json();
      if (data.invoice) {
        showToast('GST Invoice generated successfully with SAC 999312 (18%)!');
        setShowCreateModal(false);
        setLineItems([{ description: 'Comprehensive Dental Consultation & Diagnostics', amount: 800 }]);
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Error creating invoice');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleRecordAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === advancePatient);
    const patName = pat ? pat.full_name || pat.name : 'Patient';
    const amt = Number(advanceAmount) || 0;

    setMilestonesLedger((prev) =>
      prev.map((m) => {
        if (m.patientId === advancePatient) {
          return { ...m, advanceCollected: m.advanceCollected + amt };
        }
        return m;
      })
    );

    setShowAdvanceModal(false);
    showToast(`₹${amt.toLocaleString('en-IN')} Advance Deposit credited to ${patName}'s Treatment Ledger!`);
  };

  const handleDisburseConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDisburseCase) return;
    const utr = disburseUtr || 'NEFT-AXIS-' + Math.floor(100000 + Math.random() * 900000);
    setConsultantCases((prev) =>
      prev.map((c) =>
        c.caseId === activeDisburseCase.caseId
          ? { ...c, status: 'Disbursed via NEFT', utrRef: utr, disbursedAt: '2026-09-12' }
          : c
      )
    );
    showToast(`Settlement ₹${activeDisburseCase.netDisbursable.toLocaleString('en-IN')} disbursed to ${activeDisburseCase.doctor} via ${utr}! 10% TDS certificate logged.`);
    setShowDisburseModal(false);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInvoice) return;

    setIsSubmittingClaim(true);
    try {
      const res = await fetch('/api/insurance-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: claimInvoice.id,
          payer_name: claimPayer,
          policy_reference: claimPolicyRef || 'POL-DENT-' + Math.floor(100000 + Math.random() * 900000),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Insurance claim filed with ${claimPayer} under NHCX!`);
        setShowClaimModal(false);
        setClaimPolicyRef('');
      } else {
        alert(data.error || 'Failed to file claim');
      }
    } catch (err) {
      console.error('Error filing claim:', err);
      alert('Error submitting claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === 'all') return true;
    return inv.status === statusFilter;
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0);
  const totalPending = invoices
    .filter((i) => i.status === 'issued' || i.status === 'draft')
    .reduce((sum, i) => sum + Number(i.total), 0);

  const modalSubtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const modalGst = Math.round(modalSubtotal * 0.18 * 100) / 100;
  const modalTotal = modalSubtotal + modalGst;

  const filteredMilestones = milestonesLedger.filter((m) => {
    if (selectedMilestonePatient === 'all') return true;
    return m.patientId === selectedMilestonePatient;
  });

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={16} color="#10b981" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', letterSpacing: '-0.02em' }}>
            GST Invoicing & Billing — Multi-Chair Economics & Advance Ledger
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary, #64748b)' }}>
            Hospital & DSO Financial Management: Multi-sitting milestone releases, operatory profit per chair-hour, and dental lab split reconciliation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            id="record-deposit-btn"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAdvanceModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Landmark size={15} color="#0284c7" />
            <span>Record Advance Deposit</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchInvoices}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Management View Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          marginBottom: '1.5rem',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          width: 'fit-content',
          flexWrap: 'wrap',
        }}
      >
        <button
          id="billing-tab-invoices"
          onClick={() => setBillingView('invoices')}
          className="btn btn-sm"
          style={{
            background: billingView === 'invoices' ? '#0f172a' : 'transparent',
            color: billingView === 'invoices' ? '#ffffff' : '#475569',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            boxShadow: billingView === 'invoices' ? '0 2px 6px rgba(15,23,42,0.15)' : 'none',
          }}
        >
          <FileText size={14} />
          <span>GST Invoicing</span>
        </button>

        <button
          id="billing-tab-milestones"
          onClick={() => setBillingView('milestones')}
          className="btn btn-sm"
          style={{
            background: billingView === 'milestones' ? '#0f172a' : 'transparent',
            color: billingView === 'milestones' ? '#ffffff' : '#475569',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            boxShadow: billingView === 'milestones' ? '0 2px 6px rgba(15,23,42,0.15)' : 'none',
          }}
        >
          <Layers size={14} />
          <span>Multi-Sitting Milestones & Advance Ledger</span>
        </button>

        <button
          id="billing-tab-chairs"
          onClick={() => setBillingView('chairs')}
          className="btn btn-sm"
          style={{
            background: billingView === 'chairs' ? '#0f172a' : 'transparent',
            color: billingView === 'chairs' ? '#ffffff' : '#475569',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            boxShadow: billingView === 'chairs' ? '0 2px 6px rgba(15,23,42,0.15)' : 'none',
          }}
        >
          <Armchair size={14} />
          <span>Operatory Chair-Time Economics</span>
        </button>

        <button
          id="billing-tab-lab"
          onClick={() => setBillingView('lab')}
          className="btn btn-sm"
          style={{
            background: billingView === 'lab' ? '#0f172a' : 'transparent',
            color: billingView === 'lab' ? '#ffffff' : '#475569',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            boxShadow: billingView === 'lab' ? '0 2px 6px rgba(15,23,42,0.15)' : 'none',
          }}
        >
          <PieChart size={14} />
          <span>Dental Lab Split Reconciler</span>
        </button>

        <button
          id="billing-tab-consultants"
          onClick={() => setBillingView('consultants')}
          className="btn btn-sm"
          style={{
            background: billingView === 'consultants' ? '#0f172a' : 'transparent',
            color: billingView === 'consultants' ? '#ffffff' : '#475569',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            boxShadow: billingView === 'consultants' ? '0 2px 6px rgba(15,23,42,0.15)' : 'none',
          }}
        >
          <UserCheck size={14} />
          <span>Visiting Specialist Splits & 194J TDS</span>
        </button>
      </div>

      {/* ─── TAB 1: GST Invoicing ─────────────────────────────── */}
      {billingView === 'invoices' && (
        <div>
          {/* KPI Cards */}
          <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <span className="kpi-label">Total Invoiced</span>
              <div className="kpi-value">₹{totalInvoiced.toLocaleString('en-IN')}</div>
              <span className="kpi-sub">{invoices.length} invoices generated</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Total Collected (Paid)</span>
              <div className="kpi-value" style={{ color: '#059669' }}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
              <span className="kpi-sub">{invoices.filter((i) => i.status === 'paid').length} cleared payments</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Outstanding Balance</span>
              <div className="kpi-value" style={{ color: '#d97706' }}>
                ₹{totalPending.toLocaleString('en-IN')}
              </div>
              <span className="kpi-sub">
                {invoices.filter((i) => i.status === 'issued' || i.status === 'draft').length} pending collection
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
            {[
              { key: 'all', label: 'All Invoices' },
              { key: 'draft', label: 'Draft' },
              { key: 'issued', label: 'Issued (Pending)' },
              { key: 'paid', label: 'Paid' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className="btn btn-sm"
                style={{
                  background: statusFilter === tab.key ? 'var(--color-ink, #0f172a)' : 'var(--color-surface, #ffffff)',
                  color: statusFilter === tab.key ? '#ffffff' : 'var(--color-ink-secondary, #475569)',
                  border: 'var(--border-hairline, 1px solid #cbd5e1)',
                  fontWeight: statusFilter === tab.key ? 700 : 500,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Invoices Table */}
          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <FileText size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                <p style={{ fontSize: '14px', fontWeight: 600 }}>No invoices found in this view.</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Click <strong>&quot;New Invoice&quot;</strong> above to generate a GST compliant bill.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="clinical-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Patient Name</th>
                      <th>GSTIN</th>
                      <th>Subtotal</th>
                      <th>GST (18%)</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Issued Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                          #{inv.id.slice(-6).toUpperCase()}
                        </td>
                        <td style={{ fontWeight: 600 }}>{inv.patient_name || 'Walk-in Patient'}</td>
                        <td style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                          {inv.gstin || '29AABCU9603R1ZM'}
                        </td>
                        <td>₹{Number(inv.subtotal).toLocaleString('en-IN')}</td>
                        <td style={{ color: '#64748b' }}>₹{Number(inv.tax_amount).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 800, color: 'var(--color-ink, #0f172a)' }}>
                          ₹{Number(inv.total).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              inv.status === 'paid'
                                ? 'badge-success'
                                : inv.status === 'issued'
                                ? 'badge-warning'
                                : inv.status === 'cancelled'
                                ? 'badge-danger'
                                : 'badge-neutral'
                            }`}
                          >
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(inv.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {inv.status !== 'paid' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleUpdateStatus(inv.id, 'paid')}
                                disabled={updatingId === inv.id}
                                title="Mark as Paid"
                                style={{ color: '#059669', borderColor: '#a7f3d0' }}
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setClaimInvoice(inv);
                                setShowClaimModal(true);
                              }}
                              title="File Claim (NHCX)"
                              style={{ color: '#0284c7', borderColor: '#bae6fd' }}
                            >
                              File Claim
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Treatment Milestones & Advance Ledger ───────── */}
      {billingView === 'milestones' && (
        <div>
          {/* Milestone Metrics */}
          <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <span className="kpi-label">Active Multi-Sitting Pipeline</span>
              <div className="kpi-value">₹94,500</div>
              <span className="kpi-sub">3 ongoing multi-visit rehabilitation cases</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Advance Deposits Held</span>
              <div className="kpi-value" style={{ color: '#0284c7' }}>
                ₹38,500
              </div>
              <span className="kpi-sub">Secured sitting advance ledger balance</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Unreleased Milestone Dues</span>
              <div className="kpi-value" style={{ color: '#d97706' }}>
                ₹56,000
              </div>
              <span className="kpi-sub">Locked until trial & cementation completion</span>
            </div>
          </div>

          {/* Milestone Cases List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredMilestones.map((caseItem) => {
              const progressPercent = Math.round((caseItem.advanceCollected / caseItem.totalCost) * 100);
              const remainingBalance = caseItem.totalCost - caseItem.advanceCollected;

              return (
                <div key={caseItem.id} className="panel-card" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                  {/* Case Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginBottom: '1rem',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {caseItem.treatmentName}
                        </h3>
                        <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                          Case ID: #{caseItem.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px', fontSize: '0.825rem', color: '#64748b' }}>
                        <User size={14} />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{caseItem.patientName}</span>
                        <span>•</span>
                        <span>Multi-Sitting Surgical & Prosthetic Ledger</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Case Estimate</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                        ₹{caseItem.totalCost.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        Advance Paid: ₹{caseItem.advanceCollected.toLocaleString('en-IN')} (Balance Due: ₹{remainingBalance.toLocaleString('en-IN')})
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: '#475569' }}>
                      <span>Payment & Sitting Progress</span>
                      <span>{progressPercent}% Funded</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #10b981)', borderRadius: '999px' }} />
                    </div>
                  </div>

                  {/* Sittings Milestones Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {caseItem.milestones.map((m) => (
                      <div
                        key={m.sittingNumber}
                        style={{
                          background: m.status === 'completed' ? '#f0fdf4' : m.status === 'in_progress' ? '#eff6ff' : '#f8fafc',
                          border: m.status === 'completed' ? '1px solid #bbf7d0' : m.status === 'in_progress' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span
                            className={`badge ${
                              m.status === 'completed'
                                ? 'badge-success'
                                : m.status === 'in_progress'
                                ? 'badge-primary'
                                : 'badge-neutral'
                            }`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {m.status === 'completed'
                              ? 'COMPLETED & RELEASED'
                              : m.status === 'in_progress'
                              ? 'IN PROGRESS (CHAIRSIDE)'
                              : 'PENDING CEMENTATION'}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                            ₹{m.amount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                          {m.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                          {m.clinicalScope}
                        </p>

                        <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                          <span style={{ color: '#475569' }}>
                            {m.paidAt ? `Settled on ${m.paidAt}` : `Target: ${m.scheduledDate || 'TBD'}`}
                          </span>
                          {m.status === 'in_progress' && (
                            <button
                              onClick={() => {
                                setMilestonesLedger((prev) =>
                                  prev.map((item) => {
                                    if (item.id === caseItem.id) {
                                      const updated = item.milestones.map((ms) =>
                                        ms.sittingNumber === m.sittingNumber
                                          ? { ...ms, status: 'completed' as const, paidAt: '2026-09-12' }
                                          : ms
                                      );
                                      return { ...item, advanceCollected: item.advanceCollected + m.amount, milestones: updated };
                                    }
                                    return item;
                                  })
                                );
                                showToast(`Milestone #${m.sittingNumber} released and cleared!`);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#0284c7', borderColor: '#bae6fd' }}
                            >
                              Release Sitting
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Operatory Chair-Time Economics ─────────────── */}
      {billingView === 'chairs' && (
        <div>
          {/* Executive Overview */}
          <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <span className="kpi-label">Average Net Profit / Chair-Hour</span>
              <div className="kpi-value" style={{ color: '#059669' }}>
                ₹2,099/hr
              </div>
              <span className="kpi-sub">After deducting operatory overhead & lab work</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Hospital Chair Utilization</span>
              <div className="kpi-value">86.4%</div>
              <span className="kpi-sub">112.5 clinical hours booked this month</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Operatory Fixed Burn Rate</span>
              <div className="kpi-value">₹1,033/hr</div>
              <span className="kpi-sub">Rent, equipment amortization, electricity, assistant</span>
            </div>
          </div>

          {/* Operatory Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {OPERATORY_ECONOMICS.map((op) => (
              <div key={op.operatoryId} className="panel-card" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {op.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      Lead: <span style={{ fontWeight: 600, color: '#0f172a' }}>{op.doctor}</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                    {op.utilizationRate} Utilization
                  </span>
                </div>

                {/* Economic Breakdown */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                    <span>Gross Procedure Revenue:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{op.grossRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#dc2626' }}>
                    <span>Less: Direct Lab Work Costs:</span>
                    <span>- ₹{op.labWorkCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#dc2626' }}>
                    <span>Less: Disposable Sterilization & Materials:</span>
                    <span>- ₹{op.disposableMaterialCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', color: '#dc2626' }}>
                    <span>Less: Chair Hourly Overhead ({op.bookedHours} hrs @ ₹{op.hourlyOverhead}/hr):</span>
                    <span>- ₹{op.overheadCost.toLocaleString('en-IN')}</span>
                  </div>

                  <div
                    style={{
                      borderTop: '2px solid #cbd5e1',
                      paddingTop: '0.6rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>
                        Net Clinic Contribution:
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {op.activeCases} procedures performed
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#059669' }}>
                      ₹{op.netClinicProfit.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Margin Efficiency Gauge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} color="#059669" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>
                      Chair Productivity Rate:
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#047857' }}>
                    ₹{op.profitPerHour.toLocaleString('en-IN')} / hr
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Dental Lab Cost & Split Reconciler ──────────── */}
      {billingView === 'lab' && (
        <div>
          <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <span className="kpi-label">Gross Prosthetic Invoiced</span>
              <div className="kpi-value">₹99,500</div>
              <span className="kpi-sub">4 active dental lab fabrications</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Commercial Lab Payouts</span>
              <div className="kpi-value" style={{ color: '#dc2626' }}>
                ₹34,800
              </div>
              <span className="kpi-sub">Direct lab invoices to CAD/CAM centers</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Net Clinic Retained Margin</span>
              <div className="kpi-value" style={{ color: '#059669' }}>
                ₹64,700 (65.0%)
              </div>
              <span className="kpi-sub">Retained clinical surgical profit</span>
            </div>
          </div>

          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Case Order #</th>
                    <th>Patient & Doctor</th>
                    <th>Prosthetic Procedure</th>
                    <th>Certified Lab Partner</th>
                    <th>Patient Fee (₹)</th>
                    <th>Lab Cost (₹)</th>
                    <th>Clinic Margin (₹)</th>
                    <th>Margin %</th>
                    <th>Warranty Card</th>
                    <th style={{ textAlign: 'right' }}>Reconcile</th>
                  </tr>
                </thead>
                <tbody>
                  {LAB_RECONCILIATION.map((item) => (
                    <tr key={item.caseNo}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                        {item.caseNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.patient}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{item.doctor}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.procedure}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {item.labPartner}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{item.patientBilled.toLocaleString('en-IN')}</td>
                      <td style={{ color: '#dc2626', fontWeight: 600 }}>- ₹{item.labCost.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 800, color: '#059669' }}>
                        ₹{item.netClinicProfit.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>
                          {item.marginPercent}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}>
                          <Award size={13} color="#0284c7" />
                          <span>{item.warranty}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => showToast(`Case ${item.caseNo} ledger reconciled with ${item.labPartner}!`)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', color: '#0284c7' }}
                        >
                          Reconcile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: Visiting Specialist Commission & 194J TDS ──── */}
      {billingView === 'consultants' && (
        <div>
          {/* Executive Overview KPIs */}
          <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <span className="kpi-label">Gross Visiting Case Revenue</span>
              <div className="kpi-value">₹98,000</div>
              <span className="kpi-sub">3 specialized procedures performed chairside</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Visiting Doctor Net Payouts</span>
              <div className="kpi-value" style={{ color: '#0284c7' }}>
                ₹28,395
              </div>
              <span className="kpi-sub">Net after Section 194J statutory TDS withholding</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Section 194J TDS Retained (10%)</span>
              <div className="kpi-value" style={{ color: '#d97706' }}>
                ₹3,155
              </div>
              <span className="kpi-sub">Govt Income Tax remittance batch under TAN BLRA12345C</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Hospital Retained Surgical Margin</span>
              <div className="kpi-value" style={{ color: '#059669' }}>
                ₹43,250 (44.1%)
              </div>
              <span className="kpi-sub">Retained margin after lab work & chair overhead</span>
            </div>
          </div>

          {/* Specialist Filter & Summary Bar */}
          <div className="panel-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Visiting Specialist Fee Waterfall & Statutory TDS Ledger
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Rule of Thumb: Gross Revenue - Lab Cost - Chair Overhead = Distributable Pool &rarr; Consultant Split (less 10% TDS)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                Filter Specialist:
              </label>
              <select
                id="consultant-filter-select"
                className="input"
                value={selectedConsultantFilter}
                onChange={(e) => setSelectedConsultantFilter(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px' }}
              >
                <option value="all">All Visiting Specialists (3)</option>
                <option value="Dr. Vikram Malhotra">Dr. Vikram Malhotra (Implantology • 50%)</option>
                <option value="Dr. Ananya Roy">Dr. Ananya Roy (Orthodontics • 40%)</option>
                <option value="Dr. Sameer Khan">Dr. Sameer Khan (Periodontics • 45%)</option>
              </select>
            </div>
          </div>

          {/* Waterfall Commission Ledger Table */}
          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Patient & Procedure</th>
                    <th>Visiting Specialist & Split</th>
                    <th>Gross Fee (₹)</th>
                    <th>Lab & Hardware (₹)</th>
                    <th>Chair Cost (₹)</th>
                    <th>Distributable (₹)</th>
                    <th>Gross Share (₹)</th>
                    <th>TDS (10% 194J)</th>
                    <th>Net Disbursable (₹)</th>
                    <th>Settlement Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {consultantCases
                    .filter((c) => selectedConsultantFilter === 'all' || c.doctor === selectedConsultantFilter)
                    .map((item) => (
                      <tr key={item.caseId}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                          {item.caseId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.patient}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.procedure}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.doctor}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#0284c7' }}>
                            <span>{item.specialty}</span>
                            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{item.agreedSplit}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{item.grossBilled.toLocaleString('en-IN')}</td>
                        <td style={{ color: '#dc2626', fontSize: '0.75rem' }}>- ₹{item.labAndHardwareCost.toLocaleString('en-IN')}</td>
                        <td style={{ color: '#dc2626', fontSize: '0.75rem' }}>- ₹{item.chairOverheadCost.toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>
                          ₹{item.distributablePool.toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontWeight: 700, color: '#475569' }}>
                          ₹{item.grossConsultantFee.toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: '#d97706', fontWeight: 700, fontSize: '0.75rem' }}>
                          - ₹{item.tdsAmount.toLocaleString('en-IN')}
                          <div style={{ fontSize: '0.65rem', color: '#b45309' }}>194J 10%</div>
                        </td>
                        <td style={{ fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>
                          ₹{item.netDisbursable.toLocaleString('en-IN')}
                        </td>
                        <td>
                          {item.status === 'Disbursed via NEFT' ? (
                            <div>
                              <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                                ✓ DISBURSED
                              </span>
                              <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                                {item.utrRef}
                              </div>
                            </div>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                              PENDING CLEARANCE
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            {item.status !== 'Disbursed via NEFT' ? (
                              <button
                                type="button"
                                id={`disburse-btn-${item.caseId}`}
                                onClick={() => {
                                  setActiveDisburseCase(item);
                                  setShowDisburseModal(true);
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#0284c7' }}
                              >
                                Disburse
                              </button>
                            ) : (
                              <button
                                type="button"
                                id={`voucher-btn-${item.caseId}`}
                                onClick={() => showToast(`WhatsApp Payment Advice Voucher dispatched to ${item.doctor} (${item.bankAccount})!`)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                <Share2 size={12} />
                                <span>Voucher</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Record Advance Deposit Modal ──────────────────────── */}
      {showAdvanceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Record Advance Deposit
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Credited directly to multi-sitting patient treatment ledger
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordAdvance}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Select Patient *
                </label>
                <select
                  className="input"
                  value={advancePatient}
                  onChange={(e) => setAdvancePatient(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  <option value="pat_aarav_101">Aarav Patel (Bridge Rehabilitation)</option>
                  <option value="pat_sneha_102">Sneha Kulkarni (Veneers Smile Design)</option>
                  <option value="pat_vikram_103">Vikram Malhotra (Molar Endocrown)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Advance Amount (₹) *
                </label>
                <input
                  type="number"
                  className="input"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Sitting / Allocation Notes
                </label>
                <input
                  type="text"
                  className="input"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdvanceModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Credit Patient Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Create Invoice Modal ─────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Generate GST Invoicing
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SAC 999312 • 18% Integrated GST</div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Select Registered Patient *
                </label>
                <select
                  className="input"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.full_name || pat.name} ({pat.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Invoice Line Items
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setLineItems([...lineItems, { description: '', amount: 0 }])}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    + Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lineItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Procedure description"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx].description = e.target.value;
                          setLineItems(updated);
                        }}
                        required
                        style={{ flex: 1, fontSize: '13px' }}
                      />
                      <input
                        type="number"
                        className="input"
                        placeholder="Amount (₹)"
                        value={item.amount || ''}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx].amount = parseFloat(e.target.value) || 0;
                          setLineItems(updated);
                        }}
                        required
                        style={{ width: '110px', fontSize: '13px' }}
                      />
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Calculations */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#64748b' }}>
                  <span>Subtotal:</span>
                  <span>₹{modalSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                  <span>GST (18% SAC 999312):</span>
                  <span>₹{modalGst.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px', color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                  <span>Total Payable:</span>
                  <span>₹{modalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingInvoice}
                >
                  {isSubmittingInvoice ? 'Generating Invoice...' : 'Generate & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── File Claim Modal ──────────────────────────────────── */}
      {showClaimModal && claimInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Direct NHCX Claim Filing
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>National Health Claims Exchange</div>
                </div>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Select Health Insurer / TPA *
                </label>
                <select
                  className="input"
                  value={claimPayer}
                  onChange={(e) => setClaimPayer(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  {COMMON_INSURERS.map((ins) => (
                    <option key={ins} value={ins}>
                      {ins}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Policy / TPA Reference Number *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. STAR-IND-9948271 or Member ID"
                  value={claimPolicyRef}
                  onChange={(e) => setClaimPolicyRef(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClaimModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingClaim}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{isSubmittingClaim ? 'Submitting to NHCX...' : 'Submit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Record Advance Deposit Modal ───────────────────────── */}
      {showAdvanceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Record Advance Patient Deposit
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Treatment Ledger Credit • Pre-Sitting Payment</div>
                </div>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordAdvance}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Select Patient *
                </label>
                <select
                  className="input"
                  value={advancePatient}
                  onChange={(e) => setAdvancePatient(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  {milestonesLedger.map((m) => (
                    <option key={m.patientId} value={m.patientId}>
                      {m.patientName} — {m.treatmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Deposit Amount (₹) *
                </label>
                <input
                  type="number"
                  className="input"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Ledger Notes / Payment Mode
                </label>
                <input
                  type="text"
                  className="input"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  placeholder="e.g. UPI / Card / Cash deposit for Sitting 1 & 2"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdvanceModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-deposit-btn"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0284c7' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Record Advance Deposit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Disburse Consultant Settlement Modal ──────────────── */}
      {showDisburseModal && activeDisburseCase && (
        <div
          id="disburse-settlement-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Disburse Specialist Commission
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Section 194J TDS Withholding & NEFT Bank Advice
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDisburseModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDisburseConsultant}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Specialist:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{activeDisburseCase.doctor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>PAN Number:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{activeDisburseCase.panNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Target Bank Account:</span>
                  <span style={{ fontWeight: 700 }}>{activeDisburseCase.bankAccount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#64748b' }}>
                  <span>Gross Share ({activeDisburseCase.agreedSplit}):</span>
                  <span>₹{activeDisburseCase.grossConsultantFee.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#d97706', fontWeight: 600 }}>
                  <span>Less: Section 194J TDS (10%):</span>
                  <span>- ₹{activeDisburseCase.tdsAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontWeight: 800, fontSize: '0.95rem', color: '#059669' }}>
                  <span>Net Payable to Doctor:</span>
                  <span>₹{activeDisburseCase.netDisbursable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Bank UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  id="utr-input"
                  className="input"
                  value={disburseUtr}
                  onChange={(e) => setDisburseUtr(e.target.value)}
                  placeholder="e.g. NEFT-HDFC-99124401"
                  required
                  style={{ width: '100%', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDisburseModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-disbursement-btn"
                  className="btn btn-primary"
                  style={{ background: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm NEFT Clearance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
