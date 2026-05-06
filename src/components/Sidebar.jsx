// =============================================================
// FILE: Sidebar.jsx
// PURPOSE: Navigation sidebar shown on every role's dashboard.
//          Now uses useAuth() (Supabase) instead of localStorage
//          for user profile and sign-out.
//          Fetches hospital name/logo from Supabase system_config table.
// =============================================================

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, Users, Settings, UserCircle, Pill, FlaskConical, FileText,
    CheckCircle, ChevronRight, Globe, Menu, ChevronLeft, UserPlus, ListOrdered,
    Printer, CalendarRange, Stethoscope, LayoutDashboard, Package, Activity,
    DollarSign, Microscope, Tag, ShoppingCart, Truck, ShoppingBag, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Sidebar = ({ userType }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get the logged-in user and their profile from AuthContext
    const { profile, signOut } = useAuth();

    // Hospital branding fetched from Supabase system_config
    const [hospitalConfig, setHospitalConfig] = React.useState({ name: 'eDoc Hospital', logo: '' });
    const [expandedMenu, setExpandedMenu] = React.useState(null);
    const [isCollapsed, setIsCollapsed] = React.useState(window.innerWidth < 1200);
    const [showMobile, setShowMobile] = React.useState(false);

    const sidebarRef = React.useRef(null);

    React.useEffect(() => {
        // Fetch hospital name and logo from system_config table
        supabase
            .from('system_config')
            .select('key, value')
            .in('key', ['hospital_name', 'hospital_logo'])
            .then(({ data }) => {
                if (!data) return;
                const config = Object.fromEntries(data.map(r => [r.key, r.value]));
                setHospitalConfig({
                    name: config.hospital_name || 'eDoc Hospital',
                    logo: config.hospital_logo || '',
                });
            });

        // Close submenus when clicking outside
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setExpandedMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sign out via Supabase Auth (AuthContext handles redirect)
    const handleLogout = () => signOut();

    // Helper: get the display name from whichever staff table profile we have
    const displayName = profile
        ? (profile.docname || profile.regname || profile.labname || profile.phname || profile.aname || 'User')
        : 'Loading…';

    const displayEmail = profile
        ? (profile.docemail || profile.regemail || profile.labemail || profile.phemail || profile.aemail || '')
        : '';

    // Helper: get photo from profile (whichever field is populated)
    const displayPhoto = profile
        ? (profile.docphoto || profile.regphoto || profile.labphoto || profile.phphoto || null)
        : null;

    // Navigation items per role
    const navItems = {
        r: [
            { name: 'Dashboard',           icon: Home,         path: '/registrar' },
            { name: 'Patient Registration',icon: UserPlus,     path: '/registrar/new-patient' },
            { name: 'Patient Directory',   icon: Users,        path: '/registrar/patients' },
            { name: 'Patient History',     icon: ListOrdered,  path: '/registrar/history' },
            { name: 'Printing',            icon: Printer,      path: '/registrar/print' },
            { name: 'Settings',            icon: Settings,     path: '/registrar/settings' },
        ],
        d: [
            { name: 'Dashboard',           icon: Home,         path: '/doctor' },
            { name: 'Appointments / Queue',icon: CalendarRange,path: '/doctor/appointments' },
            { name: 'Patients',            icon: Users,        path: '/doctor/patients' },
            { name: 'Consultation',        icon: Stethoscope,  path: '/doctor/consultation' },
            {
                name: 'Lab Requests',
                icon: FlaskConical,
                path: '/doctor/labs',
                subItems: [
                    { name: 'Pending Labs',    path: '/doctor/labs?status=pending' },
                    { name: 'Ready Results',   path: '/doctor/labs?status=ready' }
                ]
            },
            { name: 'Reports',             icon: FileText,     path: '/doctor/reports' },
            { name: 'Settings',            icon: Settings,     path: '/doctor/settings' },
        ],
        a: [
            { name: 'Dashboard',           icon: LayoutDashboard, path: '/admin' },
            { name: 'Staff Management',    icon: Users,           path: '/admin/staff' },
            { name: 'Master Catalog',      icon: Package,         path: '/admin/master-catalog' },
            { name: 'Treatment Bundles',   icon: Activity,        path: '/admin/bundles' },
            { name: 'Financial Logs',      icon: DollarSign,      path: '/admin/financials' },
            { name: 'System Settings',     icon: Settings,        path: '/admin/settings' },
        ],
        l: [
            { name: 'Dashboard',           icon: Home,         path: '/lab' },
            { name: 'Lab Workbench',       icon: Microscope,   path: '/lab/workbench' },
            { name: 'Completed Results',   icon: CheckCircle,  path: '/lab/results' },
            { name: 'Test Catalog',        icon: Tag,          path: '/lab/catalog' },
            { name: 'Inventory',           icon: Package,      path: '/lab/inventory' },
            { name: 'Settings',            icon: Settings,     path: '/lab/settings' },
        ],
        ph: [
            { name: 'Dashboard',           icon: Home,         path: '/pharmacy' },
            { name: 'Workbench',           icon: ShoppingCart, path: '/pharmacy/workbench' },
            { name: 'Inventory',           icon: Package,      path: '/pharmacy/inventory' },
            { name: 'Medicine Status',     icon: Activity,     path: '/pharmacy/status' },
            { name: 'Procurement',         icon: Truck,        path: '/pharmacy/procurement' },
            { name: 'Suppliers',           icon: Users,        path: '/pharmacy/suppliers' },
            { name: 'Sales Log',           icon: ShoppingBag,  path: '/pharmacy/sales' },
            { name: 'Settings',            icon: Settings,     path: '/pharmacy/settings' },
        ]
    };

    const items = navItems[userType] || [];

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobile = () => setShowMobile(!showMobile);

    return (
        <>
        {/* Mobile Toggle Button */}
        <button 
            onClick={toggleMobile}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#007bff',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 1000,
                display: window.innerWidth < 768 ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
            }}
        >
            <Menu size={24} />
        </button>

        <aside ref={sidebarRef} style={{
            width: isCollapsed ? '80px' : '260px',
            background: '#ffffff',
            borderRight: '1px solid #dee2e6',
            height: '100vh',
            display: (window.innerWidth < 768 && !showMobile) ? 'none' : 'flex',
            flexDirection: 'column',
            position: window.innerWidth < 768 ? 'fixed' : 'sticky',
            top: 0,
            left: 0,
            zIndex: 1100,
            transition: 'width 0.3s ease, transform 0.3s ease',
            boxShadow: window.innerWidth < 768 ? '0 0 20px rgba(0,0,0,0.1)' : 'none'
        }}>
            {/* Collapse Toggle (Desktop) */}
            <button 
                onClick={toggleSidebar}
                style={{
                    position: 'absolute',
                    right: '-12px',
                    top: '32px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    display: window.innerWidth < 768 ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10
                }}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            {/* Hospital Branding Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{ minWidth: '40px', width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {hospitalConfig.logo ? (
                        <img src={hospitalConfig.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Globe size={24} color="white" />
                    )}
                </div>
                {!isCollapsed && (
                    <div style={{ whiteSpace: 'nowrap' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                            {hospitalConfig.name}
                        </h2>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Medical Terminal
                        </span>
                    </div>
                )}
            </div>

            {/* Profile Block */}
            <div style={{ padding: '32px 24px', textAlign: 'center', borderBottom: '1px solid #f8f9fa' }}>
                <div style={{
                    width: isCollapsed ? '40px' : '100px', height: isCollapsed ? '40px' : '100px', borderRadius: '50%',
                    background: '#f8f9fa', margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isCollapsed ? '2px solid #f1f5f9' : '4px solid #f1f5f9', overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s'
                }}>
                    {displayPhoto ? (
                        <img src={displayPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <UserCircle size={isCollapsed ? 30 : 80} color="#cbd5e1" strokeWidth={1} />
                    )}
                </div>

                {!isCollapsed && (
                    <>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                            {displayName}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px', fontWeight: '500' }}>
                            {displayEmail}
                        </p>
                    </>
                )}

                {/* Logout — calls Supabase signOut via AuthContext */}
                <button
                    id="sidebar-logout-btn"
                    onClick={handleLogout}
                    style={{
                        width: '100%', padding: isCollapsed ? '10px 0' : '10px',
                        background: '#f1f5f9', color: '#1e293b',
                        border: '1px solid #e2e8f0', borderRadius: '10px',
                        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isCollapsed ? '0' : '8px',
                        transition: '0.2s'
                    }}
                    title={isCollapsed ? "Log out" : ""}
                >
                    <LogOut size={16} /> {!isCollapsed && "Log out"}
                </button>
            </div>

            {/* Navigation List */}
            <nav style={{ padding: '20px 0', flex: 1, overflowY: 'auto' }}>
                {items.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.subItems && item.subItems.some(sub => location.pathname + location.search === sub.path));
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isExpanded = expandedMenu === item.name;

                    return (
                        <div key={item.name}>
                            <div
                                onClick={() => {
                                    if (hasSubItems) {
                                        setExpandedMenu(isExpanded ? null : item.name);
                                    } else {
                                        navigate(item.path);
                                    }
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '15px 30px', cursor: 'pointer',
                                    color: isActive ? '#007bff' : '#6c757d',
                                    background: isActive && !hasSubItems ? '#f8f9fa' : 'transparent',
                                    borderRight: isActive && !hasSubItems ? '4px solid #007bff' : '4px solid transparent',
                                    fontWeight: isActive ? '700' : '500',
                                    fontSize: '0.9rem', transition: '0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <item.icon size={20} style={{ minWidth: '20px' }} />
                                    {!isCollapsed && <span>{item.name}</span>}
                                </div>
                                {hasSubItems && !isCollapsed && (
                                    <ChevronRight size={16} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                                )}
                            </div>

                            {hasSubItems && isExpanded && (
                                <div style={{ background: '#f8fafc', padding: '5px 0' }}>
                                    {item.subItems.map(sub => {
                                        const subActive = location.pathname + location.search === sub.path;
                                        return (
                                            <Link
                                                key={sub.name}
                                                to={sub.path}
                                                onClick={() => setExpandedMenu(null)}
                                                style={{
                                                    display: 'flex', alignItems: 'center',
                                                    padding: '12px 30px 12px 65px',
                                                    textDecoration: 'none',
                                                    color: subActive ? '#007bff' : '#64748b',
                                                    fontSize: '0.85rem',
                                                    fontWeight: subActive ? '700' : '500',
                                                    borderRight: subActive ? '4px solid #007bff' : 'none',
                                                    transition: '0.2s'
                                                }}
                                            >
                                                {sub.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div style={{ padding: '20px', fontSize: '0.75rem', color: '#adb5bd', textAlign: 'center', borderTop: '1px solid #f8f9fa' }}>
                {isCollapsed ? "LX" : "Powered by lumiaxy System"}
            </div>
        </aside>
        
        {/* Mobile Overlay */}
        {showMobile && window.innerWidth < 768 && (
            <div 
                onClick={toggleMobile}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1050
                }}
            />
        )}
        </>
    );
};

export default Sidebar;
