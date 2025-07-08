export interface NMEAData {
  latitude: number;
  longitude: number;
  altitude: number;
  fixQuality: number;
  satelliteCount: number;
  hdop: number;
  timestamp: string;
  isValid: boolean;
}

export interface SatelliteData {
  id: number;
  elevation: number;
  azimuth: number;
  snr: number;
  used: boolean;
}

export interface GSVData {
  totalMessages: number;
  messageNumber: number;
  totalSatellites: number;
  satellites: SatelliteData[];
}

export const parseGGA = (sentence: string): NMEAData | null => {
  try {
    // Remove any whitespace and split by comma
    const parts = sentence.trim().split(',');
    
    // Verify it's a GGA sentence
    if (!parts[0].includes('GGA')) {
      return null;
    }

    const time = parts[1];
    const latDegMin = parts[2];
    const latDir = parts[3];
    const lonDegMin = parts[4];
    const lonDir = parts[5];
    const fixQuality = parseInt(parts[6]) || 0;
    const satelliteCount = parseInt(parts[7]) || 0;
    const hdop = parseFloat(parts[8]) || 0;
    const altitude = parseFloat(parts[9]) || 0;

    // Convert DDMM.MMMMM format to decimal degrees
    const convertToDecimal = (degMin: string, direction: string, isLatitude: boolean): number => {
      if (!degMin || degMin.length < 4) return 0;

      const degreeDigits = isLatitude ? 2 : 3;

      const degrees = parseInt(degMin.substring(0, degreeDigits));
      const minutes = parseFloat(degMin.substring(degreeDigits));
      let decimal = degrees + (minutes / 60);

      if (direction === 'S' || direction === 'W') {
        decimal = -decimal;
      }

      return decimal;
    };

    const latitude = convertToDecimal(latDegMin, latDir, true);
    const longitude = convertToDecimal(lonDegMin, lonDir, false);

    return {
      latitude,
      longitude,
      altitude,
      fixQuality,
      satelliteCount,
      hdop,
      timestamp: time,
      isValid: fixQuality > 0 && latitude !== 0 && longitude !== 0
    };
  } catch (error) {
    console.error('Error parsing NMEA GGA sentence:', error);
    return null;
  }
};

export const parseRMC = (sentence: string): { speed?: number; heading?: number } | null => {
  try {
    const parts = sentence.trim().split(',');
    
    if (!parts[0].includes('RMC')) {
      return null;
    }

    const speed = parseFloat(parts[7]) || 0; // Speed in knots
    const heading = parseFloat(parts[8]) || 0; // Course over ground

    return {
      speed: speed * 0.514444, // Convert knots to m/s
      heading
    };
  } catch (error) {
    console.error('Error parsing NMEA RMC sentence:', error);
    return null;
  }
};

export const parseGSV = (sentence: string): GSVData | null => {
  try {
    const parts = sentence.trim().split(',');
    
    if (!parts[0].includes('GSV')) {
      return null;
    }

    const totalMessages = parseInt(parts[1]) || 0;
    const messageNumber = parseInt(parts[2]) || 0;
    const totalSatellites = parseInt(parts[3]) || 0;
    
    const satellites: SatelliteData[] = [];
    
    // Each GSV message can contain up to 4 satellites
    for (let i = 0; i < 4; i++) {
      const baseIndex = 4 + (i * 4);
      if (baseIndex + 3 < parts.length) {
        const id = parseInt(parts[baseIndex]);
        const elevation = parseInt(parts[baseIndex + 1]) || 0;
        const azimuth = parseInt(parts[baseIndex + 2]) || 0;
        const snr = parseInt(parts[baseIndex + 3]) || 0;
        
        if (id) {
          satellites.push({
            id,
            elevation,
            azimuth,
            snr,
            used: snr > 0 // Assume satellites with SNR > 0 are being used
          });
        }
      }
    }

    return {
      totalMessages,
      messageNumber,
      totalSatellites,
      satellites
    };
  } catch (error) {
    console.error('Error parsing NMEA GSV sentence:', error);
    return null;
  }
};

export const calculateChecksum = (sentence: string): string => {
  let checksum = 0;
  const data = sentence.substring(1, sentence.indexOf('*'));
  
  for (let i = 0; i < data.length; i++) {
    checksum ^= data.charCodeAt(i);
  }
  
  return checksum.toString(16).toUpperCase().padStart(2, '0');
};

export const validateChecksum = (sentence: string): boolean => {
  const checksumIndex = sentence.indexOf('*');
  if (checksumIndex === -1) return false;
  
  const providedChecksum = sentence.substring(checksumIndex + 1, checksumIndex + 3);
  const calculatedChecksum = calculateChecksum(sentence);
  
  return providedChecksum === calculatedChecksum;
};