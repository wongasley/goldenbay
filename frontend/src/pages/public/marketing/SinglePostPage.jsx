import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const BACKEND_URL = import.meta.env.PROD ? "https://goldenbay.com.ph" : "http://127.0.0.1:8000";

const SinglePostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/marketing/${slug}/`);
        if (res.ok) setPost(await res.json());
      } catch (err) {
        console.error("Error fetching post", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const getExcerpt = (htmlContent) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  if (loading) return (
      <div className="min-h-screen bg-cream-50 pt-32 px-6 max-w-3xl mx-auto">
          {/* Skeleton Loader */}
          <div className="h-4 w-24 bg-gray-200 animate-pulse mb-8 rounded"></div>
          <div className="h-6 w-32 bg-gray-200 animate-pulse mb-4 rounded"></div>
          <div className="h-12 w-full bg-gray-300 animate-pulse mb-10 rounded"></div>
          <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded"></div>
      </div>
  );
  if (!post) return <div className="min-h-screen flex items-center justify-center pt-24">Post not found.</div>;

  const imageUrl = post.image ? (post.image.startsWith('http') ? post.image : `${BACKEND_URL}${post.image}`) : '';

  return (
    <div className="min-h-screen bg-cream-50 text-gray-900 pt-32 pb-20 px-6 md:px-24">
      {/* DYNAMIC SEO TAGS */}
      <Helmet>
        <title>{post.title} | Golden Bay</title>
        <meta name="description" content={getExcerpt(post.content)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={getExcerpt(post.content)} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
      </Helmet>

      <div className="max-w-3xl mx-auto">
        <Link to="/news" className="inline-flex items-center text-gold-600 hover:text-black mb-8 transition-colors text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-2" /> Back to News
        </Link>

        <div className="mb-10">
            <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest mb-4">
                <span className="px-2 py-1 border border-gold-600/30 text-gold-600 rounded-sm">
                    {post.type === 'PROMO' ? 'Promotion' : 'Event'}
                </span>
                <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(post.created_at).toLocaleDateString()}
                </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 leading-tight">{post.title}</h1>
        </div>

        {imageUrl && (
            <div className="w-full h-[300px] md:h-[500px] mb-12 overflow-hidden rounded-sm border border-gray-200 shadow-lg">
                <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
        )}

        {/* RICH TEXT RENDERER */}
        <div 
            className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed prose-headings:text-gold-600 prose-headings:font-serif prose-a:text-gold-600 hover:prose-a:text-black prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </div>
    </div>
  );
};
export default SinglePostPage;