
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  // Sayfa yüklendiğinde hatırlanan ismi çek
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/admin');
    }
    const remembered = localStorage.getItem('remembered_username');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authService.login({ username, password })) {
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }
      navigate('/admin');
    } else {
      setError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0f172a] overflow-hidden px-4">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-orange-600/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-rose-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] right-[10%] w-[35%] h-[35%] bg-amber-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[20%] left-[20%] w-[25%] h-[25%] bg-blue-500/10 rounded-full blur-[100px] animate-blob animation-delay-3000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden transform transition-all">
          <div className="bg-gradient-to-br from-orange-600 to-rose-600 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
            </div>
            
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-4 border border-white/30 shadow-inner">
               <span className="text-4xl font-black text-white">LK</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">LezzetKare</h2>
            <p className="text-orange-100/80 text-sm font-bold uppercase tracking-widest mt-2">Personel Portalı</p>
          </div>
          
          <div className="p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-black border border-rose-100 flex items-center gap-3 animate-shake">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-300 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Kullanıcı adı giriniz"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-300"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Şifre</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-300 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <input 
                  type="checkbox" 
                  id="remember"
                  className="w-5 h-5 accent-orange-600 rounded-lg cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="text-xs font-bold text-gray-500 cursor-pointer select-none">Beni Hatırla</label>
              </div>
              
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-rose-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-orange-500/40 transform transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
              >
                GİRİŞ YAP
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 font-bold">
                Erişim yetkiniz yok mu? <Link to="/register" className="text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-2 decoration-orange-200">Kaydolun</Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-10 text-center">
           <Link 
             to="/" 
             className="inline-flex items-center gap-2 text-xs font-black text-white/40 hover:text-white transition-colors bg-white/5 px-6 py-2.5 rounded-full backdrop-blur-sm border border-white/10 uppercase tracking-widest"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             Geri Dön
           </Link>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default Login;
