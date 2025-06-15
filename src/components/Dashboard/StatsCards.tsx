import React from 'react';
import { Vehicle, VehicleStatus } from '../../types';
import { Truck, Activity, AlertTriangle, Clock, MapPin, FileText, Calendar, AlertCircle } from 'lucide-react';

interface StatsCardsProps {
  vehicles: Vehicle[];
  destinationCount?: number;
  loadNumberCount?: number;
  appointmentCount?: number;
  lateCount?: number;
  atRiskCount?: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  vehicles, 
  destinationCount = 0, 
  loadNumberCount = 0,
  appointmentCount = 0,
  lateCount = 0,
  atRiskCount = 0
}) => {
  const stats = React.useMemo(() => {
    const total = vehicles.length;
    const moving = vehicles.filter(v => v.status === VehicleStatus.MOVING).length;
    const idle = vehicles.filter(v => v.status === VehicleStatus.IDLE).length;
    const stationary = vehicles.filter(v => v.status === VehicleStatus.STATIONARY).length;
    const stale = vehicles.filter(v => v.status === VehicleStatus.STALE).length;
    
    return { total, moving, idle, stationary, stale };
  }, [vehicles]);

  const cards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Truck,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Moving',
      value: stats.moving,
      icon: Activity,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Idle/Stationary',
      value: stats.idle + stats.stationary,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Destinations',
      value: destinationCount,
      icon: MapPin,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Load #s',
      value: loadNumberCount,
      icon: FileText,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Appointments',
      value: appointmentCount,
      icon: Calendar,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Late/Risk',
      value: lateCount + atRiskCount,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      subtitle: `${lateCount} late, ${atRiskCount} at risk`
    },
    {
      title: 'Stale Data',
      value: stats.stale,
      icon: Clock,
      color: 'bg-gray-500',
      textColor: 'text-gray-600'
    }
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon-container">
            <div className={`stat-icon ${card.color}`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-title">{card.title}</div>
            <div className={`stat-value ${card.textColor}`}>
              {card.value}
            </div>
            {card.subtitle && (
              <div className="stat-subtitle">{card.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};