import React from 'react';
import { Activity, MapPin, Clock } from 'lucide-react';
import { PathPoint } from '../types/gps';
import { formatDistance } from '../utils/gpsUtils';

interface CoverageStatsProps {
  pathPoints: PathPoint[];
  sessionStartTime: number;
}

export const CoverageStats: React.FC<CoverageStatsProps> = ({
  pathPoints,
  sessionStartTime
}) => {
  const treatedPoints = pathPoints.filter(p => p.treated);
  const totalPoints = pathPoints.length;
  const coveragePercentage = totalPoints > 0 ? (treatedPoints.length / totalPoints) * 100 : 0;
  
  const sessionDuration = Date.now() - sessionStartTime;
  const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
  const minutes = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));

  // Approximate distance calculation
  const approximateDistance = totalPoints * 2; // Rough estimate: 2m per point

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Coverage Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Field Coverage</span>
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">
            {coveragePercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-green-700">
            {treatedPoints.length} / {totalPoints} points
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Distance</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mb-1">
            {formatDistance(approximateDistance)}
          </div>
          <div className="text-sm text-blue-700">
            Approximate
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Session Time</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 mb-1">
            {hours}h {minutes}m
          </div>
          <div className="text-sm text-purple-700">
            Active time
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Efficiency</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 mb-1">
            {sessionDuration > 0 ? ((approximateDistance / (sessionDuration / 1000)) * 3.6).toFixed(1) : '0.0'}
          </div>
          <div className="text-sm text-yellow-700">
            km/h average
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Coverage Progress</span>
          <span className="text-sm text-gray-600">{coveragePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${coveragePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};