
import React, { useState } from 'react';
import { Product } from '../types';
import { Package, Plus, Trash2, Edit3, X, Check, Hash } from 'lucide-react';

interface ProductManagementProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ products, onUpdateProducts }) => {
  const [newProduct, setNewProduct] = useState<Product>({ itemName: '', unit: '斤' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState<Product | null>(null);

  const handleAdd = () => {
    if (!newProduct.itemName || !newProduct.unit) return;
    onUpdateProducts([...products, newProduct]);
    setNewProduct({ itemName: '', unit: '斤' });
  };

  const handleRemove = (index: number) => {
    if (window.confirm("確定要刪除此品項嗎？")) {
      onUpdateProducts(products.filter((_, i) => i !== index));
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditBuffer({ ...products[index] });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editBuffer) return;
    const updated = [...products];
    updated[editingIndex] = editBuffer;
    onUpdateProducts(updated);
    setEditingIndex(null);
    setEditBuffer(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Package className="w-5 h-5 text-white" />
          </div>
          廠內品項管理
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">品項名稱</label>
            <input
              type="text"
              placeholder="例如：陽春麵"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold shadow-sm"
              value={newProduct.itemName}
              onChange={e => setNewProduct({ ...newProduct, itemName: e.target.value })}
            />
          </div>
          <div className="w-full md:w-32 space-y-1.5">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">生產單位</label>
            <input
              type="text"
              placeholder="斤/包/箱"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold shadow-sm"
              value={newProduct.unit}
              onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
            />
          </div>
          <button
            onClick={handleAdd}
            className="self-end w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-5 h-5" /> 新增品項
          </button>
        </div>

        {/* 手機版：卡片清單 */}
        <div className="md:hidden space-y-3">
          {products.map((p, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-slate-50 transition-colors">
              <div className="flex-1">
                {editingIndex === idx ? (
                  <div className="space-y-2 pr-4">
                    <input
                      className="w-full px-3 py-2 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      value={editBuffer?.itemName}
                      onChange={e => setEditBuffer({ ...editBuffer!, itemName: e.target.value })}
                    />
                    <input
                      className="w-full px-3 py-2 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs text-slate-500"
                      value={editBuffer?.unit}
                      onChange={e => setEditBuffer({ ...editBuffer!, unit: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="font-black text-slate-800">{p.itemName}</h3>
                    <p className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded w-fit mt-1">{p.unit}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {editingIndex === idx ? (
                  <>
                    <button onClick={saveEdit} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100"><Check className="w-5 h-5" /></button>
                    <button onClick={() => setEditingIndex(null)} className="p-3 bg-slate-100 text-slate-400 rounded-xl"><X className="w-5 h-5" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(idx)} className="p-3 text-slate-300 active:text-indigo-600 bg-slate-50 rounded-xl"><Edit3 className="w-5 h-5" /></button>
                    <button onClick={() => handleRemove(idx)} className="p-3 text-slate-300 active:text-red-500 bg-slate-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-center py-10 text-slate-300 italic">尚未設定品項</p>}
        </div>

        {/* 電腦版：傳統表格 */}
        <div className="hidden md:block overflow-hidden border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 py-4 border-b border-slate-100">品項名稱</th>
                <th className="px-6 py-4 border-b border-slate-100 w-32 text-center">單位</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editingIndex === idx ? (
                      <input
                        className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold shadow-inner"
                        value={editBuffer?.itemName}
                        onChange={e => setEditBuffer({ ...editBuffer!, itemName: e.target.value })}
                      />
                    ) : (
                      <span className="font-black text-slate-700">{p.itemName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingIndex === idx ? (
                      <input
                        className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-center shadow-inner"
                        value={editBuffer?.unit}
                        onChange={e => setEditBuffer({ ...editBuffer!, unit: e.target.value })}
                      />
                    ) : (
                      <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/50">{p.unit}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      {editingIndex === idx ? (
                        <>
                          <button onClick={saveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check className="w-5 h-5" /></button>
                          <button onClick={() => setEditingIndex(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X className="w-5 h-5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(idx)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 className="w-5 h-5" /></button>
                          <button onClick={() => handleRemove(idx)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">尚未設定任何產品品項</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
