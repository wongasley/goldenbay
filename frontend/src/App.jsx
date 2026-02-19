// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout'; // FIXED THIS LINE

// Public Pages
import HomePage from './pages/public/home/HomePage';
import MenuPage from './pages/public/menu/MenuPage';
import ReservationPage from './pages/public/reservations/ReservationPage';
import AboutPage from './pages/public/about/AboutPage'; 
import LoginPage from './pages/admin/auth/LoginPage'; // FIXED THIS LINE
import NewsPage from './pages/public/marketing/NewsPage';
import SinglePostPage from './pages/public/marketing/SinglePostPage';
import EventInquiriesPage from './pages/public/events/EventInquiriesPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage'; // FIXED THIS LINE
import BookingManager from './pages/admin/bookings/BookingManager'; // FIXED THIS LINE
import MarketingManager from './pages/admin/marketing/MarketingManager'; // FIXED THIS LINE
import PostEditor from './pages/admin/marketing/PostEditor'; // FIXED THIS LINE
import PhoneBookPage from './pages/admin/customers/PhoneBookPage'; // FIXED THIS LINE

import ProtectedRoute from './components/layout/ProtectedRoute';
import VIPRoomsPage from './pages/public/vip/VIPRoomsPage';

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen font-sans bg-gray-50 text-gray-900">
        
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#0a0a0a',
              color: '#ffffff',
              border: '1px solid #D4AF37',
              borderRadius: '4px',
              fontSize: '14px',
              letterSpacing: '0.05em',
              fontFamily: 'Quicksand, sans-serif'
            },
            success: {
              iconTheme: { primary: '#D4AF37', secondary: '#0a0a0a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />

        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<><Navbar /><HomePage /></>} />
          <Route path="/menu" element={<><Navbar /><MenuPage /><Footer /></>} />
          <Route path="/reservations" element={<><Navbar /><ReservationPage /><Footer /></>} />
          <Route path="/events" element={<><Navbar /><EventInquiriesPage /><Footer /></>} />
          <Route path="/about" element={<><Navbar /><AboutPage /><Footer /></>} />
          <Route path="/news" element={<><Navbar /><NewsPage /><Footer /></>} />
          <Route path="/news/:slug" element={<><Navbar /><SinglePostPage /><Footer /></>} />
          <Route path="/promotions" element={<><Navbar /><NewsPage /><Footer /></>} />
          <Route path="/vip-rooms" element={<><Navbar /><VIPRoomsPage /><Footer /></>} />
          
          <Route path="/login" element={<LoginPage />} />

          {/* --- ADMIN ROUTES (NESTED) - NOW ACCESSED VIA /staff --- */}
          <Route path="/staff" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboardPage />} />
            <Route path="bookings" element={<BookingManager />} />
            <Route path="customers" element={<PhoneBookPage />} />
            <Route path="marketing" element={<MarketingManager />} />
            <Route path="marketing/create" element={<PostEditor />} />
            <Route path="marketing/edit/:id" element={<PostEditor />} />
          </Route>
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;