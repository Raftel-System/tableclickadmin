interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, change, isPositive }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {value}
      </div>
      {change && (
        <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
