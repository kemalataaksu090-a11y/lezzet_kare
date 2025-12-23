
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const tables = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-12">
          <div className="inline-block bg-orange-600/20 px-4 py-1 rounded-full text-orange-500 font-bold text-xs mb-4 tracking-widest uppercase border border-orange-500/20">
            Yönetim Paneli - Masa QR Listesi
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
            LezzetKare Sistem Başlangıcı
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Burası restoran sahibinin masalara yapıştıracağı QR kodlarını hazırladığı yerdir. Müşteriler bu sayfayı görmez, doğrudan masa linkine giderler.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button 
            onClick={() => navigate('/login')}
            className="group bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-orange-600 transition-all text-left shadow-2xl"
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">👨‍🍳</div>
            <h3 className="text-xl font-black mb-2">Personel Girişi</h3>
            <p className="text-slate-400 group-hover:text-orange-100 text-xs font-medium">Siparişleri yönetmek ve menü ayarları için panele git.</p>
          </button>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-black mb-2">Müşteri Deneyimi</h3>
            <p className="text-slate-400 text-xs font-medium">Aşağıdaki masalardan birini seçerek müşterinin QR okuttuğunda göreceği ekranı test et.</p>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <svg className="w-32 h-32 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2z"/></svg>
          </div>
          
          <h2 className="text-slate-900 font-black text-xl mb-8 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
            MASA QR SİMÜLASYONU
          </h2>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {tables.map(num => (
              <Link 
                key={num} 
                to={`/table/${num}`} 
                className="flex flex-col items-center justify-center aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <span className="text-slate-900 font-black text-lg group-hover:text-orange-600">{num}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1 group-hover:text-orange-400">MASA</span>
              </Link>
            ))}
          </div>
          
          <div className="mt-10 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <p className="text-amber-800 text-[10px] font-bold leading-relaxed">
              GERÇEK KULLANIMDA: Her masaya o masanın numarasını içeren özel bir link (Örn: table/{tables[0]}) QR koduna dönüştürülüp yapıştırılır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
