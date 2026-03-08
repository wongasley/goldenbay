import React, { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ScrollToTop from './components/layout/ScrollToTop';
import FloatingWidget from './components/layout/FloatingWidget'; 
import { LanguageProvider } from './context/LanguageContext';
import PixelTracker from './components/layout/PixelTracker';
import LeadCaptureWidget from './components/marketing/LeadCaptureWidget';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

// --- LAZY LOAD PUBLIC PAGES ---
const HomePage = lazy(() => import('./pages/public/home/HomePage'));
const MenuPage = lazy(() => import('./pages/public/menu/MenuPage'));
const ReservationPage = lazy(() => import('./pages/public/reservations/ReservationPage'));
const ManageBookingPage = lazy(() => import('./pages/public/reservations/ManageBookingPage')); // ADDED
const AboutPage = lazy(() => import('./pages/public/about/AboutPage')); 
const ContactPage = lazy(() => import('./pages/public/contact/ContactPage'));
const NewsPage = lazy(() => import('./pages/public/marketing/NewsPage'));
const SinglePostPage = lazy(() => import('./pages/public/marketing/SinglePostPage'));
const EventInquiriesPage = lazy(() => import('./pages/public/events/EventInquiriesPage'));
const VIPRoomsPage = lazy(() => import('./pages/public/vip/VIPRoomsPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const CustomerRewardsPage = lazy(() => import('./pages/public/marketing/CustomerRewardsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/about/PrivacyPolicyPage'));

// --- LAZY LOAD ADMIN PAGES ---
const LoginPage = lazy(() => import('./pages/admin/auth/LoginPage')); 
const AdminLayout = lazy(() => import('./components/layout/AdminLayout')); 
const AdminDashboardPage = lazy(() => import('./pages/admin/dashboard/AdminDashboardPage')); 
const BookingManager = lazy(() => import('./pages/admin/bookings/BookingManager')); 
const MarketingManager = lazy(() => import('./pages/admin/marketing/MarketingManager')); 
const PostEditor = lazy(() => import('./pages/admin/marketing/PostEditor')); 
const PhoneBookPage = lazy(() => import('./pages/admin/customers/PhoneBookPage')); 
const CampaignBuilder = lazy(() => import('./pages/admin/marketing/CampaignBuilder'));
const MenuManager = lazy(() => import('./pages/admin/menu/MenuManager'));
const RewardsManager = lazy(() => import('./pages/admin/customers/RewardsManager'));
const OwnerDashboardPage = lazy(() => import('./pages/admin/dashboard/OwnerDashboardPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-cream-50 flex items-center justify-center text-gold-600 font-serif tracking-widest uppercase animate-pulse">
    Loading Golden Bay...
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
    <Router>
      <ScrollToTop />
      <PixelTracker />
      <div className="w-full min-h-screen font-sans bg-gray-50 text-gray-900 relative">
        
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
            success: { iconTheme: { primary: '#D4AF37', secondary: '#0a0a0a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />

        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* --- PUBLIC ROUTES --- */}
              <Route path="/" element={<><Navbar /><HomePage /></>} />
              <Route path="/menu" element={<><Navbar /><MenuPage /><Footer /></>} />
              <Route path="/reservations" element={<><Navbar /><ReservationPage /><Footer /></>} />
              <Route path="/manage-booking/:token" element={<><Navbar /><ManageBookingPage /><Footer /></>} /> {/* ADDED */}
              <Route path="/events" element={<><Navbar /><EventInquiriesPage /><Footer /></>} />
              <Route path="/about" element={<><Navbar /><AboutPage /><Footer /></>} />
              <Route path="/news" element={<><Navbar /><NewsPage /><Footer /></>} />
              <Route path="/news/:slug" element={<><Navbar /><SinglePostPage /><Footer /></>} />
              <Route path="/promotions" element={<><Navbar /><NewsPage /><Footer /></>} />
              <Route path="/vip-rooms" element={<><Navbar /><VIPRoomsPage /><Footer /></>} />
              <Route path="/contact" element={<><Navbar /><ContactPage /><Footer /></>} />
              <Route path="*" element={<><Navbar /><NotFoundPage /><Footer /></>} />
              <Route path="/rewards" element={<CustomerRewardsPage />} />
              <Route path="/privacy" element={<><Navbar /><PrivacyPolicyPage /><Footer /></>} />
              
              <Route path="/login" element={<LoginPage />} />

              {/* --- ADMIN ROUTES --- */}
              <Route path="/staff" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="bookings" element={<BookingManager />} />
                <Route path="customers" element={<PhoneBookPage />} />
                <Route path="marketing" element={<MarketingManager />} />
                <Route path="marketing/create" element={<PostEditor />} />
                <Route path="marketing/edit/:id" element={<PostEditor />} />
                <Route path="marketing/blast" element={<CampaignBuilder />} />
                <Route path="menu" element={<MenuManager />} />
                <Route path="rewards" element={<RewardsManager />} />
                <Route path="reports" element={<OwnerDashboardPage />} />
              </Route>
              
            </Routes>
          </Suspense>
        </ErrorBoundary>

        <FloatingWidget />
        <LeadCaptureWidget />

      </div>
    </Router>
    </GoogleReCaptchaProvider>
    </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;