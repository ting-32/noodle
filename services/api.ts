
import { AppData, Order, Store, Product } from '../types';

/**
 * 重要說明：
 * 1. 請將下方的 GAS_URL 替換為您在 Google Sheets 部署後獲得的「網頁應用程式網址」。
 * 2. 每次修改 Code.gs 並重新部署時，請務必選擇「新版本」。
 */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz0YgOKI1UqGZGgsL65TlPtgO1-WEuGGvfHDmhE2hr1DPhjKZnUCMQwsynxgUtnjUV-/exec';

const postToGAS = async (data: object) => {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      mode: 'cors',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`雲端服務 HTTP 異常: ${response.status}`);
    }

    const result = await response.json();
    console.log("GAS Response:", result);

    if (result.status === 'error') {
      throw new Error(`雲端邏輯錯誤: ${result.message}`);
    }
    return result;
  } catch (e: any) {
    console.error("API 通訊異常:", e);
    throw new Error(e.message || "連線至雲端資料庫時發生未知錯誤。");
  }
};

export const fetchAppData = async (): Promise<AppData> => {
  const response = await fetch(`${GAS_URL}?t=${Date.now()}`);
  if (!response.ok) throw new Error("讀取雲端資料失敗 (網路錯誤)");
  const data = await response.json();
  
  if (data.status === 'error') throw new Error(`讀取錯誤: ${data.message}`);
  
  console.log("Data Version Check:", data.v);
  
  return data;
};

export const syncOrders = async (orders: Order[]): Promise<any> => {
  return postToGAS({ action: 'saveOrders', orders });
};

export const saveStores = async (stores: Store[]): Promise<any> => {
  return postToGAS({ action: 'saveStores', stores });
};

export const saveProducts = async (products: Product[]): Promise<any> => {
  return postToGAS({ action: 'saveProducts', products });
};
