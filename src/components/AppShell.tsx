'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BadgeDollarSign,
  ShieldAlert,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Stethoscope,
  ImageIcon,
  FileText,
  Landmark,
  Package,
  FlaskConical,
  Bell,
  BarChart3,
  ChevronDown,
} from 'lucide-react';

/**
 * Session Context — makes the user session available to all child components
 */
interface UserSession {
  id: string;
  tenantId: string;
  branchIds: string[];
  email: string;
  name: string;
  role: 'dentist' | 'staff' | 'admin' | 'owner';
  hprId?: string;
}

interface SessionContextType {
  user: UserSession | null;
  activeBranch: string;
  setActiveBranch: (branchId: string) => void;
  branches: Array<{ id: string; name: string }>;
  refetchUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  activeBranch: '',
  setActiveBranch: () => {},
  branches: [],
  refetchUser: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [activeBranch, setActiveBranch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If on login, presentation, or public patient plan page, render without standard sidebar
  const isPresentation = pathname?.includes('/presentation');
  const isLogin = pathname === '/login';
  const isPublicPlan = pathname?.startsWith('/plan');

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // Set initial active branch
        if (data.user.branchIds && data.user.branchIds.length > 0) {
          const firstBranch = data.user.branchIds[0] === '*' ? '' : data.user.branchIds[0];
          setActiveBranch(firstBranch);
        }
      } else {
        // Fallback demo user
        setUser({
          id: 'usr_dentist_1',
          tenantId: 'tenant_apex',
          branchIds: ['br_koramangala'],
          name: 'Dr. Rajesh Sharma, MDS',
          email: 'dr.sharma@apexdental.in',
          role: 'dentist',
        });
        setActiveBranch('br_koramangala');
      }
    } catch {
      setUser({
        id: 'usr_dentist_1',
        tenantId: 'tenant_apex',
        branchIds: ['br_koramangala'],
        name: 'Dr. Rajesh Sharma, MDS',
        email: 'dr.sharma@apexdental.in',
        role: 'dentist',
      });
      setActiveBranch('br_koramangala');
    }
  };

  // Fetch branch list
  useEffect(() => {
    // Simple approach — hardcoded for now, will be fetched from API
    setBranches([
      { id: 'br_koramangala', name: 'Koramangala' },
      { id: 'br_indiranagar', name: 'Indiranagar' },
    ]);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isPresentation || isLogin || isPublicPlan) {
    return (
      <SessionContext.Provider
        value={{
          user,
          activeBranch,
          setActiveBranch,
          branches,
          refetchUser: fetchCurrentUser,
        }}
      >
        <main>{children}</main>
      </SessionContext.Provider>
    );
  }

  // ─── Navigation by role ──────────────────────────────────
  // ─── Grouped Navigation Structure ───────────────────────────
  const navSections = [
    {
      title: 'Clinical Practice',
      items: [
        { href: '/', label: 'Clinic Overview', icon: LayoutDashboard, roles: ['dentist', 'staff', 'admin', 'owner'] },
        { href: '/patients', label: 'Patients & Charts', icon: Users, roles: ['dentist', 'staff', 'admin', 'owner'] },
        { href: '/imaging', label: 'Imaging & AI Suite', icon: ImageIcon, badge: 'AI', roles: ['dentist', 'staff', 'admin', 'owner'] },
        { href: '/lab-cases', label: 'Lab Cases Kanban', icon: FlaskConical, roles: ['dentist', 'staff', 'admin', 'owner'] },
      ]
    },
    {
      title: 'Operations & Billing',
      items: [
        { href: '/billing', label: 'Billing & GST Invoices', icon: FileText, roles: ['dentist', 'staff', 'admin', 'owner'] },
        { href: '/insurance', label: 'Insurance Claims (NHCX)', icon: Landmark, roles: ['dentist', 'staff', 'admin', 'owner'] },
        { href: '/inventory', label: 'Clinical Inventory', icon: Package, roles: ['dentist', 'staff', 'admin', 'owner'] },
        { href: '/recall', label: 'Recall & Reminders', icon: Bell, roles: ['dentist', 'staff', 'admin', 'owner'] },
      ]
    },
    {
      title: 'Executive Management',
      items: [
        { href: '/analytics', label: 'Practice Analytics', icon: BarChart3, roles: ['dentist', 'admin', 'owner'] },
        { href: '/pricing', label: 'Procedures & Fees', icon: BadgeDollarSign, roles: ['admin', 'owner'] },
        { href: '/admin', label: 'Audit Logs & HPR', icon: ShieldAlert, roles: ['admin', 'owner'] },
      ]
    }
  ];

  return (
    <SessionContext.Provider
      value={{
        user,
        activeBranch,
        setActiveBranch,
        branches,
        refetchUser: fetchCurrentUser,
      }}
    >
      <div className="app-container">
        {/* Desktop Sidebar */}
        <aside className={`sidebar ${mounted && sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="brand-badge">
                <Stethoscope size={19} />
              </div>
              <div>
                <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>DentOS</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.04em' }}>PRO</span>
                </div>
                <div className="brand-sub">Clinical Suite v2.4</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)' }} title="System Online & Synced" />
            </div>
          </div>

          {/* Branch Selector Pill */}
          {user && (user.branchIds.includes('*') || user.branchIds.length > 1) && (
            <div style={{ padding: '0.75rem 0.85rem 0.35rem' }}>
              <div
                className="branch-selector"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(226, 232, 240, 0.95)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' }} />
                  <span style={{ letterSpacing: '-0.01em' }}>
                    {activeBranch
                      ? branches.find(b => b.id === activeBranch)?.name || activeBranch
                      : 'All Clinic Branches'}
                  </span>
                </div>
                <ChevronDown size={13} color="#64748b" style={{ transform: branchDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </div>
              {branchDropdownOpen && (
                <div
                  style={{
                    marginTop: '0.35rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#ffffff',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    overflow: 'hidden',
                    zIndex: 50,
                  }}
                >
                  {user.branchIds.includes('*') && (
                    <div
                      className="branch-option"
                      onClick={() => { setActiveBranch(''); setBranchDropdownOpen(false); }}
                      style={{
                        padding: '0.55rem 0.85rem',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: !activeBranch ? 700 : 500,
                        color: !activeBranch ? '#0284c7' : '#475569',
                        background: !activeBranch ? '#f0f9ff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>All Clinic Branches</span>
                      {!activeBranch && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0284c7' }} />}
                    </div>
                  )}
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="branch-option"
                      onClick={() => { setActiveBranch(b.id); setBranchDropdownOpen(false); }}
                      style={{
                        padding: '0.55rem 0.85rem',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: activeBranch === b.id ? 700 : 500,
                        color: activeBranch === b.id ? '#0284c7' : '#475569',
                        background: activeBranch === b.id ? '#f0f9ff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{b.name} Branch</span>
                      {activeBranch === b.id && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0284c7' }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <nav className="sidebar-nav">
            {navSections.map((sec) => {
              const visibleItems = sec.items.filter(
                (item) => !user?.role || item.roles.includes(user.role)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={sec.title} style={{ marginBottom: '0.65rem' }}>
                  <div className="nav-section-label">{sec.title}</div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon size={16} style={{ color: isActive ? '#0284c7' : '#64748b' }} />
                        <span style={{ fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="sidebar-footer" style={{ padding: '0.9rem 1rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0,
                boxShadow: '0 0 0 2px #ffffff, 0 0 0 3px rgba(14, 165, 233, 0.35)',
              }}>
                {(user?.name || 'Dr. Sharma').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }} className="truncate">
                  {user?.name || 'Dr. Rajesh Sharma'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {user?.role || 'dentist'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>• Online</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{ color: '#94a3b8', padding: '7px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Sticky Top Header */}
          <header className="top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  {activeBranch
                    ? branches.find(b => b.id === activeBranch)?.name || 'Apex Dental'
                    : 'Apex Dental Group'}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#065f46',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '2px 9px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)' }} />
                  Clinic Operatory Live
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <Link href="/patients" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', gap: '6px' }}>
                <PlusCircle size={15} />
                <span>Chart Patient</span>
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <div className="content-body">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          {[
            { href: '/', label: 'Overview', icon: LayoutDashboard },
            { href: '/patients', label: 'Patients', icon: Users },
            { href: '/imaging', label: 'Imaging', icon: ImageIcon },
            { href: '/billing', label: 'Billing', icon: FileText },
            { href: '/lab-cases', label: 'Labs', icon: FlaskConical },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </SessionContext.Provider>
  );
}
