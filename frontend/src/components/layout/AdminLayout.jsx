import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Megaphone, 
  Menu,
  X
} from 'lucide-react';
import LogoutButton from '../auth/LogoutButton';
import logo from '../../assets/images/goldenbaylogo.svg'; 

const AdminLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/staff', label: 'Overview', icon: LayoutDashboard },
    { path: '/staff/bookings', label: 'Reservations', icon: CalendarDays },
    { path: '/staff/customers', label: 'Phone Book', icon: Users },
    { path: '/staff/marketing', label: 'Marketing', icon: Megaphone },
  ];

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
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group
                  ${isActive 
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
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="md:hidden text-gray-600 hover:text-gray-900 p-1 -ml-2"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                {location.pathname.split('/')[2] || 'Dashboard'}
              </h2>
           </div>
           <div className="flex items-center gap-3 md:gap-4">
              <span className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-widest">Admin</span>
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