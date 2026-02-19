import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroimage from '../../../assets/images/heroimage2.webp'; // Or a dedicated news banner

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const NewsPage = () => {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchPosts = async () => {
      let url = `${BACKEND_URL}/api/marketing/`;
      if (filter !== 'ALL') url += `?type=${filter}`;
      
      try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            setPosts(data);
        }
      } catch (err) {
        console.error("Failed to load news", err);
      }
    };
    fetchPosts();
  }, [filter]);

  const getExcerpt = (htmlContent) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length > 120 ? text.substring(0, 120) + "..." : text;
  };

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 transition-colors duration-300">
      
      {/* --- STANDARDIZED HERO BANNER --- */}
      <div className="relative h-[40vh] w-full flex items-center justify-center pt-24 bg-black">
        <div className="absolute inset-0 opacity-60">
          <img src={heroimage} className="w-full h-full object-cover" alt="Golden Bay Events" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-cream-50"></div>
        </div>
        <div className="relative z-10 text-center">
          <Link to="/" className="text-xs tracking-[0.4em] uppercase mb-6 text-white hover:text-gold-400 transition-colors block">← Back to Experience</Link>
          <h1 className="text-5xl md:text-5xl font-serif tracking-widest uppercase text-white drop-shadow-md">News & Promos</h1>
          <div className="h-[1px] w-24 bg-gold-400 mt-8 mx-auto"></div>
        </div>
      </div>

      <div className="px-6 md:px-24 py-16">
        {/* Filter Tabs */}
        <div className="flex justify-center gap-8 text-xs uppercase tracking-widest text-gray-500 mb-16">
            <button 
                onClick={() => setFilter('ALL')} 
                className={filter === 'ALL' 
                    ? 'text-black border-b border-gold-600 font-bold' 
                    : 'hover:text-gold-600'}
            >
                All Updates
            </button>
            <button 
                onClick={() => setFilter('PROMO')} 
                className={filter === 'PROMO' 
                    ? 'text-black border-b border-gold-600 font-bold' 
                    : 'hover:text-gold-600'}
            >
                Promotions
            </button>
            <button 
                onClick={() => setFilter('BLOG')} 
                className={filter === 'BLOG' 
                    ? 'text-black border-b border-gold-600 font-bold' 
                    : 'hover:text-gold-600'}
            >
                Events & Stories
            </button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
            <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="group flex flex-col h-full bg-white border border-gray-200 rounded-sm overflow-hidden hover:border-gold-600/30 transition-all duration-300 shadow-sm hover:shadow-md"
            >
                <Link to={`/news/${post.slug}`} className="block h-64 overflow-hidden relative">
                    {post.image ? (
                    <img 
                        src={post.image.startsWith('http') ? post.image : `${BACKEND_URL}${post.image}`} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    
                    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-600 border border-gold-600/30 backdrop-blur-sm">
                        {post.type === 'PROMO' ? 'Limited Offer' : 'Event'}
                    </div>
                </Link>

                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-widest mb-3">
                        <Calendar size={12} />
                        {new Date(post.created_at).toLocaleDateString()}
                    </div>

                    <Link to={`/news/${post.slug}`} className="block mb-3">
                        <h3 className="text-xl font-serif text-gray-900 group-hover:text-gold-600 transition-colors">
                            {post.title}
                        </h3>
                    </Link>

                    <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
                        {getExcerpt(post.content)}
                    </p>

                    <Link 
                        to={`/news/${post.slug}`} 
                        className="inline-block text-xs font-bold uppercase tracking-widest text-gold-600 border-b border-gold-600/30 pb-1 hover:text-black transition-all w-max"
                    >
                        Read More
                    </Link>
                </div>
            </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;