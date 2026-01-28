
import React, { useState } from 'react';
import { Order } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Package, MapPin, X } from 'lucide-react';

interface CalendarViewProps {
  orders: Order[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ orders }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayOrders, setSelectedDayOrders] = useState<{date: string, orders: Order[]} | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  // 輔助函式：格式化時間
  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "08:00";
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      return `${h}:${m}`;
    }
    return timeStr.substring(0, 5);
  };

  // 訂單按日期分組
  const ordersByDate = orders.reduce((acc, order) => {
    if (!acc[order.date]) acc[order.date] = [];
    acc[order.date].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const days = [];
  // 填充月首空白
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/20 border-b border-r border-slate-100"></div>);
  }

  // 生成日期格
  for (let d = 1; d <= daysInMonth; d++) {
    // 嚴格對齊 YYYY-MM-DD 格式
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOrders = ordersByDate[dateStr] || [];
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    days.push(
      <div 
        key={d} 
        onClick={() => dayOrders.length > 0 && setSelectedDayOrders({date: dateStr, orders: dayOrders})}
        className={`min-h-[110px] p-2 border-b border-r border-slate-100 transition-all cursor-pointer group
          ${isToday ? 'bg-indigo-50/30' : 'bg-white'} 
          ${dayOrders.length > 0 ? 'hover:bg-indigo-50/50' : 'hover:bg-slate-50'}`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-sm font-bold ${isToday ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md ring-2 ring-indigo-100' : 'text-slate-500'}`}>
            {d}
          </span>
          {dayOrders.length > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm ${dayOrders.some(o => o.isLocal) ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'}`}>
                {dayOrders.length} 筆
              </span>
            </div>
          )}
        </div>
        <div className="space-y-1 overflow-hidden">
          {dayOrders.slice(0, 3).map((o, idx) => (
            <div key={idx} className="text-[10px] truncate bg-slate-50 px-1.5 py-1 rounded border border-slate-100 text-slate-700 flex justify-between group-hover:bg-white transition-colors">
              <span className="truncate font-medium">{o.storeName}</span>
              <span className="font-bold text-indigo-600 ml-1 shrink-0">{o.quantity}</span>
            </div>
          ))}
          {dayOrders.length > 3 && (
            <div className="text-[9px] text-center text-slate-400 font-bold py-1">＋ 還有 {dayOrders.length - 3} 項</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            配送排程行事曆
          </h2>
          <div className="flex items-center gap-4 mt-1 text-xs">
            <p className="text-slate-500">點擊日期查看明細</p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span className="text-amber-600 font-bold">待同步</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="text-indigo-600 font-bold">已同步</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-100 transition-all active:scale-95">回到今天</button>
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded-xl border border-slate-200">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-base font-bold text-slate-800 min-w-[110px] text-center">{year}年 {month + 1}月</span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden border-l border-t ring-1 ring-slate-100">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>

      {selectedDayOrders && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedDayOrders(null)}>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="font-bold text-xl">{selectedDayOrders.date} 配送清單</h3>
                <p className="text-indigo-100 text-[10px] font-bold mt-1 tracking-widest uppercase">Delivery Schedule</p>
              </div>
              <button onClick={() => setSelectedDayOrders(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4 bg-slate-50">
              {selectedDayOrders.orders.sort((a,b) => a.deliveryTime.localeCompare(b.deliveryTime)).map((o, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-100 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {o.storeName}
                      </span>
                      {o.isLocal && <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">LOCAL</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" /> {formatDisplayTime(o.deliveryTime)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Package className="w-3.5 h-3.5 text-slate-300" /> {o.itemName}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-indigo-700">{o.quantity}</div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedDayOrders(null)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">關閉檢視</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
