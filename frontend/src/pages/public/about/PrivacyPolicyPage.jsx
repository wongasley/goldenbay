import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 pt-32 pb-20 px-6 md:px-24 font-sans">
      <Helmet>
        <title>Privacy Policy | Golden Bay</title>
      </Helmet>

      <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 shadow-xl border border-gray-200">
        <Link to="/" className="inline-flex items-center text-gold-600 hover:text-black mb-8 transition-colors text-xs uppercase tracking-widest font-bold">
            <ArrowLeft size={14} className="mr-2" /> Return Home
        </Link>
        
        <h1 className="text-4xl font-serif text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last Updated: March 2026</p>

        <div className="prose max-w-none text-gray-600 space-y-6 text-sm leading-relaxed">
            <p>
                Golden Bay Fresh Seafood Restaurant ("we", "our", or "us") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website, mobile application, or in-restaurant digital services.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-2">1. Information We Collect</h3>
            <p>We only collect information necessary to provide our dining and reservation services. This includes:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Contact Information:</strong> Your name, phone number, and email address when you make a reservation, join our VIP guest list, or log into the Rewards app.</li>
                <li><strong>Account Data:</strong> Your date of birth (optional) for birthday promotions, and your dining history (visit count and points balance) to facilitate our Golden Rewards program.</li>
                <li><strong>Reservation Details:</strong> Special requests, dining preferences, and party sizes provided during the booking process.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-2">2. How We Use Your Information</h3>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>To confirm and manage your table reservations.</li>
                <li>To send OTP (One-Time Password) SMS messages for secure app login.</li>
                <li>To administer the Golden Rewards program, track your points, and process redemptions.</li>
                <li>To send important service updates, such as booking confirmations or cancellations.</li>
                <li>To occasionally send promotional offers or birthday rewards (you may opt-out of marketing communications at any time).</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-2">3. Data Sharing & Security</h3>
            <p>
                We do not sell, rent, or trade your personal information to third parties. Your data is stored securely on our private servers. We only share necessary data with trusted service providers (such as SMS gateways to send your login codes) strictly for operational purposes.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-2">4. Your Rights & Account Deletion</h3>
            <p>
                You have the right to access, correct, or request the deletion of your personal data at any time. If you wish to delete your account, remove your phone number from our system, or opt-out of SMS notifications, please contact us using the details below. Upon your request, your profile and points balance will be permanently erased from our active database.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-2">5. Contact Us</h3>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
            <ul className="list-none space-y-1">
                <li><strong>Email:</strong> marketing@goldenbay.com.ph</li>
                <li><strong>Phone:</strong> (02) 8804-0332 / +63 917 580 7166</li>
                <li><strong>Address:</strong> Lot 3&4 Block A2, Diosdado Macapagal Blvd, Pasay City, Metro Manila</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;