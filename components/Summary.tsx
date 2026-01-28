
import React from 'react';
import { Order, Product } from '../types';
import { Calculator, Calendar as CalendarIcon, Package } from 'lucide-react';

interface SummaryProps {
  orders: Order[];
  products: Product[];
}

const Summary: React.FC<SummaryProps> = ({ orders, products }) => {
  // 只計算狀態為 pending 的訂單（包括本地待同步的訂單）
  const pendingOrders = orders.filter(o => o.status === 'pending');

  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr) return '';
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const d = new Date(dateStr);
    const dayName = days[d.getDay()];
    return `${dateStr} (${dayName})`;
  };

  // 按日期分組匯總
  const dateSummaryMap = pendingOrders.reduce((acc, order) => {
    if (!acc[order.date]) acc[order.date] = {};
    acc[order.date][order.itemName] = (acc[order.date][order.itemName] || 0) + order.quantity;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const sortedDates = Object.keys(dateSummaryMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 ring-1 ring-slate-700">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-400" />
            今日/預約生產匯總
          </h2>
          <p className="text-slate-400 text-xs mt-1">系統已自動按配送日期加總各品項總量</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Production Summary</span>
          <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
        </div>
      </div>
      
      {sortedDates.length === 0 ? (
        <div className="py-12 text-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
          <p className="text-slate-500 text-sm italic">目前暫無待生產訂單項目</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedDates.map(dateKey => (
            <div key={dateKey} className="animate-in fade-in slide-in-from-left-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-500/10 p-2 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-indigo-100">{formatDateWithDay(dateKey)}</h3>
                  <div className="h-0.5 w-full bg-indigo-500/20 mt-1 rounded-full"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products
                  .filter(p => dateSummaryMap[dateKey][p.itemName])
                  .map(product => (
                    <div key={`${dateKey}-${product.itemName}`} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex justify-between items-center hover:border-indigo-500/50 transition-all hover:bg-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{product.itemName}</p>
                          <p className="text-2xl font-black text-white leading-none mt-1">{dateSummaryMap[dateKey][product.itemName]}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md">{product.unit}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Summary;
