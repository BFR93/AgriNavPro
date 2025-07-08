import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { GPSPosition, ABLine, PathPoint } from '../types/gps';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SatelliteMapViewProps {
  currentPosition: GPSPosition | null;
  abLines: ABLine[];
  activeLineId: string | null;
  pathPoints: PathPoint[];
}

// Custom tractor icon
const tractorIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="32" height="32">
      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Component to update map view when position changes
const MapUpdater: React.FC<{ position: GPSPosition | null }> = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [position, map]);
  
  return null;
};

export const SatelliteMapView: React.FC<SatelliteMapViewProps> = ({
  currentPosition,
  abLines,
  activeLineId,
  pathPoints
}) => {
  const mapRef = useRef<L.Map | null>(null);
  
  // Default center (your NMEA coordinates)
  const defaultCenter: LatLngExpression = currentPosition 
    ? [currentPosition.latitude, currentPosition.longitude]
    : [46.7629574, 6.5638699]; // Converted from your NMEA data

  // Convert path points to polyline
  const treatedPath = pathPoints
    .filter(p => p.treated)
    .map(p => [p.position.latitude, p.position.longitude] as LatLngExpression);
  
  const untreatedPath = pathPoints
    .filter(p => !p.treated)
    .map(p => [p.position.latitude, p.position.longitude] as LatLngExpression);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Satellite Map View</h3>
      </div>
      
      <div className="h-96 relative">
        <MapContainer
          center={defaultCenter}
          zoom={18}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Satellite imagery option */}
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          
          {currentPosition && <MapUpdater position={currentPosition} />}
          
          {/* Current position marker */}
          {currentPosition && (
            <Marker
              position={[currentPosition.latitude, currentPosition.longitude]}
              icon={tractorIcon}
            />
          )}
          
          {/* A/B Lines */}
          {abLines.map(line => (
            <Polyline
              key={line.id}
              positions={[
                [line.pointA.latitude, line.pointA.longitude],
                [line.pointB.latitude, line.pointB.longitude]
              ]}
              color={activeLineId === line.id ? '#3b82f6' : '#6b7280'}
              weight={activeLineId === line.id ? 4 : 2}
              opacity={0.8}
            />
          ))}
          
          {/* Treated path */}
          {treatedPath.length > 0 && (
            <Polyline
              positions={treatedPath}
              color="#10b981"
              weight={6}
              opacity={0.7}
            />
          )}
          
          {/* Untreated path */}
          {untreatedPath.length > 0 && (
            <Polyline
              positions={untreatedPath}
              color="#ef4444"
              weight={6}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Map controls and legend */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 rounded"></div>
              <span className="text-gray-600">Treated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500 rounded"></div>
              <span className="text-gray-600">Untreated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-500 rounded"></div>
              <span className="text-gray-600">A/B Line</span>
            </div>
          </div>
          {currentPosition && (
            <div className="text-gray-600">
              {currentPosition.latitude.toFixed(6)}°, {currentPosition.longitude.toFixed(6)}°
            </div>
          )}
        </div>
      </div>
    </div>
  );
};