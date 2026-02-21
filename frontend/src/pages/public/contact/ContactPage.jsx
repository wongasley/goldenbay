import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import exteriorImg from '../../../assets/images/golden_bay_cover.webp'; 
import { useLanguage } from '../../../context/LanguageContext';

const ContactPage = () => {
  const { t, getFontClass } = useLanguage();
  const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } };

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans">
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={exteriorImg} className="w-full h-full object-cover" alt="Golden Bay Exterior" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <Link to="/" className={`text-[10px] md:text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block ${getFontClass()}`}>{t('home.back')}</Link>
          <h1 className={`text-3xl md:text-4xl font-serif tracking-widest uppercase text-white drop-shadow-md ${getFontClass()}`}>{t('contact.title')}</h1>
          <div className="h-[1px] w-16 md:w-24 bg-gold-400 mt-6 md:mt-8 mx-auto"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col justify-center space-y-10">
          <div>
            <h2 className={`text-2xl md:text-3xl font-serif text-gray-900 mb-4 ${getFontClass()}`}>{t('contact.getTouch')}</h2>
            <p className={`text-gray-500 text-sm md:text-base leading-relaxed ${getFontClass()}`}>{t('contact.cDesc')}</p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0"><MapPin size={20} /></div>
              <div>
                <h4 className={`text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5 ${getFontClass()}`}>{t('contact.addrLabel')}</h4>
                <p className={`text-gray-500 text-sm leading-relaxed ${getFontClass()}`}>{t('footer.address')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0"><Phone size={20} /></div>
              <div>
                <h4 className={`text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5 ${getFontClass()}`}>{t('contact.resInq')}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">(02) 8804-0332</p>
                <p className="text-gray-500 text-sm leading-relaxed">+63 917 580 7166 (Viber / WhatsApp)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0"><Mail size={20} /></div>
              <div>
                <h4 className={`text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5 ${getFontClass()}`}>{t('contact.emailLabel')}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">marketing@goldenbay.com.ph</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-50 text-gold-600 flex items-center justify-center rounded-full shrink-0"><Clock size={20} /></div>
              <div>
                <h4 className={`text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-900 mb-1.5 ${getFontClass()}`}>{t('contact.hoursLabel')}</h4>
                <p className={`text-gray-500 text-sm leading-relaxed ${getFontClass()}`}><span className="font-medium text-gray-700">{t('footer.lunch')}:</span> 11:00 AM – 2:30 PM</p>
                <p className={`text-gray-500 text-sm leading-relaxed ${getFontClass()}`}><span className="font-medium text-gray-700">{t('footer.dinner')}:</span> 5:00 PM – 9:30 PM</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="w-full h-[400px] lg:h-full min-h-[400px] bg-gray-200 border border-gray-200 rounded-sm overflow-hidden shadow-lg p-1.5">
          <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3862.161342953903!2d120.9899011!3d14.5327621!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c95666ea03b3%3A0xd54670ba0bd98353!2sGolden%20Bay%20Fresh%20Seafoods%20Restaurant!5e0!3m2!1sen!2sph!4v1771614810044!5m2!1sen!2sph" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Golden Bay Map"></iframe>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;