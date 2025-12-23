
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setError('Şifreler eşleşmiyor!');
        return;
    }
    
    if (authService.register({ username, password, email, phone })) {
      alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      navigate('/login');
    } else {
      setError('Bu kullanıcı adı zaten kullanılıyor.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0f172a] overflow-hidden px-4">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-orange-600/15 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] bg-rose-600/15 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] left-[10%] w-[35%] h-[35%] bg-amber-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[25%] h-[25%] bg-blue-500/10 rounded-full blur-[100px] animate-blob animation-delay-3000"></div>
      </div>

      <div className="max-w-lg w-full relative z-10 py-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden transform transition-all">
          <div className="bg-gradient-to-br from-orange-600 to-rose-600 p-8 text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-3 border border-white/30 shadow-inner">
               <span className="text-3xl font-black">LK</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Personel Kaydı</h2>
            <p className="text-orange-100/70 text-[10px] font-bold uppercase tracking-widest mt-1">LezzetKare Ekibine Katılın</p>
          </div>
          
          <div className="p-8 md:p-10">
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-black border border-rose-100 flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold text-gray-700 text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefon</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="05xx..."
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold text-gray-700 text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-posta Adresi</label>
                <input 
                  type="email" 
                  required
                  placeholder="ornek@lezzetkare.com"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold text-gray-700 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Şifre</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold text-gray-700 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Şifre Tekrar</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold text-gray-700 text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-rose-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transform transition-all active:scale-[0.98] mt-4"
              >
                KAYDI TAMAMLA
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 font-bold">
                Zaten hesabınız var mı? <Link to="/login" className="text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-2 decoration-orange-100">Giriş Yapın</Link>
              </p>
            </div>
          </div>
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
      `}</style>
    </div>
  );
};

export default Register;
