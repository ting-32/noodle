
import React from 'react';
import { Order } from '../types';
import { Trash2, Calendar, Store as StoreIcon, Package, Clock, Hash, ChevronRight } from 'lucide-react';

interface OrderPreviewProps {
  orders: Order[];
  onDeleteOrder: (order: Order) => void;
}

const OrderPreview: React.FC<OrderPreviewProps> = ({ orders, onDeleteOrder }) => {
  // Sort orders by date, then by delivery time
  const sortedOrders = [...orders].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (a.deliveryTime || "").localeCompare(b.deliveryTime || "");
  });

  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr) return '';
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const date = new Date(dateStr);
    const dayName = days[date.getDay()];
    return `${dateStr.split('-').slice(1).join('/')} (${dayName})`;
  };

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

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 md:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <ClipboardList className="w-5 h-5 text-slate-600" />
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-800">
            訂單明細
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full">
          <Hash className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-black text-indigo-700">{orders.length} 筆</span>
        </div>
      </div>

      {/* 手機版：卡片清單模式 */}
      <div className="md:hidden divide-y divide-slate-100">
        {sortedOrders.length === 0 ? (
          <div className="px-8 py-16 text-center text-slate-400 font-medium italic">
             <Package className="w-10 h-10 mb-2 mx-auto opacity-20" />
             目前暫無暫存訂單
          </div>
        ) : (
          sortedOrders.map((order, idx) => (
            <div key={idx} className="p-4 flex flex-col gap-3 relative bg-white active:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" /> {formatDateWithDay(order.date)}
                  </div>
                  <div className="text-base font-black text-slate-800 flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-slate-300" /> {order.storeName}
                  </div>
                </div>
                {order.isLocal && (
                  <button
                    onClick={() => onDeleteOrder(order)}
                    className="p-3 -mr-2 text-slate-300 active:text-red-500 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <Package className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{order.itemName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3" /> {formatDisplayTime(order.deliveryTime)}
                  </div>
                  <span className="text-xl font-black text-indigo-700">{order.quantity}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {order.isLocal ? (
                  <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">待同步</span>
                ) : (
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">已存檔</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 電腦版：傳統表格模式 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="pl-8 pr-4 py-5 border-b border-slate-100">配送日期/時間</th>
              <th className="px-4 py-5 border-b border-slate-100">店家</th>
              <th className="px-4 py-5 border-b border-slate-100">品項內容</th>
              <th className="px-4 py-5 border-b border-slate-100">數量</th>
              <th className="px-4 py-5 border-b border-slate-100">數據狀態</th>
              <th className="pl-4 pr-8 py-5 border-b border-slate-100 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <Package className="w-10 h-10 mb-2" />
                    目前暫存清單是空的
                  </div>
                </td>
              </tr>
            ) : (
              sortedOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                  <td className="pl-8 pr-4 py-5">
                    <div className="text-slate-800 font-black text-sm">{formatDateWithDay(order.date)}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-bold mt-1 bg-indigo-50/50 w-fit px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3" /> {formatDisplayTime(order.deliveryTime)}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2.5 text-slate-800 font-black">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      {order.storeName}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Package className="w-4 h-4 text-slate-300" />
                      {order.itemName}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-lg font-black text-indigo-700">{order.quantity}</span>
                  </td>
                  <td className="px-4 py-5">
                    {order.isLocal ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                        ● 待同步
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                        ● 已存檔
                      </span>
                    )}
                  </td>
                  <td className="pl-4 pr-8 py-5 text-center">
                    {order.isLocal && (
                      <button
                        onClick={() => onDeleteOrder(order)}
                        className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all md:opacity-0 group-hover:opacity-100 active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import { ClipboardList } from 'lucide-react';
export default OrderPreview;
