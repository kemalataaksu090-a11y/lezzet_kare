import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order, OrderStatus, CartItem } from '../types';

const OrderHistoryView: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [disabledItems, setDisabledItems] = useState<string[]>([]);

  useEffect(() => {
    const loadData = () => {
      // Siparişleri yükle
      const str = localStorage.getItem('orders');
      if (str) {
        const allOrders: Order[] = JSON.parse(str);
        const filtered = allOrders
          .filter(o => o.tableId === tableId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setOrders(filtered);
      }
      
      // Stokta olmayanları yükle
      const disabledStr = localStorage.getItem('disabled_menu_items');
      if (disabledStr) {
        setDisabledItems(JSON.parse(disabledStr));
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [tableId]);

  const handleReorder = (order: Order) => {
    // Mevcut sepeti al
    const savedCart = localStorage.getItem(`cart_${tableId}`);
    let currentCart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    // Siparişteki ürünleri ekle (stokta olanları)
    let readdedCount = 0;
    let skippedCount = 0;

    order.items.forEach(oldItem => {
      if (disabledItems.includes(oldItem.id)) {
        skippedCount++;
        return;
      }

      const existing = currentCart.find(i => i.id === oldItem.id);
      if (existing) {
        existing.quantity += oldItem.quantity;
      } else {
        currentCart.push({ ...oldItem });
      }
      readdedCount++;
    });

    if (readdedCount === 0) {
      alert("Maalesef bu siparişteki tüm ürünler şu an stokta yok.");
      return;
    }

    // Yeni sepeti kaydet
    localStorage.setItem(`cart_${tableId}`, JSON.stringify(currentCart));
    window.dispatchEvent(new Event('storage'));

    if (skippedCount > 0) {
      alert(`${readdedCount} ürün sepete eklendi, ancak ${skippedCount} ürün stokta olmadığı için atlandı.`);
    }

    // Menüye yönlendir
    navigate(`/table/${tableId}`);
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-orange-100 text-orange-600 border-orange-200';
      case OrderStatus.READY: return 'bg-green-100 text-green-600 border-green-200';
      case OrderStatus.COMPLETED: return 'bg-gray-100 text-gray-500 border-gray-200';
      case OrderStatus.CANCELLED: return 'bg-rose-100 text-rose-600 border-rose-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Hazırlanıyor';
      case OrderStatus.READY: return 'Hazır';
      case OrderStatus.COMPLETED: return 'Tamamlandı';
      case OrderStatus.CANCELLED: return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100 px-5 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(`/table/${tableId}`)}
          className="bg-gray-100 p-2 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors active:scale-90"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-gray-900 leading-none">Siparişlerim</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Masa #{tableId} Geçmişi</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              🥘
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Henüz Siparişiniz Yok</h2>
            <p className="text-gray-400 text-sm px-10">Harika yemeklerimizi tatmak için hemen menüye göz atın!</p>
            <button 
              onClick={() => navigate(`/table/${tableId}`)}
              className="mt-8 bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-orange-100"
            >
              MENÜYE GİT
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-6 hover:shadow-md transition-all transform animate-fade-in-up"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">
                      {new Date(order.timestamp).toLocaleDateString('tr-TR')} • {new Date(order.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h3 className="text-lg font-black text-gray-900">Sipariş #{order.id.slice(-6).toUpperCase()}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="space-y-1 mb-6">
                  {order.items.map((item, idx) => (
                    <p key={idx} className={`text-xs font-bold ${order.status === OrderStatus.CANCELLED ? 'text-gray-300 line-through decoration-rose-200' : 'text-gray-500'}`}>
                      <span className="text-orange-600">{item.quantity}x</span> {item.name}
                    </p>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black text-gray-900">{order.totalAmount}₺</span>
                    <button 
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="text-orange-600 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-4 py-2.5 rounded-xl hover:bg-orange-100 transition-colors"
                    >
                      Detaylar
                    </button>
                  </div>
                  
                  {order.status !== OrderStatus.CANCELLED && (
                    <button 
                      onClick={() => handleReorder(order)}
                      className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                      <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Aynısını Tekrarla
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OrderHistoryView;