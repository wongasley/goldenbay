import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';

const BACKEND_URL = "http://127.0.0.1:8000";

const SinglePostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/marketing/${slug}/`);
        if (res.ok) {
            const data = await res.json();
            setPost(data);
        }
      } catch (err) {
        console.error("Error fetching post", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-cream-50 dark:bg-black text-gold-600 dark:text-white flex items-center justify-center pt-24 transition-colors duration-300">Loading...</div>;
  if (!post) return <div className="min-h-screen bg-cream-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center pt-24 transition-colors duration-300">Post not found.</div>;

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-neutral-950 text-gray-900 dark:text-white pt-32 pb-20 px-6 md:px-24 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        
        <Link to="/news" className="inline-flex items-center text-gold-600 dark:text-gold-400 hover:text-black dark:hover:text-white mb-8 transition-colors text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-2" /> Back to News
        </Link>

        <div className="mb-10">
            <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest mb-4">
                <span className="px-2 py-1 border border-gold-600/30 dark:border-gold-400/30 text-gold-600 dark:text-gold-400 rounded-sm">
                    {post.type === 'PROMO' ? 'Promotion' : 'Event'}
                </span>
                <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(post.created_at).toLocaleDateString()}
                </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-white leading-tight">{post.title}</h1>
        </div>

        {post.image && (
            <div className="w-full h-[300px] md:h-[500px] mb-12 overflow-hidden rounded-sm border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none">
                <img 
                    src={post.image.startsWith('http') ? post.image : `${BACKEND_URL}${post.image}`} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                />
            </div>
        )}

        {/* RICH TEXT RENDERER */}
        <div 
            className="prose prose-lg max-w-none 
            text-gray-600 dark:text-gray-300 font-light leading-relaxed 
            prose-headings:text-gold-600 dark:prose-headings:text-gold-400 prose-headings:font-serif 
            prose-a:text-gold-600 dark:prose-a:text-gold-400 hover:prose-a:text-black dark:hover:prose-a:text-white
            prose-strong:text-gray-900 dark:prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: post.content }} 
        />

      </div>
    </div>
  );
};

export default SinglePostPage;