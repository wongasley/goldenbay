import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, GlassWater, Users, Building, ChevronDown, X } from 'lucide-react';

// Images - We will reuse existing ones or you can add new ones
import heroimage from '../../../assets/images/heroimage3.webp'; 
import diningImg from '../../../assets/images/dining_area.webp';
import wechatQr from '../../../assets/images/goldenbaylogo.svg'; // Replace with actual QR later

const EventInquiriesPage = () => {
  const [showWeChat, setShowWeChat] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const faqs = [
    {
      question: "What types of events do you host?",
      answer: "We specialize in grand weddings, corporate banquets, product launches, birthday celebrations, and intimate VIP gatherings. Our versatile spaces can accommodate both small private dinners and large-scale celebrations."
    },
    {
      question: "What is the maximum capacity of your event spaces?",
      answer: "Our Main Dining Hall can comfortably seat up to 250 guests. We also offer multiple exclusive VIP rooms that can host between 10 to 70 guests, perfect for more intimate or private functions."
    },
    {
      question: "Do you offer customizable set menus?",
      answer: "Absolutely. Our Executive Chef and culinary team will work closely with you to curate a bespoke menu featuring our freshest seafood and authentic Chinese delicacies tailored to your event's theme and budget."
    },
    {
      question: "How far in advance should I book?",
      answer: "For large events like weddings or corporate banquets, we recommend booking at least 3 to 6 months in advance to secure your preferred date and allow ample time for meticulous planning."
    }
  ];

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 font-sans">
      
      {/* --- HERO BANNER --- */}
      <div className="relative h-[50vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-50">
          <img src={heroimage} className="w-full h-full object-cover" alt="Golden Bay Grand Events" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <span className="text-gold-500 text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Celebrate With Us</span>
          <h1 className="text-4xl md:text-6xl font-serif tracking-widest text-white drop-shadow-lg mb-6">Event Inquiries</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            From intimate VIP gatherings to grand corporate banquets and weddings, let Golden Bay be the stage for your most unforgettable moments.
          </p>
        </div>
      </div>

      {/* --- HIGHLIGHTS SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6">
              <Building size={28} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-serif text-gray-900">Versatile Spaces</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              Choose from our grand dining hall or exclusive VIP rooms, equipped with modern amenities and elegant decor to suit any occasion.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6">
              <GlassWater size={28} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-serif text-gray-900">Bespoke Dining</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              Elevate your event with our signature live seafood, authentic Chinese culinary masterpieces, and customizable set menus.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mb-6">
              <Users size={28} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-serif text-gray-900">Dedicated Service</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              Our experienced event specialists and attentive staff ensure flawless execution, allowing you to enjoy your celebration stress-free.
            </p>
          </motion.div>
        </div>
      </div>

      {/* --- CONTACT / INQUIRY SECTION --- */}
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          
          {/* Image Side */}
          <div className="relative h-96 lg:h-auto overflow-hidden">
            <img src={diningImg} alt="Event Setup" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Content Side */}
          <div className="p-12 lg:p-24 flex flex-col justify-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-6">Plan Your Grand Event</h2>
              <p className="text-gray-500 text-sm leading-loose mb-10">
                To ensure we provide you with the highest level of personalized service for your large-scale event, we kindly request you to connect with our Event Specialists directly. Let's discuss your vision, requirements, and how we can bring it to life.
              </p>

              <div className="space-y-6">
                {/* Phone */}
                <a href="tel:+63288040332" className="group flex items-center gap-6 p-4 rounded-lg border border-gray-100 hover:border-gold-300 hover:shadow-md transition-all bg-gray-50 hover:bg-white">
                  <div className="w-12 h-12 rounded-full bg-white text-gold-600 flex items-center justify-center shadow-sm group-hover:bg-gold-600 group-hover:text-white transition-colors">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Call Us Direct</p>
                    <p className="text-lg font-serif text-gray-900">(02) 8804-0332</p>
                  </div>
                </a>

                {/* Email */}
                <a href="mailto:marketing@goldenbay.com.ph" className="group flex items-center gap-6 p-4 rounded-lg border border-gray-100 hover:border-gold-300 hover:shadow-md transition-all bg-gray-50 hover:bg-white">
                  <div className="w-12 h-12 rounded-full bg-white text-gold-600 flex items-center justify-center shadow-sm group-hover:bg-gold-600 group-hover:text-white transition-colors">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Email Our Specialists</p>
                    <p className="text-sm font-medium text-gray-900">marketing@goldenbay.com.ph</p>
                  </div>
                </a>

                {/* WeChat / Viber */}
                <button onClick={() => setShowWeChat(true)} className="w-full group flex items-center gap-6 p-4 rounded-lg border border-gray-100 hover:border-green-300 hover:shadow-md transition-all bg-gray-50 hover:bg-white text-left">
                  <div className="w-12 h-12 rounded-full bg-white text-green-600 flex items-center justify-center shadow-sm group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Instant Messaging</p>
                    <p className="text-sm font-medium text-gray-900">Connect via WeChat or Viber</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- FAQ SECTION --- */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="h-px w-16 bg-gold-400 mx-auto opacity-50"></div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown 
                  size={20} 
                  className={`text-gold-600 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} 
                />
              </button>
              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 pt-0 text-sm text-gray-500 leading-relaxed font-light border-t border-gray-50">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* --- WECHAT MODAL --- */}
      <AnimatePresence>
        {showWeChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowWeChat(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-10 rounded-lg shadow-2xl max-w-sm w-full text-center relative"
              onClick={(e) => e.stopPropagation()} // Prevent clicking inside modal from closing it
            >
              <button 
                onClick={() => setShowWeChat(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-serif text-gold-600 mb-2">Connect With Us</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">Scan to add on WeChat</p>
              
              <div className="bg-gray-50 p-4 rounded-lg inline-block border border-gray-200 mb-8">
                <img src={wechatQr} alt="Golden Bay WeChat QR" className="w-48 h-48 object-contain" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Or reach us on Viber:</p>
                <p className="text-xl font-bold text-gray-900 tracking-wider">+63 917 580 7166</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EventInquiriesPage;