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
      title: 'Total Vehicles',
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
      title: 'With Destinations',
      value: destinationCount,
      icon: MapPin,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'With Load Numbers',
      value: loadNumberCount,
      icon: FileText,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      title: 'With Appointments',
      value: appointmentCount,
      icon: Calendar,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Late/At Risk',
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`${card.color} rounded-md p-3`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className={`text-2xl font-semibold ${card.textColor}`}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};