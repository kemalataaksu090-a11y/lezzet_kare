
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, MENU_ITEMS, Category, MenuItem, DiscountRule, TableRequest, RequestType } from '../types';
import { authService } from '../services/authService';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [disabledItems, setDisabledItems] = useState<string[]>([]);
  
  const [dynamicMenu, setDynamicMenu] = useState<MenuItem[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, DiscountRule>>({});
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category: Category.KEBAB,
    image: ''
  });

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    cost: '',
    category: Category.KEBAB,
    image: ''
  });

  const [editingPriceItem, setEditingPriceItem] = useState<MenuItem | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<string>('');
  
  const [editingDiscountItem, setEditingDiscountItem] = useState<MenuItem | null>(null);
  const [discountForm, setDiscountForm] = useState<DiscountRule>({
    itemId: '',
    discountPercent: 0,
    days: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '22:00',
    isActive: true
  });
  
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'tables'>('orders');

  // Günü Bitir & Bildirim State'leri
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dailyReport, setDailyReport] = useState<{
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    completedCount: number;
  }>({ totalRevenue: 0, totalCost: 0, netProfit: 0, completedCount: 0 });
  
  const [tableRequests, setTableRequests] = useState<TableRequest[]>([]);

  const loadDatabase = () => {
    const savedMenu = localStorage.getItem('dynamic_menu');
    if (savedMenu) {
      setDynamicMenu(JSON.parse(savedMenu));
    } else {
      localStorage.setItem('dynamic_menu', JSON.stringify(MENU_ITEMS));
      setDynamicMenu(MENU_ITEMS);
    }

    const ordersStr = localStorage.getItem('orders');
    if (ordersStr) {
      const parsed: Order[] = JSON.parse(ordersStr);
      setOrders(parsed.sort((a, b) => b.timestamp - a.timestamp));
    }

    const requestsStr = localStorage.getItem('table_requests');
    if (requestsStr) {
        setTableRequests(JSON.parse(requestsStr));
    }

    setPriceOverrides(JSON.parse(localStorage.getItem('menu_prices') || '{}'));
    
    const rawDiscounts = JSON.parse(localStorage.getItem('menu_discounts') || '{}');
    const migratedDiscounts: Record<string, DiscountRule> = {};
    Object.keys(rawDiscounts).forEach(id => {
        if (typeof rawDiscounts[id] === 'number') {
            migratedDiscounts[id] = {
                itemId: id,
                discountPercent: rawDiscounts[id],
                days: [0, 1, 2, 3, 4, 5, 6],
                startTime: '00:00',
                endTime: '23:59',
                isActive: true
            };
        } else {
            migratedDiscounts[id] = rawDiscounts[id];
        }
    });
    setItemDiscounts(migratedDiscounts);
    
    setDisabledItems(JSON.parse(localStorage.getItem('disabled_menu_items') || '[]'));
  };

  useEffect(() => {
    loadDatabase();
    window.addEventListener('storage', loadDatabase);
    const interval = setInterval(loadDatabase, 4000);
    return () => { 
      clearInterval(interval); 
      window.removeEventListener('storage', loadDatabase); 
    };
  }, []);

  const handleEndDay = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const todaysOrders = orders.filter(o => o.timestamp >= startOfDay && o.status === OrderStatus.COMPLETED);
    
    let totalRevenue = 0;
    let totalCost = 0;
    let completedCount = todaysOrders.length;

    todaysOrders.forEach(order => {
        totalRevenue += order.totalAmount;
        order.items.forEach(item => {
            // Dinamik menüden güncel maliyeti çekmeye çalış, yoksa siparişteki maliyeti kullan
            const menuItem = dynamicMenu.find(m => m.id === item.id);
            const cost = menuItem ? menuItem.cost : (item.cost || 0);
            totalCost += (cost * item.quantity);
        });
    });

    setDailyReport({
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      completedCount
    });
    setIsSummaryOpen(true);
  };

  const resolveRequest = (id: string) => {
      const updated = tableRequests.filter(r => r.id !== id);
      localStorage.setItem('table_requests', JSON.stringify(updated));
      setTableRequests(updated);
      window.dispatchEvent(new Event('storage'));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (mode === 'add') setNewItem(prev => ({ ...prev, image: base64 }));
        else setEditForm(prev => ({ ...prev, image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
      alert("Lütfen ürün adı ve fiyat alanlarını doldurun.");
      return;
    }
    const itemToAdd: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      cost: parseFloat(newItem.cost) || 0,
      category: newItem.category,
      image: newItem.image || DEFAULT_FOOD_IMAGE
    };

    setDynamicMenu(prev => {
      const updated = [...prev, itemToAdd];
      localStorage.setItem('dynamic_menu', JSON.stringify(updated));
      return updated;
    });

    setIsAddModalOpen(false);
    setNewItem({ name: '', description: '', price: '', cost: '', category: Category.KEBAB, image: '' });
    window.dispatchEvent(new Event('storage'));
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description,
      cost: item.cost?.toString() || '0',
      category: item.category,
      image: item.image
    });
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    if (!editForm.name) {
      alert("Ürün adı boş olamaz.");
      return;
    }

    setDynamicMenu(prev => {
      const updated = prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...editForm, cost: parseFloat(editForm.cost) || 0, image: editForm.image || DEFAULT_FOOD_IMAGE }
          : item
      );
      localStorage.setItem('dynamic_menu', JSON.stringify(updated));
      return updated;
    });

    setEditingItem(null);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteItem = (id: string) => {
    if (!window.confirm("Bu ürünü menüden silmek istediğinize emin misiniz?")) return;
    
    setDynamicMenu(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('dynamic_menu', JSON.stringify(updated));
      return updated;
    });

    const newPrices = { ...priceOverrides }; delete newPrices[id];
    const newDiscounts = { ...itemDiscounts }; delete newDiscounts[id];
    localStorage.setItem('menu_prices', JSON.stringify(newPrices));
    localStorage.setItem('menu_discounts', JSON.stringify(newDiscounts));
    
    window.dispatchEvent(new Event('storage'));
  };

  const saveNewPrice = () => {
    if (!editingPriceItem) return;
    const priceNum = parseFloat(newPriceValue.replace(',', '.'));
    if (isNaN(priceNum)) return;
    const updated = { ...priceOverrides, [editingPriceItem.id]: priceNum };
    localStorage.setItem('menu_prices', JSON.stringify(updated));
    setPriceOverrides(updated);
    setEditingPriceItem(null);
    window.dispatchEvent(new Event('storage'));
  };

  const startEditingDiscount = (item: MenuItem) => {
      setEditingDiscountItem(item);
      const existing = itemDiscounts[item.id];
      if (existing) {
          setDiscountForm(existing);
      } else {
          setDiscountForm({
              itemId: item.id,
              discountPercent: 0,
              days: [0, 1, 2, 3, 4, 5, 6],
              startTime: '00:00',
              endTime: '23:59',
              isActive: true
          });
      }
  };

  const saveNewDiscount = () => {
    if (!editingDiscountItem) return;
    const updated = { ...itemDiscounts, [editingDiscountItem.id]: discountForm };
    localStorage.setItem('menu_discounts', JSON.stringify(updated));
    setItemDiscounts(updated);
    setEditingDiscountItem(null);
    window.dispatchEvent(new Event('storage'));
  };

  const toggleDay = (day: number) => {
      setDiscountForm(prev => ({
          ...prev,
          days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
      }));
  };

  const isRuleActiveNow = (rule: DiscountRule) => {
      if (!rule.isActive) return false;
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 100 + now.getMinutes();
      const [sh, sm] = rule.startTime.split(':').map(Number);
      const [eh, em] = rule.endTime.split(':').map(Number);
      const start = sh * 100 + sm;
      const end = eh * 100 + em;
      return rule.days.includes(day) && time >= start && time <= end;
  };

  const toggleAvailability = (id: string) => {
    const updated = disabledItems.includes(id) 
        ? disabledItems.filter(i => i !== id) 
        : [...disabledItems, id];
    localStorage.setItem('disabled_menu_items', JSON.stringify(updated));
    setDisabledItems(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const updateStatus = (orderId: string, newStatus: OrderStatus) => {
    const all: Order[] = JSON.parse(localStorage.getItem('orders') || '[]');
    const updated = all.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    localStorage.setItem('orders', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    loadDatabase();
  };

  const activeRequests = tableRequests.filter(r => !r.isResolved);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* MODAL: Bildirim Paneli (Masa Çağrıları) */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsNotificationsOpen(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 animate-modal-in flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="text-orange-600">🔔</span> Masa Çağrıları
                    </h3>
                    <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 font-bold">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                    {activeRequests.length === 0 ? (
                        <div className="py-12 text-center opacity-30">
                            <span className="text-4xl block mb-2">🎉</span>
                            <p className="text-xs font-black uppercase">Tüm masalar mutlu!</p>
                        </div>
                    ) : (
                        activeRequests.map(req => (
                            <div key={req.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between group">
                                <div>
                                    <h4 className="font-black text-slate-900">MASA #{req.tableId}</h4>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${req.type === RequestType.BILL ? 'text-purple-600' : 'text-orange-600'}`}>
                                        {req.type}
                                    </p>
                                    <span className="text-[8px] text-slate-400 font-bold">{new Date(req.timestamp).toLocaleTimeString('tr-TR')}</span>
                                </div>
                                <button 
                                    onClick={() => resolveRequest(req.id)}
                                    className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg shadow-emerald-200 active:scale-90 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* MODAL: Günlük Özet (Günü Bitir) */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsSummaryOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-modal-in overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600"></div>
            
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">📊</div>
                <h3 className="text-2xl font-black text-slate-900">Finansal Rapor</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="space-y-3 mb-8">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOPLAM CİRO</span>
                    <span className="text-xl font-black text-slate-900">{dailyReport.totalRevenue}₺</span>
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">TOPLAM MALİYET</span>
                    <span className="text-xl font-black text-rose-600">-{dailyReport.totalCost}₺</span>
                </div>
                <div className={`p-6 rounded-[2rem] border-2 text-center transition-all ${dailyReport.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">NET KÂR</span>
                    <span className={`text-4xl font-black ${dailyReport.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{dailyReport.netProfit}₺</span>
                </div>
            </div>

            <button 
                onClick={() => setIsSummaryOpen(false)} 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all"
            >
                RAPORU KAPAT
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Ürün Ekle */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-modal-in overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <span className="bg-orange-600 w-2 h-8 rounded-full"></span>
               Yeni Ürün Ekle
            </h3>
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="relative w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-slate-100"
              >
                {newItem.image ? (
                  <img src={newItem.image} className="w-full h-full object-cover" alt="önizleme" />
                ) : (
                  <div className="text-center">
                    <span className="text-slate-400 font-bold text-xs uppercase block mb-1">GÖRSEL SEÇ</span>
                    <span className="text-slate-300 text-[9px] uppercase font-black">(İSTEĞE BAĞLI)</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'add')} />
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ürün Adı *</label>
                    <input type="text" placeholder="Örn: Kebap" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:border-orange-500" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kategori</label>
                    <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as Category})}>
                      {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Satış Fiyatı (₺) *</label>
                    <input type="number" placeholder="0.00" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:border-orange-500" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Maaliyet (₺)</label>
                    <input type="number" placeholder="0.00" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:border-orange-500" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} />
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kısa Açıklama</label>
                <textarea placeholder="Lezzet detayları..." className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none h-24" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
              </div>
              
              <div className="flex gap-4 pt-2">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black uppercase text-xs">VAZGEÇ</button>
                <button onClick={handleAddItem} className="flex-2 bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-orange-100">ÜRÜNÜ EKLE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ürün Düzenle */}
      {editingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingItem(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-modal-in overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <span className="bg-blue-600 w-2 h-8 rounded-full"></span>
               Ürünü Düzenle
            </h3>
            <div className="space-y-6">
              <div 
                onClick={() => editFileInputRef.current?.click()} 
                className="relative w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-slate-100 group"
              >
                <img src={editForm.image || DEFAULT_FOOD_IMAGE} className="w-full h-full object-cover" alt="düzenlenen görsel" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white font-black text-xs uppercase tracking-widest">DEĞİŞTİR</span>
                </div>
              </div>
              <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'edit')} />
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ürün Adı</label>
                    <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:border-blue-500" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Maaliyet (₺)</label>
                    <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:border-blue-500" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})} />
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Açıklama</label>
                <textarea className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none h-32" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>
              
              <div className="flex gap-4 pt-2">
                <button onClick={() => setEditingItem(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black uppercase text-xs">VAZGEÇ</button>
                <button onClick={handleUpdateItem} className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100">GÜNCELLE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fiyat Değiştir */}
      {editingPriceItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingPriceItem(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 animate-modal-in text-center">
            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-widest">{editingPriceItem.name} <br/> Yeni Fiyat</h3>
            <input type="text" autoFocus className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-4xl font-black text-center mb-8 outline-none" value={newPriceValue} onChange={(e) => setNewPriceValue(e.target.value)} />
            <div className="flex gap-4">
               <button onClick={() => setEditingPriceItem(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black uppercase text-xs">İPTAL</button>
               <button onClick={saveNewPrice} className="flex-2 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs">GÜNCELLE</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Gelişmiş İndirim Tanımla */}
      {editingDiscountItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingDiscountItem(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-modal-in overflow-y-auto max-h-[95vh]">
            <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Akıllı İndirim <span className="text-xs text-slate-400 block font-bold">{editingDiscountItem.name}</span></h3>
            
            <div className="space-y-6">
                <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100">
                    <label className="block text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 text-center">İndirim Oranı</label>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-4xl font-black text-purple-600">%</span>
                        <input type="number" className="w-24 bg-white border-2 border-purple-200 rounded-2xl px-4 py-3 text-3xl font-black text-center outline-none focus:border-purple-600" value={discountForm.discountPercent} onChange={e => setDiscountForm({...discountForm, discountPercent: parseInt(e.target.value) || 0})} />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geçerli Günler</label>
                    <div className="grid grid-cols-7 gap-1.5">
                        {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, idx) => (
                            <button key={day} onClick={() => toggleDay(idx)} className={`py-3 rounded-xl text-[9px] font-black transition-all border-2 ${discountForm.days.includes(idx) ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-orange-200'}`}>
                                {day.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Başlangıç</label>
                        <input type="time" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:border-orange-500" value={discountForm.startTime} onChange={e => setDiscountForm({...discountForm, startTime: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bitiş</label>
                        <input type="time" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none focus:border-orange-500" value={discountForm.endTime} onChange={e => setDiscountForm({...discountForm, endTime: e.target.value})} />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setEditingDiscountItem(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black uppercase text-xs">İPTAL</button>
                   <button onClick={saveNewDiscount} className="flex-2 bg-purple-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-purple-100">KAYDET</button>
                </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <button 
                onClick={() => navigate('/')} 
                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100 active:scale-90"
                title="Ana Sayfaya Geri Dön"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">LezzetKare Panel</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Yönetim Portalı</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            {[
              { id: 'orders', label: 'SİPARİŞLER', icon: '🥘' },
              { id: 'menu', label: 'MENÜ', icon: '📋' },
              { id: 'tables', label: 'MASALAR', icon: '📱' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="text-sm">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsNotificationsOpen(true)}
               className={`relative p-3.5 rounded-2xl border transition-all ${activeRequests.length > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {activeRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{activeRequests.length}</span>
                )}
             </button>

             <button 
               onClick={handleEndDay} 
               className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest border border-emerald-100 uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
             >
                <span className="text-sm">📊</span> GÜNÜ BİTİR
             </button>
             <button 
               onClick={() => { authService.logout(); navigate('/login'); }} 
               className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest border border-rose-100 uppercase hover:bg-rose-600 hover:text-white transition-all"
             >
                ÇIKIŞ
             </button>
          </div>
        </header>

        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {orders.map(order => (
              <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-lg border-t-8 overflow-hidden transition-all ${order.status === OrderStatus.PENDING ? 'border-orange-500' : 'border-slate-200 opacity-60'}`}>
                <div className="p-8">
                  <h2 className="text-3xl font-black text-slate-900 mb-1">MASA {order.tableId}</h2>
                  <p className="text-[10px] font-mono text-slate-300 mb-6 uppercase tracking-widest">REF: {order.id.slice(-6).toUpperCase()}</p>
                  <div className="space-y-2 mb-6">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{item.quantity}x {item.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{item.price * item.quantity}₺</span>
                        </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end mb-6">
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest">TOPLAM</span>
                      <span className="text-3xl font-black text-slate-900">{order.totalAmount}₺</span>
                  </div>
                  {order.status === OrderStatus.PENDING && (
                    <button onClick={() => updateStatus(order.id, OrderStatus.READY)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-50">MUTFAK TAMAM</button>
                  )}
                  {order.status === OrderStatus.READY && (
                    <button onClick={() => updateStatus(order.id, OrderStatus.COMPLETED)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">TESLİM EDİLDİ</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 px-4">Menü Yönetimi</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl hover:scale-105 transition-all">+ YENİ ÜRÜN EKLE</button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dynamicMenu.map(item => {
                   const basePrice = priceOverrides[item.id] !== undefined ? priceOverrides[item.id] : item.price;
                   const discountRule = itemDiscounts[item.id];
                   const isActiveNow = discountRule ? isRuleActiveNow(discountRule) : false;
                   const discountedPrice = discountRule ? Math.round(basePrice * (1 - discountRule.discountPercent / 100)) : basePrice;
                   const isSoldOut = disabledItems.includes(item.id);

                   return (
                    <div key={item.id} className={`p-6 bg-white rounded-[2.5rem] border-2 border-slate-100 flex flex-col gap-6 relative transition-all ${isSoldOut ? 'opacity-60 grayscale' : 'hover:border-orange-100'}`}>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <img src={item.image || DEFAULT_FOOD_IMAGE} className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-50" alt={item.name} />
                             <div>
                                <h4 className="font-black text-slate-900 text-sm leading-tight">{item.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{item.category}</p>
                                <p className="text-[9px] font-black text-rose-400 uppercase mt-1">Maliyet: {item.cost}₺</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {discountRule && discountRule.discountPercent > 0 ? (
                                <div>
                                    <p className={`text-2xl font-black ${isActiveNow ? 'text-purple-600' : 'text-slate-300'}`}>
                                        {discountedPrice}₺ 
                                        <span className="text-[10px] text-slate-300 line-through block">({basePrice})</span>
                                    </p>
                                </div>
                             ) : (
                                <p className="text-2xl font-black text-slate-900">{basePrice}₺</p>
                             )}
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-5 gap-1.5">
                          <button onClick={() => handleStartEdit(item)} className="px-1 py-4 rounded-xl bg-blue-50 text-blue-600 font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">DÜZENLE</button>
                          <button onClick={() => toggleAvailability(item.id)} className={`px-1 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isSoldOut ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                             {isSoldOut ? 'STOKTA' : 'YOK'}
                          </button>
                          <button onClick={() => { setEditingPriceItem(item); setNewPriceValue(basePrice.toString()); }} className="px-1 py-4 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest">FİYAT</button>
                          <button onClick={() => startEditingDiscount(item)} className={`px-1 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${discountRule && discountRule.discountPercent > 0 ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-50 text-purple-600'}`}>İNDİRİM</button>
                          <button onClick={() => handleDeleteItem(item.id)} className="px-1 py-4 rounded-xl bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest">SİL</button>
                       </div>
                    </div>
                   );
                })}
             </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {Array.from({ length: 12 }, (_, i) => i + 1).map(num => {
                const url = `${window.location.origin}${window.location.pathname}#/table/${num}`;
                return (
                  <div key={num} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col group hover:border-orange-500 transition-all">
                     <div className="flex items-center gap-3 mb-6">
                        <span className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white shadow-lg group-hover:bg-orange-600 transition-all">{num}</span>
                        <h4 className="font-black text-slate-900 uppercase">Masa {num}</h4>
                     </div>
                     <button onClick={() => { navigator.clipboard.writeText(url); alert(`Masa ${num} linki kopyalandı!`); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group-hover:bg-orange-600">
                        KOPYALA
                     </button>
                  </div>
                );
             })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal-in { animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default CashierDashboard;
