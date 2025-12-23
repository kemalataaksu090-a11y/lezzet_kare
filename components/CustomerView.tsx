
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MENU_ITEMS, Category, CartItem, Order, OrderStatus, MenuItem, DiscountRule, RequestType, TableRequest } from '../types';
import AIChatWidget from './AIChatWidget';
import { summarizeOrderForKitchen } from '../services/geminiService';

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  image: string;
}

const CustomerView: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category | 'Tümü'>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dynamicMenu, setDynamicMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`cart_${tableId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [disabledItems, setDisabledItems] = useState<string[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, DiscountRule>>({});
  
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCartReview, setShowCartReview] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [hasOrders, setHasOrders] = useState(false);
  
  const [cartPulse, setCartPulse] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  
  // Masadan Çağrı Menüsü State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpLoading, setHelpLoading] = useState<RequestType | null>(null);

  useEffect(() => {
    localStorage.setItem(`cart_${tableId}`, JSON.stringify(cart));
  }, [cart, tableId]);

  const syncDatabase = () => {
    const savedMenu = localStorage.getItem('dynamic_menu');
    if (savedMenu) {
      setDynamicMenu(JSON.parse(savedMenu));
    } else {
      setDynamicMenu(MENU_ITEMS);
    }

    setPriceOverrides(JSON.parse(localStorage.getItem('menu_prices') || '{}'));
    
    const rawDiscounts = JSON.parse(localStorage.getItem('menu_discounts') || '{}');
    const processedDiscounts: Record<string, DiscountRule> = {};
    Object.keys(rawDiscounts).forEach(id => {
        if (typeof rawDiscounts[id] === 'number') {
            processedDiscounts[id] = {
                itemId: id,
                discountPercent: rawDiscounts[id],
                days: [0, 1, 2, 3, 4, 5, 6],
                startTime: '00:00',
                endTime: '23:59',
                isActive: true
            };
        } else {
            processedDiscounts[id] = rawDiscounts[id];
        }
    });
    setItemDiscounts(processedDiscounts);

    setDisabledItems(JSON.parse(localStorage.getItem('disabled_menu_items') || '[]'));
    
    const ordersStr = localStorage.getItem('orders');
    if (ordersStr) {
      const tableOrders = JSON.parse(ordersStr).filter((o: any) => o.tableId === tableId);
      setOrderHistory(tableOrders);
      setHasOrders(tableOrders.length > 0);
    }
  };

  useEffect(() => {
    syncDatabase();
    window.addEventListener('storage', syncDatabase);
    const interval = setInterval(syncDatabase, 3000);
    return () => {
        window.removeEventListener('storage', syncDatabase);
        clearInterval(interval);
    };
  }, [tableId]);

  const handleTableRequest = (type: RequestType) => {
      setHelpLoading(type);
      setTimeout(() => {
          const newRequest: TableRequest = {
              id: Math.random().toString(36).substr(2, 9),
              tableId: tableId || '?',
              type,
              timestamp: Date.now(),
              isResolved: false
          };
          const existing = JSON.parse(localStorage.getItem('table_requests') || '[]');
          localStorage.setItem('table_requests', JSON.stringify([...existing, newRequest]));
          window.dispatchEvent(new Event('storage'));
          setHelpLoading(null);
          setIsHelpOpen(false);
          alert(`${type} talebiniz alındı, personelimiz hemen ilgilenecek. 😊`);
      }, 1000);
  };

  const getFinalPrice = (item: any) => {
    const base = priceOverrides[item.id] !== undefined ? priceOverrides[item.id] : item.price;
    const rule = itemDiscounts[item.id];
    
    if (rule && rule.isActive && rule.discountPercent > 0) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentVal = now.getHours() * 100 + now.getMinutes();
        const [sh, sm] = rule.startTime.split(':').map(Number);
        const [eh, em] = rule.endTime.split(':').map(Number);
        if (rule.days.includes(currentDay) && currentVal >= (sh * 100 + sm) && currentVal <= (eh * 100 + em)) {
            return Math.round(base * (1 - rule.discountPercent / 100));
        }
    }
    return base;
  };

  const filteredItems = useMemo(() => {
    let items = dynamicMenu;
    if (activeCategory !== 'Tümü') items = items.filter(item => item.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }
    return items;
  }, [activeCategory, searchQuery, dynamicMenu]);

  const addToCart = (e: React.MouseEvent, item: any) => {
    if (disabledItems.includes(item.id)) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const flyer: FlyingItem = { id: Date.now(), startX: rect.left + rect.width / 2, startY: rect.top + rect.height / 2, endX: window.innerWidth / 2, endY: window.innerHeight - 60, image: item.image };
    setFlyingItems(prev => [...prev, flyer]);
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      const finalPrice = getFinalPrice(item);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, price: finalPrice } : i);
      return [...prev, { ...item, quantity: 1, price: finalPrice }];
    });

    setTimeout(() => {
      setCartPulse(true);
      setFlyingItems(prev => prev.filter(f => f.id !== flyer.id));
      setTimeout(() => setCartPulse(false), 300);
    }, 850);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    const aiNote = await summarizeOrderForKitchen(cart);
    const newOrder: Order = { id: Date.now().toString(), tableId: tableId!, items: cart, totalAmount, status: OrderStatus.PENDING, timestamp: Date.now(), aiNote };
    const all = JSON.parse(localStorage.getItem('orders') || '[]');
    localStorage.setItem('orders', JSON.stringify([...all, newOrder]));
    localStorage.removeItem(`cart_${tableId}`);
    setCart([]);
    window.dispatchEvent(new Event('storage'));
    setIsOrdering(false);
    navigate(`/order/${newOrder.id}`);
  };

  if (!tableId) return <div className="p-8 text-center text-rose-500 font-bold bg-white h-screen flex items-center justify-center">MASA TANIMSIZ! Lütfen QR kodu tekrar taratın.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-40 relative font-sans">
      {flyingItems.map(flyer => (
        <div key={flyer.id} className="fixed pointer-events-none z-[100] animate-fly-to-cart-dynamic" style={{ left: flyer.startX, top: flyer.startY, '--end-x': flyer.endX + 'px', '--end-y': flyer.endY + 'px' } as any}>
          <div className="w-16 h-16 rounded-full border-4 border-white shadow-xl bg-cover bg-center" style={{ backgroundImage: `url(${flyer.image})` }} />
        </div>
      ))}

      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-slate-100 p-5">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-orange-600 text-white p-2 rounded-xl shadow-lg shadow-orange-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
             </div>
             <div>
                <h1 className="text-base font-black text-slate-900 leading-none">MASA #{tableId}</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">LEZZETKARE MENÜ</p>
             </div>
          </div>
          
          <div className="flex gap-2">
            {hasOrders && (
                <button 
                onClick={() => navigate(`/table/${tableId}/history`)} 
                className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl shadow-sm text-slate-400 flex items-center gap-2 hover:bg-slate-100 transition-all"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </button>
            )}
            {/* YENİ: Garson Çağır Butonu (Header) */}
            <button 
                onClick={() => setIsHelpOpen(true)}
                className="bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-orange-100 shadow-sm flex items-center gap-2 font-black text-[10px] active:scale-95 transition-all"
            >
                YARDIM 🛎️
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto whitespace-nowrap mt-4 flex gap-2 scrollbar-hide pb-1 px-1">
          <button onClick={() => setActiveCategory('Tümü')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all ${activeCategory === 'Tümü' ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>TÜMÜ</button>
          {Object.values(Category).map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all ${activeCategory === cat ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{cat.toUpperCase()}</button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6 space-y-4">
        {filteredItems.map(item => {
          const basePrice = priceOverrides[item.id] !== undefined ? priceOverrides[item.id] : item.price;
          const finalPrice = getFinalPrice(item);
          const hasActiveDiscount = finalPrice < basePrice;
          const isDisabled = disabledItems.includes(item.id);

          return (
            <div key={item.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-4 p-4 relative overflow-hidden transition-all ${isDisabled ? 'opacity-50 grayscale' : 'hover:border-orange-100 active:scale-[0.98]'}`}>
              {hasActiveDiscount && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-[1.5rem] shadow-lg animate-pulse z-10">
                   FIRSAT
                </div>
              )}
              <div className="w-24 h-24 flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-[1.8rem] shadow-sm" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                    <h3 className="font-black text-slate-900 leading-tight text-sm">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight line-clamp-2 mt-0.5">{item.description}</p>
                </div>
                <div className="flex justify-between items-end mt-2">
                   <div className="flex flex-col">
                      {hasActiveDiscount && <span className="text-[10px] text-slate-300 line-through font-bold">{basePrice}₺</span>}
                      <span className={`${hasActiveDiscount ? 'text-purple-600' : 'text-orange-600'} font-black text-lg leading-none`}>{finalPrice}₺</span>
                   </div>
                   <button 
                     onClick={(e) => addToCart(e, item)} 
                     disabled={isDisabled} 
                     className={`py-2 px-6 rounded-xl text-[10px] font-black transition-all shadow-md ${isDisabled ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white active:scale-90 hover:bg-orange-600'}`}
                   >
                     {isDisabled ? 'TÜKENDİ' : '+ EKLE'}
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL: Garson Çağır / Hesap İste */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={() => setIsHelpOpen(false)}>
            <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 text-center animate-modal-in" onClick={e => e.stopPropagation()}>
                <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto mb-6">🛎️</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Size Nasıl Yardımcı Olabiliriz?</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Masa #{tableId}</p>
                
                <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={() => handleTableRequest(RequestType.WAITER)}
                        disabled={!!helpLoading}
                        className="bg-orange-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {helpLoading === RequestType.WAITER ? 'ÇAĞRILIYOR...' : 'GARSON ÇAĞIR 🙋‍♂️'}
                    </button>
                    <button 
                        onClick={() => handleTableRequest(RequestType.BILL)}
                        disabled={!!helpLoading}
                        className="bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {helpLoading === RequestType.BILL ? 'İSTENİYOR...' : 'HESAP İSTE 💳'}
                    </button>
                    <button onClick={() => setIsHelpOpen(false)} className="text-[10px] font-black text-slate-300 uppercase mt-4">KAPAT</button>
                </div>
            </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-5 bg-white/95 border-t border-slate-100 shadow-2xl backdrop-blur-md">
          <div className="max-w-xl mx-auto">
            <button 
              onClick={() => setShowCartReview(true)} 
              className={`w-full bg-orange-600 text-white py-4 rounded-[2rem] font-black text-lg shadow-xl shadow-orange-200 flex justify-between px-8 transition-all active:scale-95 ${cartPulse ? 'scale-105' : ''}`}
            >
               <span className="font-black">{totalAmount}₺</span>
               <span className="flex items-center gap-2 text-sm uppercase tracking-widest">SİPARİŞİ GÖR <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></span>
            </button>
          </div>
        </div>
      )}

      {showCartReview && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-end p-0" onClick={() => setShowCartReview(false)}>
          <div className="bg-white rounded-t-[3rem] w-full max-h-[90vh] flex flex-col p-8 space-y-6 shadow-2xl transform animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">Masa #{tableId}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sipariş Özeti</p>
               </div>
               <button onClick={() => setShowCartReview(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 items-center">
                  <img src={item.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={item.name} />
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-xs leading-none mb-1">{item.name}</h4>
                    <p className="text-orange-600 font-black text-sm">{item.price * item.quantity}₺</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => { 
                      setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0));
                    }} className="w-6 h-6 font-black text-slate-300 hover:text-orange-600 transition-colors">-</button>
                    <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                    <button onClick={() => {
                       setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
                    }} className="w-6 h-6 font-black text-orange-600 transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6 px-1">
                 <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Toplam Ödenecek</span>
                 <span className="text-3xl font-black text-slate-900">{totalAmount}₺</span>
              </div>
              <button 
                onClick={handlePlaceOrder} 
                disabled={isOrdering} 
                className="w-full bg-orange-600 text-white py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-100 active:scale-[0.98] transition-all"
              >
                  {isOrdering ? 'MUTFAĞA GÖNDERİLİYOR...' : 'SİPARİŞİ ONAYLA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIChatWidget 
        cart={cart} 
        tableId={tableId || ''} 
        history={orderHistory} 
        menu={dynamicMenu} 
      />

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes flyToCartDynamic { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { left: var(--end-x); top: var(--end-y); transform: translate(-50%, -50%) scale(0.1); opacity: 0; } }
        .animate-fly-to-cart-dynamic { animation: flyToCartDynamic 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal-in { animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CustomerView;
