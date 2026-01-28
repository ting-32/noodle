
import React, { useState } from 'react';
import { Store, Product, StoreDefaultItem } from '../types';
import { Settings, UserPlus, Trash2, Edit2, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Phone, Package, Plus, Minus } from 'lucide-react';

interface StoreManagementProps {
  stores: Store[];
  products: Product[]; // 需要產品清單供下拉選擇
  onUpdateStores: (stores: Store[]) => void;
}

const StoreManagement: React.FC<StoreManagementProps> = ({ stores, products, onUpdateStores }) => {
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [newStore, setNewStore] = useState<Store>({ storeName: '', phone: '', holidayDates: [], deliveryTime: '08:00', defaultItems: [] });
  const [isAdding, setIsAdding] = useState(false);
  
  const [viewDate, setViewDate] = useState(new Date());

  // 輔助函式：確保時間字串為 00:00 格式 (24小時制)
  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "08:00";
    // 使用正則表達式尋找 hh:mm 模式，排除日期干擾
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      return `${h}:${m}`;
    }
    return timeStr.substring(0, 5);
  };

  const toggleHoliday = (store: Store, dateStr: string) => {
    let updatedDates: string[];
    if (store.holidayDates.includes(dateStr)) {
      updatedDates = store.holidayDates.filter(d => d !== dateStr);
    } else {
      updatedDates = [...store.holidayDates, dateStr].sort();
    }
    
    const updatedStore = { ...store, holidayDates: updatedDates };
    if (editingStore) setEditingStore(updatedStore);
    else setNewStore(updatedStore);
  };

  const handleSaveEdit = () => {
    if (!editingStore) return;
    onUpdateStores(stores.map(s => s.storeName === editingStore.storeName ? editingStore : s));
    setEditingStore(null);
  };

  const handleAddStore = () => {
    if (!newStore.storeName) return;
    if (stores.some(s => s.storeName === newStore.storeName)) {
      alert("店名重複了，請檢查！");
      return;
    }
    onUpdateStores([...stores, newStore]);
    setNewStore({ storeName: '', phone: '', holidayDates: [], deliveryTime: '08:00', defaultItems: [] });
    setIsAdding(false);
  };

  // 預設品項管理
  const addDefaultItem = (store: Store) => {
    const updated = { 
      ...store, 
      defaultItems: [...(store.defaultItems || []), { itemName: '', quantity: 1 }] 
    };
    if (editingStore) setEditingStore(updated);
    else setNewStore(updated);
  };

  const removeDefaultItem = (store: Store, index: number) => {
    const updated = { 
      ...store, 
      defaultItems: (store.defaultItems || []).filter((_, i) => i !== index) 
    };
    if (editingStore) setEditingStore(updated);
    else setNewStore(updated);
  };

  const updateDefaultItem = (store: Store, index: number, field: keyof StoreDefaultItem, value: any) => {
    const newDefaults = [...(store.defaultItems || [])];
    newDefaults[index] = { ...newDefaults[index], [field]: value };
    const updated = { ...store, defaultItems: newDefaults };
    if (editingStore) setEditingStore(updated);
    else setNewStore(updated);
  };

  const renderCalendar = (currentStore: Store) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 md:h-12 bg-slate-50/50 rounded-lg"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isHoliday = currentStore.holidayDates.includes(dateStr);
      
      days.push(
        <button
          key={d}
          type="button"
          onClick={() => toggleHoliday(currentStore, dateStr)}
          className={`h-10 md:h-12 border rounded-lg flex flex-col items-center justify-center transition-all text-sm font-bold relative
            ${isHoliday 
              ? 'bg-red-500 text-white border-red-600 shadow-inner scale-95' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 active:scale-90'}`}
        >
          {d}
          {isHoliday && <span className="text-[8px] font-black absolute bottom-1">公休</span>}
        </button>
      );
    }
    return days;
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const currentStore = editingStore || newStore;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            店家與配送管理
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">設定店家的聯絡資訊、公休日以及預設配送時間，系統將自動套用至訂單。</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingStore(null); }} 
          className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
        >
          <UserPlus className="w-4 h-4" /> 新增店家
        </button>
      </div>

      {(isAdding || editingStore) && (
        <div className="bg-white p-8 rounded-3xl border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <button onClick={() => { setIsAdding(false); setEditingStore(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-lg ${isAdding ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {isAdding ? <UserPlus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            </div>
            <h3 className="font-black text-2xl text-slate-800">
              {isAdding ? '建立新店家' : `編輯資料：${editingStore?.storeName}`}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">店家名稱</label>
              <input
                type="text"
                placeholder="店名 (不可重複)"
                disabled={!!editingStore}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 text-slate-900 font-bold transition-all"
                value={currentStore.storeName}
                onChange={e => !editingStore && setNewStore({ ...newStore, storeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> 聯絡電話
              </label>
              <input
                type="text"
                placeholder="聯絡電話"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold transition-all"
                value={currentStore.phone}
                onChange={e => editingStore ? setEditingStore({ ...editingStore, phone: e.target.value }) : setNewStore({ ...newStore, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 配送時間 (24小時制)
              </label>
              <input
                type="time"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold transition-all"
                value={formatDisplayTime(currentStore.deliveryTime)}
                onChange={e => {
                  const val = e.target.value.substring(0, 5); 
                  editingStore ? setEditingStore({ ...editingStore, deliveryTime: val }) : setNewStore({ ...newStore, deliveryTime: val });
                }}
              />
            </div>
          </div>

          {/* 預設品項設定區 */}
          <div className="mb-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
             <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  預設品項 (常用清單)
                </label>
                <button 
                  type="button" 
                  onClick={() => addDefaultItem(currentStore)}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-4 h-4" /> 新增預設
                </button>
             </div>
             <p className="text-xs text-slate-500 mb-4">設定後，在訂單輸入頁面選擇此店家時，系統將自動填入下列品項與數量。</p>
             
             <div className="space-y-3">
               {(currentStore.defaultItems || []).map((item, idx) => (
                 <div key={idx} className="flex gap-3 items-center">
                    <select
                      value={item.itemName}
                      onChange={e => updateDefaultItem(currentStore, idx, 'itemName', e.target.value)}
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- 選擇品項 --</option>
                      {products.map(p => <option key={p.itemName} value={p.itemName}>{p.itemName} ({p.unit})</option>)}
                    </select>
                    <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                      <button type="button" onClick={() => updateDefaultItem(currentStore, idx, 'quantity', Math.max(1, item.quantity - 1))} className="p-1.5 text-slate-400 hover:text-indigo-600"><Minus className="w-3.5 h-3.5" /></button>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateDefaultItem(currentStore, idx, 'quantity', Number(e.target.value))}
                        className="w-12 text-center font-black text-sm outline-none bg-transparent"
                      />
                      <button type="button" onClick={() => updateDefaultItem(currentStore, idx, 'quantity', item.quantity + 1)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button type="button" onClick={() => removeDefaultItem(currentStore, idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
               ))}
               {(currentStore.defaultItems || []).length === 0 && (
                 <div className="text-center py-6 text-slate-400 text-xs italic border-2 border-dashed border-indigo-100 rounded-2xl">
                    尚未設定預設品項
                 </div>
               )}
             </div>
          </div>

          <div className="bg-slate-50/50 p-6 md:p-8 rounded-3xl mb-8 border border-slate-100 ring-1 ring-slate-200/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <label className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-red-500" />
                  公休日期設定
                </label>
              </div>
              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-base font-black text-slate-800 min-w-[120px] text-center">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</span>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-all"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pb-3">{d}</div>
              ))}
              {renderCalendar(currentStore)}
            </div>
          </div>

          <div className="flex justify-end items-center gap-4">
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setEditingStore(null); }} 
              className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
            >
              取消返回
            </button>
            <button 
              type="button" 
              onClick={isAdding ? handleAddStore : handleSaveEdit} 
              className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
            >
              確認儲存設定
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <div key={store.storeName} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{store.storeName}</h3>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Phone className="w-3.5 h-3.5" /> {store.phone || '尚未提供電話'}
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-black w-fit">
                      <Clock className="w-3.5 h-3.5" /> 配送：{formatDisplayTime(store.deliveryTime)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                  <button 
                    onClick={() => { setEditingStore({ ...store }); setIsAdding(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => { if(confirm(`確定要刪除「${store.storeName}」嗎？`)) onUpdateStores(stores.filter(s => s.storeName !== store.storeName)) }} 
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-50 space-y-3">
                {/* 預設品項預覽 */}
                <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">預設品項 ({store.defaultItems?.length || 0})</span>
                   <div className="flex flex-wrap gap-1">
                     {store.defaultItems && store.defaultItems.length > 0 ? (
                       store.defaultItems.map((item, i) => (
                         <span key={i} className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                           {item.itemName} x{item.quantity}
                         </span>
                       ))
                     ) : (
                       <span className="text-[9px] text-slate-300 italic">無</span>
                     )}
                   </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">已設公休日 ({store.holidayDates.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {store.holidayDates.length > 0 ? (
                      <>
                        {store.holidayDates.slice(0, 3).map(d => (
                          <span key={d} className="text-[10px] font-black bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100/50">
                            {d.split('-').slice(1).join('/')}
                          </span>
                        ))}
                        {store.holidayDates.length > 3 && (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            +{store.holidayDates.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic font-medium">無</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreManagement;
