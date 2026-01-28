
import React, { useState, useId, useMemo, useRef, useEffect } from 'react';
import { Store, Product, Order } from '../types';
import { 
  PlusCircle, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  Trash2, 
  Plus, 
  Store as StoreIcon, 
  Package, 
  Minus, 
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Eraser,
  AlertTriangle,
  X
} from 'lucide-react';

interface OrderItemRow {
  itemName: string;
  quantity: number | '';
}

interface OrderFormProps {
  stores: Store[];
  products: Product[];
  existingOrders: Order[]; // 新增：傳入現有訂單進行比對
  onAddOrder: (order: Order) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ stores, products, existingOrders, onAddOrder }) => {
  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return "08:00";
    const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      return `${h}:${m}`;
    }
    return "08:00";
  };

  const [date, setDate] = useState(getLocalDateString());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(date));
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [storeName, setStoreName] = useState('');
  const [rows, setRows] = useState<OrderItemRow[]>([{ itemName: '', quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 重複檢查專用狀態
  const [duplicateWarning, setDuplicateWarning] = useState<{
    rows: Order[];
  } | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const storeSelectId = useId();
  const timeInputId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [calendarViewDate]);

  const changeMonth = (e: React.MouseEvent, offset: number) => {
    e.stopPropagation();
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + offset, 1));
  };

  const availableStores = stores.filter(s => !s.holidayDates.includes(date));

  const handleDateSelect = (dStr: string) => {
    setDate(dStr);
    setShowCalendar(false);
  };

  const applyStoreDefaults = (name: string) => {
    const store = stores.find(s => s.storeName === name);
    if (store) {
      if (store.deliveryTime) {
        setDeliveryTime(formatTimeStr(store.deliveryTime));
      }
      
      if (store.defaultItems && store.defaultItems.length > 0) {
        setRows(store.defaultItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity
        })));
        return true;
      }
    }
    return false;
  };

  const handleStoreChange = (name: string) => {
    setStoreName(name);
    if (name) {
      const applied = applyStoreDefaults(name);
      if (applied) {
        showToast(`已套用「${name}」的常用設定`);
      } else {
        setRows([{ itemName: '', quantity: 1 }]);
      }
    }
  };

  const showToast = (text: string) => {
    const toast = document.createElement('div');
    toast.className = "fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-2xl z-[70] flex items-center gap-2 animate-in slide-in-from-bottom-4";
    toast.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> ${text}`;
    document.body.appendChild(toast);
    setTimeout(() => { 
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  };

  const addRow = () => {
    setRows([...rows, { itemName: '', quantity: 1 }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      setRows([{ itemName: '', quantity: 1 }]);
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const clearRows = () => {
    if (window.confirm("確定要清空目前明細嗎？")) {
      setRows([{ itemName: '', quantity: 1 }]);
    }
  };

  const updateRow = (index: number, field: keyof OrderItemRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const adjustQuantity = (index: number, delta: number) => {
    const currentQty = Number(rows[index].quantity) || 0;
    const newQty = Math.max(1, currentQty + delta);
    updateRow(index, 'quantity', newQty);
  };

  const getProductUnit = (itemName: string) => {
    return products.find(p => p.itemName === itemName)?.unit || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setError(null);

    if (!date || !storeName || !deliveryTime) {
      setError("請確認日期、店家與時間");
      return;
    }

    const validRows = rows.filter(r => r.itemName && r.quantity !== '' && Number(r.quantity) > 0);
    if (validRows.length === 0) {
      setError("請輸入有效的品項");
      return;
    }

    // 核心：重複檢測邏輯
    const duplicates: Order[] = [];
    validRows.forEach(row => {
      const isDup = existingOrders.some(o => 
        o.date === date && 
        o.storeName === storeName && 
        o.itemName === row.itemName
      );
      if (isDup) {
        duplicates.push({
          date,
          deliveryTime,
          storeName,
          itemName: row.itemName,
          quantity: Number(row.quantity),
          status: 'pending'
        });
      }
    });

    if (duplicates.length > 0) {
      // 發現重複，彈窗警告
      setDuplicateWarning({ rows: duplicates });
      return;
    }

    processSubmission(validRows);
  };

  const processSubmission = (validRows: any[]) => {
    setIsProcessing(true);
    validRows.forEach(row => {
      onAddOrder({
        date,
        deliveryTime: formatTimeStr(deliveryTime),
        storeName,
        itemName: row.itemName,
        quantity: Number(row.quantity),
        status: 'pending',
        isLocal: true
      });
    });

    setRows([{ itemName: '', quantity: 1 }]);
    setStoreName(''); 
    showToast(`成功加入 ${validRows.length} 筆項目`);
    setIsProcessing(false);
    setDuplicateWarning(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const getDayName = (dateStr: string) => {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return days[new Date(dateStr).getDay()];
  };

  const currentStore = stores.find(s => s.storeName === storeName);
  const hasDefaults = !!(currentStore?.defaultItems && currentStore.defaultItems.length > 0);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-visible transition-all">
      {/* 重複確認 Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800">發現重複品項！</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                <span className="text-indigo-600 font-bold">{storeName}</span> 在 <span className="text-indigo-600 font-bold">{date}</span> 已經點過以下品項：
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                {duplicateWarning.rows.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-xs font-black text-slate-600">
                    <span>{r.itemName}</span>
                    <span className="text-amber-600">已錄入</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-bold">是否確定要重複錄入相同品項？</p>
            </div>
            <div className="p-6 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 py-4 bg-white text-slate-600 font-black rounded-2xl border border-slate-200 active:scale-95 transition-all text-sm"
              >
                取消檢查
              </button>
              <button 
                onClick={() => processSubmission(rows.filter(r => r.itemName && r.quantity !== ''))}
                className="flex-1 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-100 active:scale-95 transition-all text-sm"
              >
                確定重複加入
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-5 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-slate-800">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          訂單錄入
        </h2>
        
        {storeName && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            {hasDefaults && (
              <button
                type="button"
                onClick={() => applyStoreDefaults(storeName)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-black hover:bg-indigo-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 恢復預設
              </button>
            )}
            <button
              type="button"
              onClick={clearRows}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-400 rounded-xl text-[11px] font-black hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" /> 清空
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 日期選擇 */}
          <div className="space-y-1.5 relative" ref={calendarRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">配送日期</label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={`w-full flex items-center justify-between pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl font-bold transition-all hover:bg-white ${showCalendar ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}
            >
              <CalendarIcon className={`w-4 h-4 absolute left-3.5 transition-colors ${showCalendar ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className="text-sm md:text-base text-slate-700">{date} <span className="text-indigo-500 ml-1 text-xs">{getDayName(date)}</span></span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCalendar ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            {showCalendar && (
              <div className="absolute top-full left-0 mt-2 w-full md:w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-200 z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={(e) => changeMonth(e, -1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                  <h4 className="font-black text-sm text-slate-800">{calendarViewDate.getFullYear()}年 {calendarViewDate.getMonth() + 1}月</h4>
                  <button type="button" onClick={(e) => changeMonth(e, 1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
                    <div key={d} className={`text-center text-[10px] font-black mb-2 ${i === 0 || i === 6 ? 'text-red-300' : 'text-slate-300'}`}>{d}</div>
                  ))}
                  {calendarDays.map((d, i) => {
                    if (!d) return <div key={`empty-${i}`} className="h-9" />;
                    const dStr = getLocalDateString(d);
                    const isSelected = date === dStr;
                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => handleDateSelect(dStr)}
                        className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50 active:bg-indigo-50'}`}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 店家選擇 */}
          <div className="space-y-1.5">
            <label htmlFor={storeSelectId} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 cursor-pointer">配送店家</label>
            <div className="relative">
              <select
                id={storeSelectId}
                value={storeName}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold appearance-none transition-all cursor-pointer hover:bg-white text-sm md:text-base"
              >
                <option value="">-- 請選擇店家 --</option>
                {availableStores.map(s => (
                  <option key={s.storeName} value={s.storeName}>{s.storeName}</option>
                ))}
              </select>
              <StoreIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 時間輸入 */}
          <div className="space-y-1.5">
            <label htmlFor={timeInputId} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 cursor-pointer">配送時間</label>
            <div className="relative">
              <input
                id={timeInputId}
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value.substring(0, 5))}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold transition-all cursor-pointer hover:bg-white text-sm md:text-base"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 品項清單 */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              錄入品項
            </h3>
            {storeName && hasDefaults && (
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 已帶入常用項目
              </span>
            )}
          </div>

          <div className="space-y-4">
            {rows.map((row, idx) => {
              const unit = getProductUnit(row.itemName);
              return (
                <div key={idx} className="flex flex-col md:flex-row gap-3 items-center animate-in slide-in-from-right-4 duration-300">
                  <div className="flex-1 w-full relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      list={`product-list-${idx}`}
                      placeholder="搜尋品項..."
                      value={row.itemName}
                      onChange={(e) => updateRow(idx, 'itemName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold shadow-sm text-sm"
                    />
                    <datalist id={`product-list-${idx}`}>
                      {products.map(p => (
                        <option key={p.itemName} value={p.itemName}>{p.itemName} ({p.unit})</option>
                      ))}
                    </datalist>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
                    <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                      <button type="button" onClick={() => adjustQuantity(idx, -1)} className="p-2.5 text-slate-500 hover:text-indigo-600 active:scale-90 transition-all"><Minus className="w-5 h-5" /></button>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateRow(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-14 bg-transparent border-none text-center font-black text-indigo-700 outline-none text-lg"
                      />
                      <button type="button" onClick={() => adjustQuantity(idx, 1)} className="p-2.5 text-slate-500 hover:text-indigo-600 active:scale-90 transition-all"><Plus className="w-5 h-5" /></button>
                    </div>
                    
                    {unit && (
                      <span className="text-xs font-black text-slate-400 min-w-[30px]">{unit}</span>
                    )}

                    <div className="flex-1"></div>

                    <button type="button" onClick={() => removeRow(idx)} className="p-3 text-slate-300 active:text-red-500 active:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            新增一個品項欄位
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 text-red-700 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold animate-in shake">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-50">
          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full md:w-auto px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 text-base"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            {isProcessing ? '處理中...' : '確認加入暫存'}
          </button>
        </div>
      </form>
    </div>
  );
};

import { Loader2 } from 'lucide-react';
export default OrderForm;
