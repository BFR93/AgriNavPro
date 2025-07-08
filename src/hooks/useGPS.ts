import { useState, useEffect, useRef } from 'react';
import { GPSPosition } from '../types/gps';
import { parseGGA, parseRMC, validateChecksum } from '../utils/nmeaParser';
import { TCPGPSClient } from '../services/tcpGpsClient';

export const useGPS = () => {
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [satelliteCount, setSatelliteCount] = useState<number>(0);
  const [fixQuality, setFixQuality] = useState<number>(0);
  const [hdop, setHdop] = useState<number>(0);
  
  const gpsClientRef = useRef<TCPGPSClient | null>(null);
  const lastPositionRef = useRef<{ speed?: number; heading?: number }>({});

  useEffect(() => {
    // Initialize GPS client
    gpsClientRef.current = new TCPGPSClient();
    
    // Set up data handler
    gpsClientRef.current.onData((data: string) => {
      processNMEAData(data);
    });
    
    // Set up status handler
    gpsClientRef.current.onStatus((connected: boolean, errorMsg?: string) => {
      setIsConnected(connected);
      if (errorMsg) {
        setError(errorMsg);
      } else {
        setError(null);
      }
    });
    
    return () => {
      if (gpsClientRef.current) {
        gpsClientRef.current.disconnect();
      }
    };
  }, []);

  const processNMEAData = (data: string) => {
    const sentences = data.split('\n').filter(line => line.trim().length > 0);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      
      // Validate checksum if present
      if (trimmed.includes('*') && !validateChecksum(trimmed)) {
        console.warn('Invalid NMEA checksum:', trimmed);
        return;
      }

      if (trimmed.includes('GGA')) {
        const nmeaData = parseGGA(trimmed);
        if (nmeaData && nmeaData.isValid) {
          const position: GPSPosition = {
            latitude: nmeaData.latitude,
            longitude: nmeaData.longitude,
            altitude: nmeaData.altitude,
            speed: lastPositionRef.current.speed || 0,
            heading: lastPositionRef.current.heading || 0,
            timestamp: Date.now()
          };

          setCurrentPosition(position);
          setSatelliteCount(nmeaData.satelliteCount);
          setFixQuality(nmeaData.fixQuality);
          setHdop(nmeaData.hdop);
          setError(null);
        }
      } else if (trimmed.includes('RMC')) {
        const rmcData = parseRMC(trimmed);
        if (rmcData) {
          lastPositionRef.current = {
            speed: rmcData.speed,
            heading: rmcData.heading
          };
        }
      }
    });
  };

  const connectToGPS = () => {
    if (gpsClientRef.current) {
      gpsClientRef.current.disconnect();
    }
    gpsClientRef.current = new TCPGPSClient();
    
    gpsClientRef.current.onData(processNMEAData);
    gpsClientRef.current.onStatus((connected: boolean, errorMsg?: string) => {
      setIsConnected(connected);
      setError(errorMsg || null);
    });
  };

  const disconnect = () => {
    if (gpsClientRef.current) {
      gpsClientRef.current.disconnect();
    }
    setIsConnected(false);
  };

  return {
    currentPosition,
    isConnected,
    error,
    satelliteCount,
    fixQuality,
    hdop,
    satellites: [], // Removed satellite tracking for now
    connectToGPS,
    disconnect
  };
};