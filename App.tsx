
import React, { useState, useEffect, useCallback } from 'react';
import OrderForm from './components/OrderForm';
import OrderPreview from './components/OrderPreview';
import Summary from './components/Summary';
import StoreManagement from './components/StoreManagement';
import ProductManagement from './components/ProductManagement';
import { Store, Product, Order } from './types';
import { fetchAppData, syncOrders, saveStores, saveProducts } from './services/api';
import { RefreshCw, CloudUpload, Factory, CheckCircle2, ClipboardList, Settings, Loader2, Package } from 'lucide-react';

const App: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentView, setCurrentView] = useState<'orders' | 'stores' | 'products'>('orders');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await fetchAppData();
      setStores(data.stores);
      setProducts(data.products);
      
      setAllOrders(prev => {
        const localOnly = prev.filter(o => o.isLocal);
        return [...data.orders, ...localOnly];
      });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: '讀取資料失敗，請檢查 API 部署與權限' });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncToCloud = async () => {
    try {
      setSyncing(true);
      setMessage(null);

      if (currentView === 'orders') {
        const localOrders = allOrders.filter(o => o.isLocal);
        if (localOrders.length === 0) {
          setMessage({ type: 'error', text: '沒有需要上傳的本地訂單' });
          setSyncing(false);
          return;
        }
        await syncOrders(localOrders);
        setMessage({ type: 'success', text: `成功上傳 ${localOrders.length} 筆訂單！` });
      } 
      else if (currentView === 'stores') {
        await saveStores(stores);
        setMessage({ type: 'success', text: '店家資訊同步成功' });
      } 
      else if (currentView === 'products') {
        await saveProducts(products);
        setMessage({ type: 'success', text: '品項資料同步成功' });
      }

      setAllOrders(prev => prev.filter(o => !o.isLocal));
      await loadData(false);

    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: '同步失敗，請確認網路或 API 部署狀態' });
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const deleteOrder = (target: Order) => {
    if (target.isLocal) {
      setAllOrders(prev => prev.filter(o => o !== target));
    } else {
      alert("已存檔訂單請至 Google Sheets 手動刪除。");
    }
  };

  if (loading && allOrders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 p-6">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-400 font-bold animate-pulse">正在讀取雲端資料...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-slate-50 font-sans selection:bg-indigo-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base font-black text-slate-900">麵廠訂單</h1>
          </div>
          
          <nav className="hidden lg:flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setCurrentView('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${currentView === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <ClipboardList className="w-4 h-4" /> 訂單輸入
            </button>
            <button
              onClick={() => setCurrentView('stores')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${currentView === 'stores' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <Settings className="w-4 h-4" /> 店家與配送
            </button>
            <button
              onClick={() => setCurrentView('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${currentView === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <Package className="w-4 h-4" /> 品項
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleSyncToCloud} 
              disabled={syncing} 
              className="bg-indigo-600 text-white px-3 md:px-5 py-2 rounded-xl font-black text-[11px] md:text-xs flex items-center gap-1.5 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              <span>{syncing ? '同步' : '上傳'}</span>
            </button>
            <button onClick={() => loadData()} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors active:rotate-180">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-8 pt-2 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex justify-between items-center max-w-md mx-auto pb-2">
          <button
            onClick={() => setCurrentView('orders')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'orders' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <ClipboardList className={`w-6 h-6 ${currentView === 'orders' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-black tracking-wider">輸入</span>
          </button>
          <button
            onClick={() => setCurrentView('stores')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'stores' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Settings className={`w-6 h-6 ${currentView === 'stores' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-black tracking-wider">店家</span>
          </button>
          <button
            onClick={() => setCurrentView('products')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${currentView === 'products' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Package className={`w-6 h-6 ${currentView === 'products' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-black tracking-wider">品項</span>
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {message && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] md:w-auto z-[60] bg-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 border-emerald-500 animate-in slide-in-from-top-4">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <RefreshCw className="w-5 h-5 text-red-500" />}
            <span className="font-black text-xs md:text-sm text-slate-800">{message.text}</span>
          </div>
        )}

        {currentView === 'orders' && (
          <>
            <OrderForm 
              stores={stores} 
              products={products} 
              existingOrders={allOrders}
              onAddOrder={o => setAllOrders(prev => [...prev, o])} 
            />
            <OrderPreview orders={allOrders} onDeleteOrder={deleteOrder} />
            <Summary orders={allOrders} products={products} />
          </>
        )}

        {currentView === 'stores' && <StoreManagement stores={stores} products={products} onUpdateStores={setStores} />}
        {currentView === 'products' && <ProductManagement products={products} onUpdateProducts={setProducts} />}
      </main>
    </div>
  );
};

export default App;
