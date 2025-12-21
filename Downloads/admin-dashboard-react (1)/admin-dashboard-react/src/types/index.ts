export interface Order {
  id: string;
  createdAt: Date;
  total: number;
  items?: OrderItem[];
  status?: string;
  tableNumber?: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface DashboardStats {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  totalOrders: number;
  previousOrders: number;
}

export interface ChartData {
  labels: string[];
  values: number[];
}
