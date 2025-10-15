import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useEffect } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    // Load Google Identity Services script and initialize
    const initializeGoogle = () => {
      const existing = document.getElementById('google-client-script');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.id = 'google-client-script';
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => {
          renderGoogleButton();
        };
      } else {
        // Script already exists, just render button
        renderGoogleButton();
      }
    };

    const renderGoogleButton = () => {
      /* global google */
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '431674926667-5l2r6pp7vqre0mkv6ujuj1oj2j2q7kfl.apps.googleusercontent.com',
          callback: handleGoogleCallback
        });
        const buttonDiv = document.getElementById('googleSignInDiv');
        if (buttonDiv) {
          // Clear any existing content
          buttonDiv.innerHTML = '';
          window.google.accounts.id.renderButton(
            buttonDiv,
            { theme: 'outline', size: 'large' }
          );
        }
      }
    };

    initializeGoogle();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      const data = res.data;
      if (data.success) {
        // Save or clear remember me credentials
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }
        // Save token and user to localStorage
        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        // Notify other parts of the app that user changed
        window.dispatchEvent(new Event('userChanged'));
        // Redirect based on role
        const roleName = data.user?.role?.name || data.user?.role?.roleName || '';
        const rn = String(roleName).toLowerCase();
        if (rn.includes('admin')) navigate('/admin');
        else if (rn.includes('doctor')) navigate('/doctor');
        else navigate('/');
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi mạng');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in callback
  const handleGoogleCallback = async (response) => {
    try {
      const idToken = response?.credential;
      
      // Decode JWT payload (basic decode, no verification)
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const email = payload.email;
      const firstName = payload.given_name || 'Google';
      const lastName = payload.family_name || 'User';
      
      // Send extracted data to backend
      const res = await axiosClient.post('/auth/google', { email, firstName, lastName, idToken });
      if (res.data?.success) {
        if (res.data.token) localStorage.setItem('token', res.data.token);
        if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('userChanged'));
        // Same role-based redirect as normal login
        const roleName = res.data.user?.role?.name || res.data.user?.role?.roleName || '';
        const rn = String(roleName).toLowerCase();
        if (rn.includes('admin')) navigate('/admin');
        else if (rn.includes('doctor')) navigate('/doctor/dashboard');
        else navigate('/');
      }
    } catch (err) {
      setError('Google sign-in failed');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow">
        <h2 className="mb-4 text-2xl font-semibold text-[#0d6efd]">Đăng nhập</h2>
        <p className="mb-6 text-sm text-gray-600">Đăng nhập để quản lý hồ sơ, đặt lịch và xem lịch sử.</p>

        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#cfe9ff]"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#cfe9ff]"
            />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-[#0d6efd] focus:ring-2 focus:ring-[#cfe9ff]"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <a href="/forgot-password" className="text-sm text-[#0d6efd] hover:underline">
              Quên mật khẩu?
            </a>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#0d6efd] px-4 py-2 text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            <a href="/register" className="text-sm text-[#0d6efd] hover:underline">Đăng ký</a>
          </div>
        </form>
        <div className="mt-4 text-center">
          <div id="googleSignInDiv" />
        </div>
      </div>
    </div>
  );
}
