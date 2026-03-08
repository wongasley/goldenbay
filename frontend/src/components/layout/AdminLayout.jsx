import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Megaphone, 
  Utensils,
  X,
  Gift,
  BarChart3
} from 'lucide-react';
import LogoutButton from '../auth/LogoutButton';
import logo from '../../assets/images/goldenbaylogo.svg'; 
import { getUserRole } from '../../utils/auth';

const AdminLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get current user role: 'Admin', 'Owner', 'Supervisor', 'Receptionist', 'Cashier'
  const role = getUserRole(); 

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ------------------------------------------------------------------
  // 1. REDIRECT LOGIC FOR THE BASE "/staff" URL
  // ------------------------------------------------------------------
  if (location.pathname === '/staff') {
    if (role === 'Owner') return <Navigate to="/staff/reports" replace />;
    if (role === 'Supervisor') return <Navigate to="/staff/bookings" replace />;
    if (role === 'Receptionist') return <Navigate to="/staff/bookings" replace />;
    if (role === 'Cashier') return <Navigate to="/staff/customers" replace />;
  }

  // ------------------------------------------------------------------
  // 2. STRICT ROUTE PROTECTION (Bouncer Logic)
  // Prevents users from manually typing a URL they don't have access to
  // ------------------------------------------------------------------
  if (role === 'Owner' && !location.pathname.startsWith('/staff/reports')) {
    return <Navigate to="/staff/reports" replace />;
  }

  if (role === 'Receptionist' && !location.pathname.startsWith('/staff/bookings')) {
    return <Navigate to="/staff/bookings" replace />;
  }

  if (role === 'Supervisor') {
    const allowed = ['/staff/bookings', '/staff/menu', '/staff/rewards'];
    const isAllowed = allowed.some(path => location.pathname.startsWith(path));
    if (!isAllowed) {
      return <Navigate to="/staff/bookings" replace />;
    }
  }

  if (role === 'Cashier' && !location.pathname.startsWith('/staff/customers')) {
    return <Navigate to="/staff/customers" replace />;
  }

  // ------------------------------------------------------------------
  // 3. SIDEBAR NAVIGATION FILTERING
  // ------------------------------------------------------------------
  const navItems = [
    { path: '/staff', label: 'Overview', icon: LayoutDashboard, show: role === 'Admin' },
    { path: '/staff/reports', label: 'Analytics', icon: BarChart3, show: ['Admin', 'Owner'].includes(role) },
    { path: '/staff/bookings', label: 'Reservations', icon: CalendarDays, show: ['Admin', 'Supervisor', 'Receptionist'].includes(role) },
    { path: '/staff/menu', label: 'Menu Manager', icon: Utensils, show: ['Admin', 'Supervisor'].includes(role) },
    { path: '/staff/rewards', label: 'Fulfillment', icon: Gift, show: ['Admin', 'Supervisor'].includes(role) },
    { path: '/staff/customers', label: role === 'Cashier' ? 'Points Terminal' : 'Phone Book', icon: Users, show: ['Admin', 'Cashier'].includes(role) },
    { path: '/staff/marketing', label: 'Marketing', icon: Megaphone, show: role === 'Admin' },
  ].filter(item => item.show);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR (Responsive) */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 flex flex-col w-64 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        
        {/* Logo Area */}
        <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-gray-100">
             <img src={logo} alt="Golden Bay" className="h-10 w-auto opacity-100" />
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-900">
               <X size={20} />
             </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Management</p>
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group
                  ${isActive && location.pathname !== '/staff' || (isActive && item.path === '/staff')
                    ? 'bg-gold-50 text-gold-700 shadow-sm border border-gold-200/50' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon size={18} className={isActive ? 'text-gold-600' : 'text-gray-400 group-hover:text-gray-600'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100">
           <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-50">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 z-10 flex justify-between items-center shadow-sm shrink-0">
           {/* Mobile menu trigger */}
           <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
           </button>
           <div className="hidden md:block"></div> {/* Spacer for desktop */}
           
           <div className="flex items-center gap-3 md:gap-4">
              {/* Display the actual role */}
              <span className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-widest">{role}</span>
              <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 font-bold text-xs border border-gold-200">
                 GB
              </div>
           </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           <div className="max-w-7xl mx-auto">
             <Outlet />
           </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;