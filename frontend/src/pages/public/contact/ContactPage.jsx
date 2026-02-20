import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

// Using the exterior image for the location page
import exteriorImg from '../../../assets/images/golden_bay_cover.webp'; 

const ContactPage = () => {
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans">
      
      {/* --- HERO BANNER --- */}
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={exteriorImg} className="w-full h-full object-cover" alt="Golden Bay Exterior" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center">
          <Link to="/" className="text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block">← Back to Experience</Link>
          <h1 className="text-5xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md">Location & Contact</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* LEFT COLUMN: Contact Info */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col justify-center space-y-12">
          
          <div>
            <h2 className="text-4xl font-serif text-gray-900 mb-6">Get in Touch</h2>
            <p className="text-gray-500 text-base md:text-lg leading-relaxed">
              Whether you have a question about our menu, need assistance finding us, or wish to inquire about corporate partnerships, our team is at your service.
            </p>
          </div>

          <div className="space-y-10">
            {/* Address */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <MapPin size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2">Address</h4>
                <p className="text-gray-500 text-base md:text-lg leading-relaxed">
                  Lot 3&4 Block A2, CBP, <br />
                  Diosdado Macapagal Blvd, <br />
                  Pasay City, Metro Manila, Philippines
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <Phone size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2">Reservations & Inquiries</h4>
                <p className="text-gray-500 text-base md:text-lg leading-relaxed">(02) 8804-0332</p>
                <p className="text-gray-500 text-base md:text-lg leading-relaxed">+63 917 580 7166 (Viber / WhatsApp)</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <Mail size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2">Email</h4>
                <p className="text-gray-500 text-base md:text-lg leading-relaxed">goldenbay.marketing@gmail.com</p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2">Operating Hours</h4>
                <p className="text-gray-500 text-base md:text-lg leading-relaxed"><span className="font-medium text-gray-700">Lunch:</span> 11:00 AM – 2:30 PM</p>
                <p className="text-gray-500 text-base md:text-lg leading-relaxed"><span className="font-medium text-gray-700">Dinner:</span> 5:00 PM – 9:30 PM</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Google Map */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="w-full h-[500px] lg:h-full min-h-[500px] bg-gray-200 border border-gray-200 rounded-sm overflow-hidden shadow-lg p-2">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.884178667683!2d120.9859553!3d14.5429188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397cb2475659837%3A0x6a2c2628fb656db0!2sGolden%20Bay%20Fresh%20Seafoods%20Restaurant!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Golden Bay Map"
          ></iframe>
        </motion.div>

      </div>
    </div>
  );
};

export default ContactPage;