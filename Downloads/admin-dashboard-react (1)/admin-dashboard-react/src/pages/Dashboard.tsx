import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { format, subDays, subMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import StatsCard from '../components/StatsCard';
import DailyChart from '../components/DailyChart';
import { Order, DashboardStats } from '../types';

interface DailyChartData {
  labels: string[];
  revenues: number[];
  orders: number[];
}

interface PeriodStats {
  totalRevenue: number;
  totalOrders: number;
  averageBasket: number;
  bestDay: { date: string; revenue: number };
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Date range for daily view
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 29), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  const [stats, setStats] = useState<DashboardStats>({
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    totalOrders: 0,
    previousOrders: 0,
  });
  
  const [periodStats, setPeriodStats] = useState<PeriodStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageBasket: 0,
    bestDay: { date: '', revenue: 0 },
  });
  
  const [dailyData, setDailyData] = useState<DailyChartData>({ 
    labels: [], 
    revenues: [], 
    orders: [] 
  });

  const restaurantId = import.meta.env.VITE_RESTAURANT_ID || 'talya-bercy';

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  // Helper pour convertir createdAt en Date
  const convertToDate = (createdAt: any): Date => {
    if (!createdAt) return new Date();
    if (createdAt.toDate && typeof createdAt.toDate === 'function') {
      return createdAt.toDate();
    }
    if (typeof createdAt === 'string') {
      return new Date(createdAt);
    }
    if (createdAt instanceof Date) {
      return createdAt;
    }
    return new Date();
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await fetchMonthlyStats();
      await fetchDailyChartData();
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    const now = new Date();
    
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentOrdersPath = `restaurants/${restaurantId}/orders/${currentYear}/${currentMonth}`;
    const currentOrdersRef = collection(db, currentOrdersPath);
    const currentSnapshot = await getDocs(currentOrdersRef);
    
    const currentMonthOrders: Order[] = currentSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: convertToDate(data.createdAt),
        total: Number(data.totalPrice) || Number(data.total) || 0,
      };
    });

    const currentMonthRevenue = currentMonthOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    const previousMonth = subMonths(now, 1);
    const previousYear = previousMonth.getFullYear();
    const previousMonthNum = String(previousMonth.getMonth() + 1).padStart(2, '0');
    const previousOrdersPath = `restaurants/${restaurantId}/orders/${previousYear}/${previousMonthNum}`;
    const previousOrdersRef = collection(db, previousOrdersPath);
    const previousSnapshot = await getDocs(previousOrdersRef);
    
    const previousMonthOrders: Order[] = previousSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: convertToDate(data.createdAt),
        total: Number(data.totalPrice) || Number(data.total) || 0,
      };
    });

    const previousMonthRevenue = previousMonthOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    setStats({
      currentMonthRevenue,
      previousMonthRevenue,
      totalOrders: currentMonthOrders.length,
      previousOrders: previousMonthOrders.length,
    });
  };

  const fetchDailyChartData = async () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = differenceInDays(end, start) + 1;
    
    if (daysDiff > 90) {
      alert('Veuillez sélectionner une période de maximum 90 jours');
      return;
    }

    const allOrdersForDaily: Order[] = [];
    
    // Déterminer les mois à récupérer
    const monthsToFetch = new Set<string>();
    for (let i = 0; i < daysDiff; i++) {
      const date = subDays(end, i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      monthsToFetch.add(`${year}/${month}`);
    }

    // Récupérer les données de chaque mois
    for (const yearMonth of monthsToFetch) {
      const path = `restaurants/${restaurantId}/orders/${yearMonth}`;
      const ref = collection(db, path);
      
      try {
        const snapshot = await getDocs(ref);
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          allOrdersForDaily.push({
            id: doc.id,
            createdAt: convertToDate(data.createdAt),
            total: Number(data.totalPrice) || Number(data.total) || 0,
          });
        });
      } catch (error) {
        console.warn(`Pas de données pour ${path}`);
      }
    }

    const dailyLabels: string[] = [];
    const dailyRevenues: number[] = [];
    const dailyOrders: number[] = [];
    let totalRevenue = 0;
    let totalOrders = 0;
    let bestDay = { date: '', revenue: 0 };

    for (let i = 0; i < daysDiff; i++) {
      const date = subDays(end, daysDiff - 1 - i);
      const dateStr = format(date, 'dd/MM');
      dailyLabels.push(dateStr);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrdersList = allOrdersForDaily.filter(
        order => order.createdAt >= dayStart && order.createdAt <= dayEnd
      );

      const dayRevenue = dayOrdersList.reduce((sum, order) => sum + order.total, 0);
      const dayOrderCount = dayOrdersList.length;

      dailyRevenues.push(dayRevenue);
      dailyOrders.push(dayOrderCount);
      
      totalRevenue += dayRevenue;
      totalOrders += dayOrderCount;

      if (dayRevenue > bestDay.revenue) {
        bestDay = { date: format(date, 'dd/MM/yyyy'), revenue: dayRevenue };
      }
    }

    setDailyData({ labels: dailyLabels, revenues: dailyRevenues, orders: dailyOrders });
    setPeriodStats({
      totalRevenue,
      totalOrders,
      averageBasket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      bestDay,
    });
  };

  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/talya-bercy/login';
  };

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement des données...</div>
      </div>
    );
  }

  const revenueChange = calculateChange(
    stats.currentMonthRevenue,
    stats.previousMonthRevenue
  );
  const ordersChange = calculateChange(stats.totalOrders, stats.previousOrders);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Tableau de Bord - Administration
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Déconnexion
          </button>
        </header>

        {/* Date Range Picker */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickRange(7)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  7 jours
                </button>
                <button
                  onClick={() => handleQuickRange(30)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  30 jours
                </button>
                <button
                  onClick={() => handleQuickRange(90)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  90 jours
                </button>
              </div>
            </div>
          </div>

        {/* Period Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm">
              <div className="text-sm text-blue-600 font-medium mb-2">CA Total Période</div>
              <div className="text-2xl font-bold text-blue-900">
                €{periodStats.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm">
              <div className="text-sm text-green-600 font-medium mb-2">Total Commandes</div>
              <div className="text-2xl font-bold text-green-900">
                {periodStats.totalOrders}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-sm">
              <div className="text-sm text-purple-600 font-medium mb-2">Panier Moyen</div>
              <div className="text-2xl font-bold text-purple-900">
                €{periodStats.averageBasket.toFixed(2)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow-sm">
              <div className="text-sm text-orange-600 font-medium mb-2">Meilleur Jour</div>
              <div className="text-lg font-bold text-orange-900">{periodStats.bestDay.date}</div>
              <div className="text-sm text-orange-700">€{periodStats.bestDay.revenue.toFixed(2)}</div>
            </div>
          </div>

        {/* Charts */}
        <div className="mb-6">
          <DailyChart 
            data={dailyData} 
            startDate={new Date(startDate)} 
            endDate={new Date(endDate)} 
          />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-gray-500">
          Dernière mise à jour : {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;