import React from 'react';
import { DeliveryAppointment } from '../../services/deliveryAppointmentsService';
import { lateTrackingService, LateTrackingAnalysis } from '../../services/lateTrackingService';
import { AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';

interface DeliveryStatusDisplayProps {
  analysis: LateTrackingAnalysis;
  nextAppointment?: DeliveryAppointment | null;
  className?: string;
}

export const DeliveryStatusDisplay: React.FC<DeliveryStatusDisplayProps> = ({
  analysis,
  nextAppointment,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (analysis.status) {
      case 'late':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'at_risk':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'on_time':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (analysis.status) {
      case 'late': return 'text-red-600';
      case 'at_risk': return 'text-orange-600';
      case 'on_time': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getBackgroundColor = () => {
    switch (analysis.status) {
      case 'late': return 'bg-red-50 border-red-200';
      case 'at_risk': return 'bg-orange-50 border-orange-200';
      case 'on_time': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`delivery-status ${className}`}>
      <div className={`p-3 rounded-lg border ${getBackgroundColor()}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {analysis.status === 'late' && 'LATE'}
            {analysis.status === 'at_risk' && 'AT RISK'}
            {analysis.status === 'on_time' && 'ON TIME'}
            {analysis.status === 'no_data' && 'NO DATA'}
          </span>
        </div>
        
        <div className={`text-xs ${getStatusColor()}`}>
          {analysis.message}
        </div>
        
        {nextAppointment && (
          <div className="mt-2 text-xs text-gray-600">
            Next: {lateTrackingService.formatAppointmentTime(nextAppointment.datetime)}
          </div>
        )}
        
        {/* Additional details based on status */}
        {analysis.status === 'late' && analysis.minutesLate && (
          <div className="mt-1 text-xs font-medium text-red-700">
            {Math.round(analysis.minutesLate)} minutes overdue
          </div>
        )}
        
        {analysis.status === 'at_risk' && analysis.minutesShort && (
          <div className="mt-1 text-xs font-medium text-orange-700">
            Need {Math.round(analysis.minutesShort)} more minutes
          </div>
        )}
        
        {analysis.status === 'on_time' && analysis.minutesAhead && (
          <div className="mt-1 text-xs font-medium text-green-700">
            {Math.round(analysis.minutesAhead)} minutes buffer
          </div>
        )}
      </div>
    </div>
  );
};