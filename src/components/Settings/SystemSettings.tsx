import React, { useState } from 'react';
import { SystemSettings as SystemSettingsType } from '../../types';
import { Settings, Clock, Globe, Gauge } from 'lucide-react';

interface SystemSettingsProps {
  settings: SystemSettingsType;
  onSettingsUpdate: (settings: SystemSettingsType) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  settings,
  onSettingsUpdate
}) => {
  const [tempSettings, setTempSettings] = useState<SystemSettingsType>(settings);

  const handleSettingChange = (field: keyof SystemSettingsType, value: any) => {
    const updatedSettings = { ...tempSettings, [field]: value };
    setTempSettings(updatedSettings);
    onSettingsUpdate(updatedSettings);
  };

  const handleNestedSettingChange = (
    parent: keyof SystemSettingsType,
    field: string,
    value: any
  ) => {
    const updatedSettings = {
      ...tempSettings,
      [parent]: {
        ...(tempSettings[parent] as any),
        [field]: value
      }
    };
    setTempSettings(updatedSettings);
    onSettingsUpdate(updatedSettings);
  };

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refresh Interval (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={tempSettings.refreshInterval}
              onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              How often to fetch new vehicle data
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance Unit
            </label>
            <select
              value={tempSettings.distanceUnit}
              onChange={(e) => handleSettingChange('distanceUnit', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="miles">Miles</option>
              <option value="kilometers">Kilometers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operation Hours */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Operation Hours</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={tempSettings.operationHours.start}
              onChange={(e) => handleNestedSettingChange('operationHours', 'start', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={tempSettings.operationHours.end}
              onChange={(e) => handleNestedSettingChange('operationHours', 'end', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={tempSettings.operationHours.timezone}
              onChange={(e) => handleNestedSettingChange('operationHours', 'timezone', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <Clock className="w-4 h-4 inline mr-1" />
            API calls will be paused during non-operation hours to reduce costs and comply with usage limits.
          </p>
        </div>
      </div>

      {/* Speed Thresholds */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Gauge className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Speed Thresholds</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idle Threshold (mph)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={tempSettings.speedThresholds.idle}
              onChange={(e) => handleNestedSettingChange('speedThresholds', 'idle', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Speed below this is considered stationary
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moving Threshold (mph)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              step="0.1"
              value={tempSettings.speedThresholds.moving}
              onChange={(e) => handleNestedSettingChange('speedThresholds', 'moving', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Speed above this is considered moving
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};