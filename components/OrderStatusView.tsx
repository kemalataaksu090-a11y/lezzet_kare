import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '../types';

const OrderStatusView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const quickTags = ["Lezzetli", "Hızlı Servis", "Sıcak Geldi", "Güleryüz", "Porsiyon Bol"];

  const loadOrder = () => {
    const str = localStorage.getItem('orders');
    if (str) {
      const orders: Order[] = JSON.parse(str);
      const found = orders.find(o => o.id === orderId);
      setOrder(found || null);
    }

    const fbStr = localStorage.getItem('feedbacks');
    if (fbStr) {
      const feedbacks = JSON.parse(fbStr);
      if (feedbacks.some((fb: any) => fb.orderId === orderId)) {
        setFeedbackSubmitted(true);
      }
    }
  };

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 3000);
    window.addEventListener('storage', loadOrder);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadOrder);
    };
  }, [orderId]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleFeedbackSubmit = () => {
    if (rating === 0) {
      alert("Lütfen bir emoji seçerek deneyiminizi puanlayın.");
      return;
    }

    const newFeedback = {
      orderId: order?.id,
      tableId: order?.tableId,
      rating,
      tags: selectedTags,
      comment: feedbackText,
      timestamp: Date.now()
    };

    const fbStr = localStorage.getItem('feedbacks');
    const feedbacks = fbStr ? JSON.parse(fbStr) : [];
    feedbacks.push(newFeedback);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    
    setFeedbackSubmitted(true);
  };

  const handleCancelOrder = () => {
    if (!order || isCancelling) return;
    
    // Güvenlik: Sadece PENDING durumundakiler iptal edilebilir
    if (order.status !== OrderStatus.PENDING) {
        alert("Siparişiniz hazırlanmaya başladığı için iptal edilemiyor. Lütfen personel ile iletişime geçin.");
        return;
    }

    if (!window.confirm("Siparişinizi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;

    setIsCancelling(true);

    // Yapay bir gecikme ile işlem hissi verelim
    setTimeout(() => {
        const str = localStorage.getItem('orders');
        if (str) {
          const orders: Order[] = JSON.parse(str);
          const updatedOrders = orders.map(o => 
            o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o
          );
          localStorage.setItem('orders', JSON.stringify(updatedOrders));
          window.dispatchEvent(new Event('storage'));
          loadOrder();
        }
        setIsCancelling(false);
    }, 800);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sipariş Bulunamadı</h2>
        <p className="text-gray-600 mb-6">Aradığınız sipariş sistemde kayıtlı değil veya silinmiş.</p>
        <button onClick={() => navigate('/')} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold">Ana Sayfaya Dön</button>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (isCancelling) return <div className="w-24 h-24 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin mx-auto mb-6"></div>;

    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <div className="w-24 h-24 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
        );
      case OrderStatus.READY:
        return (
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
            ✅
          </div>
        );
      case OrderStatus.COMPLETED:
        return (
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            😋
          </div>
        );
      case OrderStatus.CANCELLED:
        return (
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">
            🚫
          </div>
        );
    }
  };

  const getStatusText = () => {
    if (isCancelling) return 'İptal Ediliyor...';
    switch (order.status) {
      case OrderStatus.PENDING: return 'Hazırlanıyor...';
      case OrderStatus.READY: return 'Siparişiniz Hazır!';
      case OrderStatus.COMPLETED: return 'Afiyet Olsun!';
      case OrderStatus.CANCELLED: return 'Sipariş İptal Edildi';
    }
  };

  const emojis = [
    { v: 1, e: '😡', l: 'Kötü' },
    { v: 2, e: '😕', l: 'Zayıf' },
    { v: 3, e: '😐', l: 'Normal' },
    { v: 4, e: '🙂', l: 'İyi' },
    { v: 5, e: '😍', l: 'Harika' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100 flex items-center mb-6 sticky top-0 z-30">
        <button 
          onClick={() => navigate(`/table/${order.tableId}`)}
          className="flex items-center gap-2 text-gray-600 font-bold text-[10px] uppercase tracking-widest bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          MENÜYE DÖN
        </button>
        <div className="flex-1 text-center pr-10">
           <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Sipariş Durumu</span>
        </div>
      </div>

      <div className="px-6 flex flex-col items-center">
        <div className={`w-full max-w-md bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 transition-all duration-500 ${order.status === OrderStatus.CANCELLED ? 'scale-[0.98] opacity-90' : 'scale-100'}`}>
          <div className={`${order.status === OrderStatus.CANCELLED ? 'bg-gray-600' : order.status === OrderStatus.READY ? 'bg-green-600' : 'bg-orange-600'} p-8 text-white text-center transition-colors duration-500 relative`}>
            {order.status === OrderStatus.CANCELLED && (
                <div className="absolute top-0 left-0 w-full h-full bg-black/10 animate-pulse pointer-events-none"></div>
            )}
            <h1 className="text-3xl font-black">LezzetKare</h1>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">Masa #{order.tableId} Siparişi</p>
          </div>

          <div className="p-10 text-center">
            {getStatusIcon()}
            <h2 className={`text-3xl font-black mb-2 transition-colors ${order.status === OrderStatus.CANCELLED ? 'text-rose-600' : 'text-gray-900'}`}>{getStatusText()}</h2>
            <p className="text-gray-400 text-[10px] mb-8 font-mono uppercase tracking-tighter">REFERANS: {order.id.toUpperCase()}</p>

            {order.status === OrderStatus.PENDING && !isCancelling && (
              <div className="animate-fade-in">
                <p className="text-gray-400 text-[11px] mb-4 font-bold italic">Mutfak hazırlığa başlamadan iptal edebilirsiniz.</p>
                <button 
                    onClick={handleCancelOrder}
                    className="mb-8 w-full bg-rose-50 text-rose-600 border border-rose-100 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2 group shadow-sm"
                >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    Siparişi İptal Et
                </button>
              </div>
            )}

            {order.status === OrderStatus.COMPLETED && (
              <div className="mb-10 p-6 bg-orange-50/50 rounded-[2.5rem] border border-orange-100 animate-fade-in-up">
                {feedbackSubmitted ? (
                  <div className="py-6">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-200/50 text-4xl animate-bounce">🌟</div>
                    <h4 className="text-xl font-black text-orange-900">Teşekkürler!</h4>
                    <p className="text-orange-700/60 text-[10px] font-black uppercase tracking-widest mt-2">Görüşleriniz bizim için çok değerli.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xs font-black text-orange-900 uppercase tracking-widest mb-6">Deneyiminizi Puanlayın</h3>
                    <div className="flex justify-between items-center mb-8 px-2">
                      {emojis.map((item) => (
                        <button
                          key={item.v}
                          onClick={() => setRating(item.v)}
                          className={`flex flex-col items-center gap-1 transition-all transform hover:scale-110 active:scale-90 ${rating === item.v ? 'scale-125' : 'opacity-40 grayscale-[0.5]'}`}
                        >
                          <span className="text-4xl">{item.e}</span>
                          <span className={`text-[8px] font-black uppercase ${rating === item.v ? 'text-orange-600' : 'text-gray-400'}`}>{item.l}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                      {quickTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2 rounded-full text-[10px] font-black transition-all border ${selectedTags.includes(tag) ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-white border-orange-100 text-orange-400'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Geri bildiriminiz..."
                      className="w-full bg-white border border-orange-100 rounded-2xl p-4 text-sm text-gray-700 focus:ring-4 focus:ring-orange-200 focus:outline-none transition-all placeholder:text-gray-300 mb-6 h-20 resize-none"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                    <button
                      onClick={handleFeedbackSubmit}
                      className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-xl shadow-orange-200/50"
                    >
                      GÖNDER
                    </button>
                  </>
                )}
              </div>
            )}

            <div className={`bg-gray-50 rounded-3xl p-6 text-left border border-gray-100 shadow-inner transition-opacity ${order.status === OrderStatus.CANCELLED ? 'opacity-50' : 'opacity-100'}`}>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Sipariş İçeriği</h3>
              <ul className="space-y-3">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span className={`font-bold text-sm ${order.status === OrderStatus.CANCELLED ? 'text-gray-400 line-through decoration-rose-400/50' : 'text-gray-800'}`}>
                      <span className="text-orange-600 mr-2">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-gray-400 font-mono text-xs">{item.price * item.quantity}₺</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-400 text-xs uppercase">TOPLAM TUTAR</span>
                <span className={`font-black text-2xl ${order.status === OrderStatus.CANCELLED ? 'text-gray-400' : 'text-orange-600'}`}>{order.totalAmount}₺</span>
              </div>
            </div>

            {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
              <div className="mt-10 animate-fade-in">
                <button 
                  onClick={() => navigate(`/table/${order.tableId}`)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  Sepete Ekleme Yap
                </button>
              </div>
            )}

            {order.status === OrderStatus.CANCELLED && (
               <div className="mt-10 animate-fade-in-up">
                 <button 
                   onClick={() => navigate(`/table/${order.tableId}`)}
                   className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   Yeni Sipariş Oluştur
                 </button>
               </div>
            )}
          </div>
        </div>
        
        <p className="mt-8 text-[10px] text-gray-300 text-center max-w-[260px] leading-relaxed font-bold uppercase tracking-widest">
          {order.status === OrderStatus.COMPLETED 
            ? "Tekrar bekleriz, afiyet olsun!" 
            : order.status === OrderStatus.CANCELLED 
              ? "Üzgünüz, bu sipariş iptal edildi. Personelimizden bilgi alabilirsiniz."
              : "Siparişiniz tamamlanana kadar bu ekranı kapatmamanızı öneririz."}
        </p>
      </div>

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OrderStatusView;