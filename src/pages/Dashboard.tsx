import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { format, subDays, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import StatsCard from '../components/StatsCard';
import DailyChart from '../components/DailyChart';
import MonthlyChart from '../components/MonthlyChart';
import { Order, DashboardStats, ChartData } from '../types';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    totalOrders: 0,
    previousOrders: 0,
  });
  const [dailyData, setDailyData] = useState<ChartData>({ labels: [], values: [] });
  const [monthlyData, setMonthlyData] = useState<ChartData>({ labels: [], values: [] });

  const restaurantId = import.meta.env.VITE_RESTAURANT_ID || 'talya-bercy';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper pour convertir createdAt en Date (gère Timestamp et string ISO)
  const convertToDate = (createdAt: any): Date => {
    if (!createdAt) return new Date();
    
    // Si c'est un Timestamp Firebase
    if (createdAt.toDate && typeof createdAt.toDate === 'function') {
      return createdAt.toDate();
    }
    
    // Si c'est une string ISO
    if (typeof createdAt === 'string') {
      return new Date(createdAt);
    }
    
    // Si c'est déjà une Date
    if (createdAt instanceof Date) {
      return createdAt;
    }
    
    // Par défaut
    return new Date();
  };

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      
      // Récupérer les commandes du mois actuel
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

      // Calculer le CA du mois actuel (uniquement avec total)
      const currentMonthRevenue = currentMonthOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );

      // Récupérer les commandes du mois précédent
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

      // Récupérer toutes les commandes des 30 derniers jours pour le graphique journalier
      const allOrdersForDaily: Order[] = [];
      
      // On récupère les 2 derniers mois pour être sûr d'avoir les 30 derniers jours
      for (let i = 0; i < 2; i++) {
        const monthDate = subMonths(now, i);
        const year = monthDate.getFullYear();
        const month = String(monthDate.getMonth() + 1).padStart(2, '0');
        const path = `restaurants/${restaurantId}/orders/${year}/${month}`;
        const ref = collection(db, path);
        const snapshot = await getDocs(ref);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          allOrdersForDaily.push({
            id: doc.id,
            createdAt: convertToDate(data.createdAt),
            total: Number(data.totalPrice) || Number(data.total) || 0,
          });
        });
      }

      // Données journalières (30 derniers jours)
      const dailyLabels: string[] = [];
      const dailyValues: number[] = [];

      for (let i = 29; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'dd/MM');
        dailyLabels.push(dateStr);

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayRevenue = allOrdersForDaily
          .filter(order => order.createdAt >= dayStart && order.createdAt <= dayEnd)
          .reduce((sum, order) => sum + order.total, 0);

        dailyValues.push(dayRevenue);
      }

      setDailyData({ labels: dailyLabels, values: dailyValues });

      // Données mensuelles (12 derniers mois)
      const monthlyLabels: string[] = [];
      const monthlyValues: number[] = [];

      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const year = monthDate.getFullYear();
        const month = String(monthDate.getMonth() + 1).padStart(2, '0');
        const monthLabel = format(monthDate, 'MMM', { locale: fr });
        monthlyLabels.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));

        const path = `restaurants/${restaurantId}/orders/${year}/${month}`;
        const ref = collection(db, path);
        const snapshot = await getDocs(ref);
        
        const monthRevenue = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (Number(data.totalPrice) || Number(data.total) || 0);
        }, 0);

        monthlyValues.push(monthRevenue);
      }

      setMonthlyData({ labels: monthlyLabels, values: monthlyValues });
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard
            label="Chiffre d'Affaires - Mois Actuel"
            value={`€${stats.currentMonthRevenue.toLocaleString()}`}
            change={`${revenueChange} vs mois précédent`}
            isPositive={stats.currentMonthRevenue >= stats.previousMonthRevenue}
          />
          <StatsCard
            label="Chiffre d'Affaires - Mois Précédent"
            value={`€${stats.previousMonthRevenue.toLocaleString()}`}
            change={format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: fr })}
          />
          <StatsCard
            label="Commandes Totales - Ce Mois"
            value={stats.totalOrders}
            change={`${ordersChange} vs mois précédent`}
            isPositive={stats.totalOrders >= stats.previousOrders}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DailyChart data={dailyData} />
          <MonthlyChart data={monthlyData} />
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
