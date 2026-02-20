import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { Save, X, Image as ImageIcon, Layout, Type } from 'lucide-react';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : "http://127.0.0.1:8000";

const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'BLOG',
    content: '',
    is_active: true,
    image: null
  });

  useEffect(() => {
    if (isEditMode) {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(`/api/marketing/manage/${id}/`);
                const data = res.data;
                if (data.image) {
                    setPreviewImage(data.image.startsWith('http') ? data.image : `${BACKEND_URL}${data.image}`);
                }
                setFormData({ ...data, image: null });
            } catch (err) {
                console.error("Failed to fetch post", err);
                alert("Error loading post details.");
            }
        };
        fetchData();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('slug', formData.slug);
    data.append('type', formData.type);
    data.append('content', formData.content);
    data.append('is_active', formData.is_active ? 'true' : 'false');
    
    if (formData.image instanceof File) {
        data.append('image', formData.image);
    }

    const url = isEditMode ? `/api/marketing/manage/${id}/` : `/api/marketing/manage/all/`;
    const method = isEditMode ? 'patch' : 'post';

    try {
        await axiosInstance({
            method: method,
            url: url,
            data: data,
            headers: { "Content-Type": "multipart/form-data" }
        });
        navigate('/staff/marketing');
    } catch (err) {
        console.error(err);
        alert(`Failed to save: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData({ ...formData, title: title, slug: slug });
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-20">
       {/* HEADER */}
       <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-8 py-4 flex justify-between items-center shadow-sm">
           <div>
               <h1 className="text-2xl font-serif text-gray-900 font-bold">{isEditMode ? 'Edit Post' : 'Create New Post'}</h1>
               <p className="text-gray-500 text-xs mt-1">Marketing Content Manager</p>
           </div>
           <div className="flex gap-3">
               <button 
                  type="button" 
                  onClick={() => navigate('/staff/marketing')} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X size={16} /> Cancel
               </button>
               <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-gold-600 text-white text-sm font-bold uppercase tracking-wide rounded-md hover:bg-gold-700 transition-all shadow-md disabled:opacity-50"
                >
                  <Save size={16} /> {loading ? 'Saving...' : 'Save Post'}
               </button>
           </div>
       </div>

       <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN - MAIN EDITOR */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Title Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-2">
                           <Type size={14} /> Title
                        </label>
                        <input 
                            type="text" 
                            required 
                            className="w-full text-3xl font-serif font-bold text-gray-900 placeholder-gray-300 border-b border-gray-200 pb-2 focus:border-gold-500 outline-none transition-colors"
                            placeholder="Enter post title here..."
                            value={formData.title} 
                            onChange={handleTitleChange} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Slug (URL)</label>
                        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                             <span className="text-xs">goldenbay.com.ph/news/</span>
                             <input 
                                type="text" 
                                required 
                                className="flex-1 bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                                value={formData.slug} 
                                onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                             />
                        </div>
                    </div>
                </div>

                {/* Rich Text Editor */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[500px] flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-4">
                       <Layout size={14} /> Content Body
                    </label>
                    <div className="flex-grow">
                        {/* Custom Quill Styles */}
                        <style>{`
                            .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #fff; padding: 12px 0; }
                            .ql-container.ql-snow { border: none !important; font-family: 'Quicksand', sans-serif; font-size: 16px; }
                            .ql-editor { min-height: 400px; padding: 20px 0; }
                        `}</style>
                        <ReactQuill 
                            theme="snow" 
                            value={formData.content} 
                            onChange={(val) => setFormData({...formData, content: val})} 
                            placeholder="Write your story here..."
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - SIDEBAR SETTINGS */}
            <div className="space-y-6">
                
                {/* Publish Status */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Publishing</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Visibility</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.is_active} 
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                    <div className="mt-4">
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Category</label>
                         <select 
                            className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 focus:ring-gold-500 focus:border-gold-500 outline-none"
                            value={formData.type} 
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                         >
                            <option value="BLOG">News & Events</option>
                            <option value="PROMO">Promotion</option>
                        </select>
                    </div>
                </div>

                {/* Featured Image */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                        <ImageIcon size={16} /> Featured Image
                    </h3>
                    
                    <div className="relative w-full h-48 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:bg-gray-50 transition-colors group cursor-pointer">
                        {previewImage ? (
                            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-1 text-xs text-gray-500">Click to upload image</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    setFormData({...formData, image: e.target.files[0]});
                                    setPreviewImage(URL.createObjectURL(e.target.files[0]));
                                }
                            }} 
                        />
                         {previewImage && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="text-white text-xs font-bold uppercase">Change Image</p>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">Recommended size: 1200x630px</p>
                </div>
            </div>
       </div>
    </div>
  );
};

export default PostEditor;