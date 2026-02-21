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
        <div className="relative z-10 text-center px-4">
          <Link to="/" className="text-[10px] md:text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block">← Back to Experience</Link>
          {/* Adjusted from text-5xl to text-3xl/4xl */}
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest uppercase text-white drop-shadow-md">Location & Contact</h1>
          <div className="h-[1px] w-16 md:w-24 bg-gold-400 mt-6 md:mt-8 mx-auto"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* LEFT COLUMN: Contact Info */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col justify-center space-y-10">
          
          <div>
            {/* Adjusted from text-4xl to text-2xl/3xl */}
            <h2 className="text-2xl md:text-3xl font-serif text-gray-900 mb-4">Get in Touch</h2>
            {/* Adjusted from text-lg to text-sm/base */}
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              Whether you have a question about our menu, need assistance finding us, or wish to inquire about corporate partnerships, our team is at your service.
            </p>
          </div>

          <div className="space-y-8">
            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5">Address</h4>
                {/* Adjusted from text-base/lg to text-sm */}
                <p className="text-gray-500 text-sm leading-relaxed">
                  Lot 3&4 Block A2, CBP, <br />
                  Diosdado Macapagal Blvd, <br />
                  Pasay City, Metro Manila, Philippines
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5">Reservations & Inquiries</h4>
                <p className="text-gray-500 text-sm leading-relaxed">(02) 8804-0332</p>
                <p className="text-gray-500 text-sm leading-relaxed">+63 917 580 7166 (Viber / WhatsApp)</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5">Email</h4>
                <p className="text-gray-500 text-sm leading-relaxed">marketing@goldenbay.com.ph</p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5">Operating Hours</h4>
                <p className="text-gray-500 text-sm leading-relaxed"><span className="font-medium text-gray-700">Lunch:</span> 11:00 AM – 2:30 PM</p>
                <p className="text-gray-500 text-sm leading-relaxed"><span className="font-medium text-gray-700">Dinner:</span> 5:00 PM – 9:30 PM</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Google Map */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="w-full h-[400px] lg:h-full min-h-[400px] bg-gray-200 border border-gray-200 rounded-sm overflow-hidden shadow-lg p-1.5">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3862.161342953903!2d120.9899011!3d14.5327621!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c95666ea03b3%3A0xd54670ba0bd98353!2sGolden%20Bay%20Fresh%20Seafoods%20Restaurant!5e0!3m2!1sen!2sph!4v1771614810044!5m2!1sen!2sph" 
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