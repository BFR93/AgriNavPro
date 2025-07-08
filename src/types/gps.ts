export interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface ABLine {
  pointA: GPSPosition;
  pointB: GPSPosition;
  id: string;
  name: string;
  created: number;
}

export interface PathPoint {
  position: GPSPosition;
  treated: boolean;
  timestamp: number;
}

export interface GuidanceData {
  crossTrackError: number;
  distanceToAB: number;
  headingError: number;
  onTrack: boolean;
}

export interface FieldBoundary {
  points: GPSPosition[];
  name: string;
  area: number;
}