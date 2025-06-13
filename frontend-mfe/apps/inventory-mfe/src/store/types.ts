export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  location: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued';
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  totalOrders: number;
  totalSpent: number;
  onTimeDeliveryRate: number;
}

export interface InventoryAlert {
  id: string;
  type: 'low-stock' | 'out-of-stock' | 'expiring' | 'waste';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  itemName: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  actionRequired: boolean;
}

export interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  selectedItem: InventoryItem | null;
}

export interface SupplierState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  selectedSupplier: Supplier | null;
}

export interface AlertState {
  alerts: InventoryAlert[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}