import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok, FaWeixin } from 'react-icons/fa';
import { SiXiaohongshu } from 'react-icons/si'; 
import logo from '../../assets/images/goldenbaylogo.svg'; 
import logo2 from '../../assets/images/goldenbayland.svg'; 
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t, getFontClass } = useLanguage();

  return (
    <footer className="bg-neutral-950 text-white pt-24 pb-12 border-t border-gold-600/20 font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          
          <div className="md:col-span-5 space-y-8">
             <img src={logo} alt="Golden Bay Logo" className="h-20 w-auto opacity-90" />
             <div className={`space-y-2 text-gray-400 text-sm font-light tracking-wide leading-relaxed ${getFontClass()}`}>
               <p className="uppercase tracking-widest text-gold-500 text-xs font-bold mb-4">Golden Bay Fresh Seafood Restaurant</p>
               <p>{t('footer.address')}</p>
             </div>
          </div>

          <div className="md:col-span-3">
             <h4 className={`font-serif text-xl text-gold-500 mb-6 ${getFontClass()}`}>{t('footer.explore')}</h4>
             <div className={`flex flex-col space-y-4 text-sm uppercase tracking-[0.2em] font-light text-gray-400 ${getFontClass()}`}>
                <Link to="/menu" className="hover:text-white transition-colors duration-300 w-max">{t('nav.menu')}</Link>
                <Link to="/reservations" className="hover:text-white transition-colors duration-300 w-max">{t('nav.book')}</Link>
                <Link to="/news" className="hover:text-white transition-colors duration-300 w-max">{t('nav.news')}</Link>
                <Link to="/about" className="hover:text-white transition-colors duration-300 w-max">{t('nav.about')}</Link>
                <Link to="/vip-rooms" className="hover:text-white transition-colors duration-300 w-max">{t('nav.rooms')}</Link>
             </div>
          </div>

          <div className="md:col-span-4 md:text-right space-y-10">
             <div className="space-y-4">
                <h4 className={`font-serif text-xl text-gold-500 ${getFontClass()}`}>{t('footer.contact')}</h4>
                <div className="flex flex-col md:items-end space-y-2 text-gray-400 text-sm font-light tracking-wide">
                  <a href="tel:+63288040332" className="hover:text-white transition-colors">+63 (02) 8804-0332</a>
                  <a href="tel:+639175807166" className="hover:text-white transition-colors">+63 917 580 7166</a>
                  <a href="mailto:marketing@goldenbay.com.ph" className="hover:text-white transition-colors">marketing@goldenbay.com.ph</a>
                </div>
              </div>

             <div className="space-y-4">
                <h4 className={`font-serif text-xl text-gold-500 ${getFontClass()}`}>{t('footer.hours')}</h4>
                <div className={`flex flex-col md:items-end space-y-1 text-gray-400 text-sm font-light ${getFontClass()}`}>
                  <p><span className="text-gray-600 uppercase text-[10px] tracking-widest mr-2">{t('footer.lunch')}</span> 11:00 AM – 02:30 PM</p>
                  <p><span className="text-gray-600 uppercase text-[10px] tracking-widest mr-2">{t('footer.dinner')}</span> 05:00 PM – 09:30 PM</p>
                </div>
             </div>
          </div>
        </div>

        <div className="h-px w-full bg-white/5 mb-8"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className={`text-[10px] text-gray-600 uppercase tracking-widest flex items-center gap-4 ${getFontClass()}`}>
            <span>© {new Date().getFullYear()} {t('footer.rights')}</span>
            <Link to="/login" className="opacity-0 hover:opacity-50 transition-opacity duration-300">Staff Access</Link>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gold-500/60 hover:text-gold-500 transition-colors"><FaFacebookF size={14} /></a>
            <a href="https://instagram.com/goldenbayseafoods" target="_blank" rel="noreferrer" className="text-gold-500/60 hover:text-gold-500 transition-colors"><FaInstagram size={16} /></a>
            <a href="https://tiktok.com/@goldenbayseafoods" target="_blank" rel="noreferrer" className="text-gold-500/60 hover:text-gold-500 transition-colors"><FaTiktok size={15} /></a>
            <a href="https://rednotee.com/login" target="_blank" rel="noreferrer" className="text-gold-500/60 hover:text-gold-500 transition-colors" title="RedNote"><SiXiaohongshu size={25} /></a>
            <a href="https://weixin.qq.com/" target="_blank" rel="noreferrer" className="text-gold-500/60 hover:text-gold-500 transition-colors" title="WeChat ID: goldenbay888"><FaWeixin size={17} /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gold-500/60 hover:text-gold-500 transition-colors"><FaYoutube size={16} /></a>
        </div>

          <div className="flex items-center gap-4 opacity-30 hover:opacity-60 transition-all duration-500 grayscale">
             <Link to="https://goldenbayland.com/" target="_blank">
                <img src={logo2} alt="Golden Bay Land" className="h-4 w-auto" />
             </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;