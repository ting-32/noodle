
export interface StoreDefaultItem {
  itemName: string;
  quantity: number;
}

export interface Store {
  storeName: string;
  phone: string;
  holidayDates: string[]; // Specific dates in YYYY-MM-DD format
  deliveryTime: string;   // Default delivery time (e.g., "08:30")
  defaultItems?: StoreDefaultItem[]; // Default products and quantities
}

export interface Product {
  itemName: string;
  unit: string;
}

export interface Order {
  id?: string;
  date: string;
  deliveryTime: string; // Specific delivery time for this order
  storeName: string;
  itemName: string;
  quantity: number;
  status: 'pending' | 'completed';
  createdAt?: string;
  isLocal?: boolean;
}

export interface AppData {
  stores: Store[];
  products: Product[];
  orders: Order[];
}
