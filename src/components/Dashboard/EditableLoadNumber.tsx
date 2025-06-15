import React, { useState, useEffect, useRef } from 'react';
import { FileText, Check, X, Trash2 } from 'lucide-react';

interface EditableLoadNumberProps {
  vehicleId: string;
  vehicleName: string;
  initialLoadNumber?: string;
  onLoadNumberChange: (vehicleId: string, loadNumber: string) => void;
  className?: string;
}

export const EditableLoadNumber: React.FC<EditableLoadNumberProps> = ({
  vehicleId,
  vehicleName,
  initialLoadNumber,
  onLoadNumberChange,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loadNumber, setLoadNumber] = useState(initialLoadNumber || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedLoadNumber = loadNumber.trim();
    
    // Notify parent component
    onLoadNumberChange(vehicleId, trimmedLoadNumber);
    setIsEditing(false);
    
    console.log(`📋 Load number ${trimmedLoadNumber ? 'set' : 'removed'} for ${vehicleName}: ${trimmedLoadNumber}`);
  };

  const handleCancel = () => {
    setLoadNumber(initialLoadNumber || '');
    setIsEditing(false);
  };

  const handleRemove = () => {
    setLoadNumber('');
    onLoadNumberChange(vehicleId, '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`load-number-editor ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={loadNumber}
              onChange={(e) => setLoadNumber(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter load number..."
              className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={50}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
              title="Save load number"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
            {initialLoadNumber && (
              <button
                onClick={handleRemove}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                title="Remove load number"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`load-number-display cursor-pointer group ${className}`}
      onClick={() => setIsEditing(true)}
      title="Click to edit load number"
    >
      <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors">
        <FileText className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
        <span className={`text-sm font-mono ${
          loadNumber 
            ? 'text-green-700 font-semibold' 
            : 'text-gray-500'
        }`}>
          {loadNumber || 'Add load #'}
        </span>
      </div>
    </div>
  );
};