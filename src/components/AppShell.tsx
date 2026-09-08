'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BadgeDollarSign,
  ShieldAlert,
  LogOut,
  Activity,
  PlusCircle,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If on login or presentation page, render without standard sidebar
  const isPresentation = pathname?.includes('/presentation');
  const isLogin = pathname === '/login';

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        // Fallback default demo user for frictionless testing
        setUser({
          id: 'usr_dentist_1',
          name: 'Dr. Rajesh Sharma, MDS',
          email: 'dr.sharma@dentchart.com',
          role: 'dentist',
        });
      }
    } catch {
      setUser({
        id: 'usr_dentist_1',
        name: 'Dr. Rajesh Sharma, MDS',
        email: 'dr.sharma@dentchart.com',
        role: 'dentist',
      });
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isPresentation || isLogin) {
    return <main>{children}</main>;
  }

  const navItems = [
    { href: '/', label: 'Clinic Overview', icon: LayoutDashboard },
    { href: '/patients', label: 'Patients & Charts', icon: Users },
    { href: '/pricing', label: 'Procedures & Fees', icon: BadgeDollarSign },
    { href: '/admin', label: 'Practice Audit Logs', icon: ShieldAlert },
  ];

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <Stethoscope size={18} />
          </div>
          <div>
            <div className="brand-title">DentChart 3D</div>
            <div className="brand-sub">Clinical Suite</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }} className="truncate">
              {user?.name || 'Dr. Rajesh Sharma'}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
              {user?.role || 'dentist'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{ color: '#94a3b8', padding: '6px' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'none' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              Apex Dental Care & Implant Center
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/patients" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              <PlusCircle size={14} />
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
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
