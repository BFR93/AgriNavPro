import React from 'react';
import { Satellite, Wifi, WifiOff, Signal } from 'lucide-react';
import { GPSPosition } from '../types/gps';
import { formatCoordinate } from '../utils/gpsUtils';

interface GPSStatusProps {
  position: GPSPosition | null;
  isConnected: boolean;
  error: string | null;
  satelliteCount?: number;
  fixQuality?: number;
  hdop?: number;
}

export const GPSStatus: React.FC<GPSStatusProps> = ({
  position,
  isConnected,
  error,
  satelliteCount = 0,
  fixQuality = 0,
  hdop = 0
}) => {
  const getFixQualityText = (quality: number) => {
    switch (quality) {
      case 0: return 'No Fix';
      case 1: return 'GPS Fix';
      case 2: return 'DGPS Fix';
      case 3: return 'PPS Fix';
      case 4: return 'RTK Fix';
      case 5: return 'RTK Float';
      default: return 'Unknown';
    }
  };

  const getFixQualityColor = (quality: number) => {
    if (quality >= 4) return 'text-green-600';
    if (quality >= 2) return 'text-yellow-600';
    if (quality >= 1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSignalStrength = (satellites: number) => {
    if (satellites >= 8) return 'text-green-600';
    if (satellites >= 6) return 'text-yellow-600';
    if (satellites >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-800">GPS Status</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* GPS Quality Indicators */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Signal className={`w-3 h-3 ${getSignalStrength(satelliteCount)}`} />
            <span className="font-medium">Satellites</span>
          </div>
          <div className={`font-bold ${getSignalStrength(satelliteCount)}`}>
            {satelliteCount}
          </div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium mb-1">Fix Quality</div>
          <div className={`font-bold text-xs ${getFixQualityColor(fixQuality)}`}>
            {getFixQualityText(fixQuality)}
          </div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium mb-1">HDOP</div>
          <div className={`font-bold ${hdop < 2 ? 'text-green-600' : hdop < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
            {hdop.toFixed(1)}
          </div>
        </div>
      </div>
      
      {position && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Latitude:</span>
            <div className="font-mono text-gray-800 text-xs">
              {formatCoordinate(position.latitude, true)}
            </div>
            <div className="font-mono text-gray-500 text-xs">
              {position.latitude.toFixed(8)}°
            </div>
          </div>
          <div>
            <span className="text-gray-600">Longitude:</span>
            <div className="font-mono text-gray-800 text-xs">
              {formatCoordinate(position.longitude, false)}
            </div>
            <div className="font-mono text-gray-500 text-xs">
              {position.longitude.toFixed(8)}°
            </div>
          </div>
          <div>
            <span className="text-gray-600">Altitude:</span>
            <div className="font-mono text-gray-800">
              {position.altitude?.toFixed(1) || '0.0'} m
            </div>
          </div>
          <div>
            <span className="text-gray-600">Speed:</span>
            <div className="font-mono text-gray-800">
              {position.speed?.toFixed(1) || '0.0'} m/s
            </div>
          </div>
          <div>
            <span className="text-gray-600">Heading:</span>
            <div className="font-mono text-gray-800">
              {position.heading?.toFixed(1) || '0.0'}°
            </div>
          </div>
          <div>
            <span className="text-gray-600">Time:</span>
            <div className="font-mono text-gray-800 text-xs">
              {new Date(position.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <div>TCP Source: 192.168.1.1:9877</div>
          <div>Protocol: NMEA 0183</div>
          <div>Update Rate: 1 Hz</div>
        </div>
      </div>
    </div>
  );
};