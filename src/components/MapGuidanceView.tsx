import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Rectangle } from 'react-leaflet';
import { LatLngExpression, LatLngBounds } from 'leaflet';
import L from 'leaflet';
import { GPSPosition, ABLine, PathPoint } from '../types/gps';
import { calculateDistance, calculateBearing } from '../utils/gpsUtils';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapGuidanceViewProps {
  currentPosition: GPSPosition | null;
  abLines: ABLine[];
  activeLineId: string | null;
  pathPoints: PathPoint[];
  machineWidth: number;
  showTreatmentMap: boolean;
  onToggleTreatmentMap: () => void;
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

// Generate parallel lines
const generateParallelLines = (abLine: ABLine, machineWidth: number, count: number = 10): ABLine[] => {
  const parallelLines: ABLine[] = [];
  const bearing = calculateBearing(abLine.pointA, abLine.pointB);
  const perpendicularBearing = (bearing + 90) % 360;
  
  for (let i = -count; i <= count; i++) {
    if (i === 0) continue; // Skip the original line
    
    const offset = i * machineWidth;
    const offsetRad = (perpendicularBearing * Math.PI) / 180;
    
    // Calculate offset in meters to lat/lon
    const latOffset = (offset * Math.cos(offsetRad)) / 111320;
    const lonOffset = (offset * Math.sin(offsetRad)) / (111320 * Math.cos(abLine.pointA.latitude * Math.PI / 180));
    
    const newPointA: GPSPosition = {
      latitude: abLine.pointA.latitude + latOffset,
      longitude: abLine.pointA.longitude + lonOffset,
      timestamp: Date.now()
    };
    
    const newPointB: GPSPosition = {
      latitude: abLine.pointB.latitude + latOffset,
      longitude: abLine.pointB.longitude + lonOffset,
      timestamp: Date.now()
    };
    
    parallelLines.push({
      id: `${abLine.id}_parallel_${i}`,
      pointA: newPointA,
      pointB: newPointB,
      name: `${abLine.name} +${offset}m`,
      created: abLine.created
    });
  }
  
  return parallelLines;
};

// Generate treatment rectangles based on path points
const generateTreatmentRectangles = (pathPoints: PathPoint[], machineWidth: number): LatLngBounds[] => {
  const rectangles: LatLngBounds[] = [];
  const halfWidth = machineWidth / 2;
  
  pathPoints.forEach(point => {
    if (point.treated) {
      // Create a small rectangle representing the treated area
      const latOffset = (halfWidth / 111320);
      const lonOffset = (halfWidth / (111320 * Math.cos(point.position.latitude * Math.PI / 180)));
      
      const bounds = new L.LatLngBounds(
        [point.position.latitude - latOffset, point.position.longitude - lonOffset],
        [point.position.latitude + latOffset, point.position.longitude + lonOffset]
      );
      
      rectangles.push(bounds);
    }
  });
  
  return rectangles;
};

export const MapGuidanceView: React.FC<MapGuidanceViewProps> = ({
  currentPosition,
  abLines,
  activeLineId,
  pathPoints,
  machineWidth,
  showTreatmentMap,
  onToggleTreatmentMap
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [mapZoom, setMapZoom] = useState(18);
  
  // Default center
  const defaultCenter: LatLngExpression = currentPosition 
    ? [currentPosition.latitude, currentPosition.longitude]
    : [46.7629574, 6.5638699];

  // Get active line and generate parallel lines
  const activeLine = abLines.find(line => line.id === activeLineId);
  const parallelLines = activeLine ? generateParallelLines(activeLine, machineWidth) : [];
  
  // Generate treatment rectangles
  const treatmentRectangles = showTreatmentMap ? generateTreatmentRectangles(pathPoints, machineWidth) : [];

  return (
    <div className="relative h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={() => setMapZoom(prev => Math.max(prev - 1, 10))}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
        >
          −
        </button>
        <button
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 text-xs font-bold"
        >
          3D
        </button>
        <button
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          🎯
        </button>
      </div>

      {/* Treatment Map Toggle */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={onToggleTreatmentMap}
          className={`px-4 py-2 rounded-lg shadow-md font-medium transition-colors ${
            showTreatmentMap 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Treatment Map
        </button>
      </div>

      {/* Speed and Status Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 text-white px-4 py-2 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <span>7.25 ha</span>
          <span>25.4 km/h</span>
          <span>340 m</span>
          <span>00:12:42</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>RTK</span>
          </div>
          <span>Headland Straight</span>
        </div>
      </div>

      {/* Pause Button */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <button className="w-12 h-12 bg-yellow-500 text-white rounded-lg shadow-md flex items-center justify-center text-xl">
          ⏸
        </button>
      </div>

      {/* Machine Width Indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
          <div className="flex items-center gap-1">
            <div className="w-4 h-1 bg-green-400"></div>
            <span>⏸</span>
            <div className="w-4 h-1 bg-green-400"></div>
          </div>
        </div>
      </div>
      
      <div className="h-full">
        <MapContainer
          center={defaultCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={false}
        >
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
          
          {/* Active A/B Line */}
          {activeLine && (
            <Polyline
              positions={[
                [activeLine.pointA.latitude, activeLine.pointA.longitude],
                [activeLine.pointB.latitude, activeLine.pointB.longitude]
              ]}
              color="#ffffff"
              weight={3}
              opacity={1}
            />
          )}
          
          {/* Parallel Lines */}
          {parallelLines.map(line => (
            <Polyline
              key={line.id}
              positions={[
                [line.pointA.latitude, line.pointA.longitude],
                [line.pointB.latitude, line.pointB.longitude]
              ]}
              color="#ffffff"
              weight={1}
              opacity={0.6}
              dashArray="5, 5"
            />
          ))}
          
          {/* Treatment Rectangles */}
          {treatmentRectangles.map((bounds, index) => (
            <Rectangle
              key={index}
              bounds={bounds}
              pathOptions={{
                fillColor: '#10b981',
                fillOpacity: 0.6,
                color: '#10b981',
                weight: 0
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};