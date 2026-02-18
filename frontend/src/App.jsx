// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import HomePage from './pages/public/home/HomePage';
import MenuPage from './pages/public/menu/MenuPage';
import ReservationPage from './pages/public/reservations/ReservationPage';
import AboutPage from './pages/public/about/AboutPage'; // <--- IMPORT THIS
import LoginPage from './pages/admin/auth/LoginPage';
import NewsPage from './pages/public/marketing/NewsPage';
import SinglePostPage from './pages/public/marketing/SinglePostPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/dashboard/AdminDashboardPage';
import BookingManager from './pages/admin/bookings/BookingManager';
import MarketingManager from './pages/admin/marketing/MarketingManager';
import PostEditor from './pages/admin/marketing/PostEditor';
import PhoneBookPage from './pages/admin/customers/PhoneBookPage';

import ProtectedRoute from './components/layout/ProtectedRoute';
import VIPRoomsPage from './pages/public/vip/VIPRoomsPage';

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen font-sans bg-gray-50 text-gray-900">
        
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<><Navbar /><HomePage /></>} />
          <Route path="/menu" element={<><Navbar /><MenuPage /><Footer /></>} />
          <Route path="/reservations" element={<><Navbar /><ReservationPage /><Footer /></>} />
          <Route path="/about" element={<><Navbar /><AboutPage /><Footer /></>} /> {/* <--- ADDED ROUTE */}
          <Route path="/news" element={<><Navbar /><NewsPage /><Footer /></>} />
          <Route path="/news/:slug" element={<><Navbar /><SinglePostPage /><Footer /></>} />
          <Route path="/promotions" element={<><Navbar /><NewsPage /><Footer /></>} />
          <Route path="/vip-rooms" element={<><Navbar /><VIPRoomsPage /><Footer /></>} />
          
          <Route path="/login" element={<LoginPage />} />

          {/* --- ADMIN ROUTES (NESTED) --- */}
          <Route path="/admin" element={
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