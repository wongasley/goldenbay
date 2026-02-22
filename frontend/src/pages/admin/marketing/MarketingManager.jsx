import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const MarketingManager = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${BACKEND_URL}/api/marketing/manage/all/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        const data = await res.json();
        setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this post?")) return;
    const token = localStorage.getItem('accessToken');
    await fetch(`${BACKEND_URL}/api/marketing/manage/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchPosts();
  };

  return (
    <div className="space-y-4">
      
      {/* 1. COMPACT HEADER */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-3">
        <div>
            <h1 className="text-xl font-bold text-gray-900 font-serif">Marketing & Blog</h1>
            <p className="text-gray-500 text-xs">Manage news, events, and promotional content.</p>
        </div>
        <div className="flex gap-2">
            <Link to="/staff/marketing/blast" className="bg-white border border-gold-600 text-gold-600 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-50 transition-colors flex items-center gap-1.5">
               <Send size={14} /> Send Blast
            </Link>
            <Link to="/staff/marketing/create" className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-colors flex items-center gap-1.5">
               <Plus size={14} /> New Post
            </Link>
        </div>
      </div>

      {/* 2. RESPONSIVE DATA DISPLAY */}
      
      {/* --- DESKTOP VIEW (TABLE) --- */}
      <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <tr>
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
                {loading ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400 animate-pulse">Loading posts...</td></tr>
                ) : posts.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">No posts found.</td></tr>
                ) : (
                    posts.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-gray-900">{post.title}</td>
                            <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border
                                    ${post.type === 'PROMO' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {post.type === 'PROMO' ? 'Promotion' : 'News'}
                                </span>
                            </td>
                            <td className="px-4 py-2.5">
                                {post.is_active 
                                    ? <span className="text-green-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Published</span> 
                                    : <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Draft</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right flex justify-end gap-1.5">
                                <Link to={`/staff/marketing/edit/${post.id}`} className="bg-white border border-gray-200 p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-colors">
                                    <Edit2 size={14} />
                                </Link>
                                <button onClick={() => handleDelete(post.id)} className="bg-white border border-gray-200 p-1.5 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* --- MOBILE VIEW (CARDS) --- */}
      <div className="md:hidden flex flex-col gap-3">
          {loading ? (
              <div className="p-8 text-center text-gray-400 animate-pulse text-xs">Loading posts...</div>
          ) : posts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 rounded text-xs">No posts found.</div>
          ) : (
              posts.map(post => (
                  <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-4">
                          <h3 className="font-bold text-gray-900 text-base leading-snug">{post.title}</h3>
                          {post.is_active ? (
                              <span className="shrink-0 text-green-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Live
                              </span> 
                          ) : (
                              <span className="shrink-0 text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Draft</span>
                          )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                          <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border
                                  ${post.type === 'PROMO' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {post.type === 'PROMO' ? 'Promotion' : 'News'}
                          </span>
                          
                          <div className="flex justify-end gap-2">
                              <Link to={`/staff/marketing/edit/${post.id}`} className="bg-gray-50 border border-gray-200 p-2.5 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                  <Edit2 size={16} />
                              </Link>
                              <button onClick={() => handleDelete(post.id)} className="bg-gray-50 border border-gray-200 p-2.5 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default MarketingManager;