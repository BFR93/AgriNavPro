import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Play, Square } from 'lucide-react';
import { ABLine, GPSPosition } from '../types/gps';

interface ABLineManagerProps {
  abLines: ABLine[];
  currentPosition: GPSPosition | null;
  activeLineId: string | null;
  onCreateLine: (pointA: GPSPosition, pointB: GPSPosition, name: string) => void;
  onDeleteLine: (id: string) => void;
  onActivateLine: (id: string) => void;
  onDeactivateLine: () => void;
}

export const ABLineManager: React.FC<ABLineManagerProps> = ({
  abLines,
  currentPosition,
  activeLineId,
  onCreateLine,
  onDeleteLine,
  onActivateLine,
  onDeactivateLine
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [pointA, setPointA] = useState<GPSPosition | null>(null);
  const [newLineName, setNewLineName] = useState('');

  const handleSetPointA = () => {
    if (currentPosition) {
      setPointA(currentPosition);
      setNewLineName(`Line ${abLines.length + 1}`);
    }
  };

  const handleSetPointB = () => {
    if (currentPosition && pointA) {
      onCreateLine(pointA, currentPosition, newLineName);
      setIsCreating(false);
      setPointA(null);
      setNewLineName('');
    }
  };

  const cancelCreation = () => {
    setIsCreating(false);
    setPointA(null);
    setNewLineName('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">A/B Lines</h3>
        <button
          onClick={() => setIsCreating(true)}
          disabled={!currentPosition || isCreating}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Create Line
        </button>
      </div>

      {isCreating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2">Create New A/B Line</h4>
          <input
            type="text"
            value={newLineName}
            onChange={(e) => setNewLineName(e.target.value)}
            placeholder="Line name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
          />
          <div className="flex gap-2">
            {!pointA ? (
              <button
                onClick={handleSetPointA}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Set Point A
              </button>
            ) : (
              <button
                onClick={handleSetPointB}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Set Point B
              </button>
            )}
            <button
              onClick={cancelCreation}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
          {pointA && (
            <p className="text-sm text-green-600 mt-2">
              Point A set. Drive to Point B and click "Set Point B"
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {abLines.map((line) => (
          <div
            key={line.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              activeLineId === line.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-1">
              <div className="font-medium text-gray-800">{line.name}</div>
              <div className="text-sm text-gray-600">
                Created: {new Date(line.created).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeLineId === line.id ? (
                <button
                  onClick={onDeactivateLine}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                  title="Deactivate Line"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onActivateLine(line.id)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                  title="Activate Line"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDeleteLine(line.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                title="Delete Line"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {abLines.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No A/B lines created yet. Create your first line to start guided navigation.
          </div>
        )}
      </div>
    </div>
  );
};