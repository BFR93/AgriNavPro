import React, { useState } from 'react';
import { Settings as SettingsIcon, X, Save } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  machineWidth: number;
  onMachineWidthChange: (width: number) => void;
  showTreatmentMap: boolean;
  onToggleTreatmentMap: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  machineWidth,
  onMachineWidthChange,
  showTreatmentMap,
  onToggleTreatmentMap
}) => {
  const [tempMachineWidth, setTempMachineWidth] = useState(machineWidth);

  const handleSave = () => {
    onMachineWidthChange(tempMachineWidth);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Machine Width Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Machine Width (meters)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.5"
                max="20"
                step="0.1"
                value={tempMachineWidth}
                onChange={(e) => setTempMachineWidth(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">m</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Width of your implement for parallel line spacing
            </p>
          </div>

          {/* Treatment Map Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Options
            </label>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">Treatment Map</div>
                <div className="text-sm text-gray-600">Show treated/untreated areas</div>
              </div>
              <button
                onClick={onToggleTreatmentMap}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showTreatmentMap ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showTreatmentMap ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Guidance Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guidance Settings
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">Cross Track Tolerance</div>
                  <div className="text-sm text-gray-600">±50cm default</div>
                </div>
                <input
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.1"
                  defaultValue="0.5"
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">Parallel Lines</div>
                  <div className="text-sm text-gray-600">Show guidance lines</div>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};