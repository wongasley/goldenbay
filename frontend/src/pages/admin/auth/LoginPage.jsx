import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/images/goldenbaylogo.svg';

// --- ADDED DYNAMIC BACKEND URL ---
const BACKEND_URL = import.meta.env.PROD ? "https://goldenbay.com.ph" : "http://127.0.0.1:8000";

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // --- UPDATED TO USE BACKEND_URL ---
      const response = await fetch(`${BACKEND_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        navigate('/admin');
      } else {
        setError('Invalid Username or Password');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo Container */}
      <div className="bg-black/5 p-4 rounded-full mb-8">
        <img src={logo} className="h-20 w-auto" alt="Logo" />
      </div>

      <div className="bg-white p-10 rounded-sm border border-gray-200 w-full max-w-sm text-center shadow-xl">
        <h2 className="text-2xl font-serif text-gray-900 mb-2">Staff Access</h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">Authorized Personnel Only</p>
        
        {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 border border-red-200">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Username"
            className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-600 outline-none text-center rounded-sm transition-all"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password"
            className="w-full bg-gray-50 border border-gray-200 p-3 text-gray-900 focus:border-gold-600 outline-none text-center rounded-sm transition-all"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-gold-600 text-white font-bold py-3 uppercase tracking-widest hover:bg-black transition-colors rounded-sm shadow-md">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;