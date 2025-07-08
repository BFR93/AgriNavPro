import { GPSPosition, ABLine, GuidanceData } from '../types/gps';

export const calculateDistance = (pos1: GPSPosition, pos2: GPSPosition): number => {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (pos1.latitude * Math.PI) / 180;
  const lat2Rad = (pos2.latitude * Math.PI) / 180;
  const deltaLat = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const deltaLon = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculateBearing = (pos1: GPSPosition, pos2: GPSPosition): number => {
  const lat1Rad = (pos1.latitude * Math.PI) / 180;
  const lat2Rad = (pos2.latitude * Math.PI) / 180;
  const deltaLon = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const x = Math.sin(deltaLon) * Math.cos(lat2Rad);
  const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon);

  const bearing = Math.atan2(x, y);
  return (bearing * 180 / Math.PI + 360) % 360;
};

export const calculateCrossTrackError = (currentPos: GPSPosition, abLine: ABLine): GuidanceData => {
  const { pointA, pointB } = abLine;
  
  // Calculate distance from current position to A-B line
  const lineDistance = calculateDistance(pointA, pointB);
  const lineBearing = calculateBearing(pointA, pointB);
  
  // Distance from A to current position
  const aToCurrentDistance = calculateDistance(pointA, currentPos);
  const aToCurrentBearing = calculateBearing(pointA, currentPos);
  
  // Cross track error calculation
  const bearingDiff = (aToCurrentBearing - lineBearing + 360) % 360;
  const crossTrackError = aToCurrentDistance * Math.sin(bearingDiff * Math.PI / 180);
  
  // Distance along the A-B line
  const distanceAlongLine = aToCurrentDistance * Math.cos(bearingDiff * Math.PI / 180);
  
  // Heading error
  const currentHeading = currentPos.heading || 0;
  const headingError = (currentHeading - lineBearing + 360) % 360;
  const normalizedHeadingError = headingError > 180 ? headingError - 360 : headingError;
  
  return {
    crossTrackError,
    distanceToAB: Math.abs(crossTrackError),
    headingError: normalizedHeadingError,
    onTrack: Math.abs(crossTrackError) < 0.5 // 50cm tolerance
  };
};

export const findClosestParallelLine = (
  currentPos: GPSPosition, 
  abLine: ABLine, 
  machineWidth: number
): { line: ABLine; distance: number } => {
  const bearing = calculateBearing(abLine.pointA, abLine.pointB);
  const perpendicularBearing = (bearing + 90) % 360;
  
  let closestLine = abLine;
  let minDistance = calculateDistanceToLine(currentPos, abLine);
  
  // Check parallel lines on both sides
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    
    const offset = i * machineWidth;
    const offsetRad = (perpendicularBearing * Math.PI) / 180;
    
    // Calculate offset in meters to lat/lon
    const latOffset = (offset * Math.cos(offsetRad)) / 111320;
    const lonOffset = (offset * Math.sin(offsetRad)) / (111320 * Math.cos(abLine.pointA.latitude * Math.PI / 180));
    
    const parallelLine: ABLine = {
      id: `${abLine.id}_parallel_${i}`,
      pointA: {
        latitude: abLine.pointA.latitude + latOffset,
        longitude: abLine.pointA.longitude + lonOffset,
        timestamp: Date.now()
      },
      pointB: {
        latitude: abLine.pointB.latitude + latOffset,
        longitude: abLine.pointB.longitude + lonOffset,
        timestamp: Date.now()
      },
      name: `${abLine.name} +${offset}m`,
      created: abLine.created
    };
    
    const distance = calculateDistanceToLine(currentPos, parallelLine);
    if (distance < minDistance) {
      minDistance = distance;
      closestLine = parallelLine;
    }
  }
  
  return { line: closestLine, distance: minDistance };
};

export const calculateDistanceToLine = (point: GPSPosition, line: ABLine): number => {
  const { pointA, pointB } = line;
  
  // Calculate distance from point to line using cross track error
  const lineBearing = calculateBearing(pointA, pointB);
  const aToPointDistance = calculateDistance(pointA, point);
  const aToPointBearing = calculateBearing(pointA, point);
  
  const bearingDiff = (aToPointBearing - lineBearing + 360) % 360;
  return Math.abs(aToPointDistance * Math.sin(bearingDiff * Math.PI / 180));
};
export const formatCoordinate = (coord: number, isLatitude: boolean): string => {
  const abs = Math.abs(coord);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  const direction = coord >= 0 ? (isLatitude ? 'N' : 'E') : (isLatitude ? 'S' : 'W');
  
  return `${degrees}°${minutes.toFixed(4)}'${direction}`;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(1)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};