import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyChartData {
  labels: string[];
  revenues: number[];
  orders: number[];
}

interface DailyChartProps {
  data: DailyChartData;
  startDate: Date;
  endDate: Date;
}

const DailyChart: React.FC<DailyChartProps> = ({ data, startDate, endDate }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        type: 'bar' as const,
        label: "Chiffre d'affaires (€)",
        data: data.revenues,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Nombre de commandes',
        data: data.orders,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
        order: 1,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar' | 'line'>) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('€')) {
              return `${label}: €${value.toLocaleString()}`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: "Chiffre d'affaires (€)",
          color: '#3b82f6',
        },
        ticks: {
          callback: function(tickValue: string | number) {
            return '€' + tickValue;
          },
          color: '#3b82f6',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Commandes',
          color: '#10b981',
        },
        ticks: {
          stepSize: 1,
          color: '#10b981',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Évolution par Jour
        </h2>
        <span className="text-sm text-gray-500">
          Du {startDate.toLocaleDateString('fr-FR')} au {endDate.toLocaleDateString('fr-FR')}
        </span>
      </div>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default DailyChart;