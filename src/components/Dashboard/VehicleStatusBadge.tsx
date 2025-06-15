import React from 'react';
import { VehicleStatus } from '../../types';

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  [VehicleStatus.MOVING]: {
    label: 'Moving',
    color: 'bg-green-100 text-green-800 border-green-200',
    dot: 'bg-green-400'
  },
  [VehicleStatus.IDLE]: {
    label: 'Idle',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dot: 'bg-yellow-400'
  },
  [VehicleStatus.STATIONARY]: {
    label: 'Stationary',
    color: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-400'
  },
  [VehicleStatus.STALE]: {
    label: 'Stale',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    dot: 'bg-gray-400'
  }
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-1.5 text-sm',
  lg: 'px-3 py-2 text-base'
};

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClass}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {config.label}
    </span>
  );
};