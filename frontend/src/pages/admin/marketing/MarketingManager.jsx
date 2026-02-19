import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.PROD ? "https://goldenbay.com.ph" : "http://127.0.0.1:8000";

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
        <Link to="/staff/marketing/create" className="bg-gold-600 text-white px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded shadow-sm hover:bg-gold-700 transition-colors flex items-center gap-1.5">
           <Plus size={14} /> New Post
        </Link>
      </div>

      {/* 2. COMPACT TABLE */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
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
    </div>
  );
};

export default MarketingManager;