import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Megaphone, 
  LogOut
} from 'lucide-react';
import LogoutButton from '../auth/LogoutButton';
import logo from '../../assets/images/goldenbaylogo.svg'; 

const AdminLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/bookings', label: 'Reservations', icon: CalendarDays },
    { path: '/admin/customers', label: 'Phone Book', icon: Users },
    { path: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  ];

  return (
    // FIX: Ensure this is bg-gray-50 (Light) not dark.
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100">
             {/* Ensure logo is visible on white background */}
             <img src={logo} alt="Golden Bay" className="h-12 w-auto opacity-100" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto">
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
      <main className="flex-1 overflow-y-auto relative bg-gray-50">
        {/* Top Header (Contextual) */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 z-10 flex justify-between items-center">
           <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {location.pathname.split('/')[2] || 'Dashboard'}
              </h2>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-500">Admin Session</span>
              <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 font-bold text-xs border border-gold-200">
                 GB
              </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;