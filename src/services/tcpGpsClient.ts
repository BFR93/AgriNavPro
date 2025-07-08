export class TCPGPSClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private dataInterval: NodeJS.Timeout | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onStatusCallback: ((connected: boolean, error?: string) => void) | null = null;
  
  constructor() {
    this.connect();
  }

  private connect() {
    try {
    //   console.log('Starting GPS simulation mode...');
    //   this.startSimulation();
    // } catch (error) {
    //   console.error('Failed to start GPS simulation:', error);
    //   this.onStatusCallback?.(false, `Simulation failed: ${error}`);
    // }
      const wsUrl = 'ws://localhost:8080'; // ← Ton serveur WebSocket Node.js
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.onStatusCallback?.(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'nmea' && typeof message.data === 'string') {
            this.onDataCallback?.(message.data);
          } else if (message.type === 'status') {
            this.onStatusCallback?.(message.connected, message.error);
          }
        } catch (e) {
          console.error('Malformed message from server:', event.data);
        }
      };

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        this.onStatusCallback?.(false, 'WebSocket error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.onStatusCallback?.(false, 'WebSocket connection closed');
        this.scheduleReconnect(); // si tu veux gérer la reconnexion
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.onStatusCallback?.(false, `Connection failed: ${error}`);
    }
  }

  private startSimulation() {
    console.log('Starting GPS simulation...');
    
    // Simulate successful connection
    setTimeout(() => {
      this.onStatusCallback?.(true);
      
      // Start sending simulated NMEA data
      this.dataInterval = setInterval(() => {
        if (this.onDataCallback) {
          const simulatedData = this.generateSimulatedNMEA();
          this.onDataCallback(simulatedData);
        }
      }, 1000);
      
    }, 1000);
  }

  private generateSimulatedNMEA(): string {
    const now = new Date();
    const timeStr = now.toISOString().substr(11, 8).replace(/:/g, '');
    
    // Base coordinates from your actual NMEA data
    const baseLatDeg = 46;
    const baseLatMin = 45.7778472;
    const baseLonDeg = 6;
    const baseLonMin = 33.8321953;
    
    // Add realistic movement simulation
    const timeVariation = (Date.now() % 60000) / 1000; // 60 second cycle
    const latVariation = Math.sin(timeVariation / 10) * 0.0001; // Small movement
    const lonVariation = Math.cos(timeVariation / 10) * 0.0001;
    
    const currentLatMin = baseLatMin + latVariation;
    const currentLonMin = baseLonMin + lonVariation;
    
    // Simulate varying satellite count and HDOP
    const satCount = 10 + Math.floor(Math.sin(timeVariation / 5) * 3); // 7-13 satellites
    const hdop = 0.5 + Math.abs(Math.sin(timeVariation / 8)) * 0.3; // 0.5-0.8 HDOP
    
    // Generate GGA sentence
    const ggaSentence = `$GNGGA,${timeStr},${baseLatDeg}${currentLatMin.toFixed(7)},N,00${baseLonDeg}${currentLonMin.toFixed(7)},E,2,${satCount},${hdop.toFixed(2)},448.872,M,47.212,M,,0123`;
    
    // Calculate checksum
    const checksum = this.calculateChecksum(ggaSentence);
    const completeGGA = `${ggaSentence}*${checksum}`;
    
    // Generate RMC sentence for speed and heading
    const speed = 2.5 + Math.sin(timeVariation / 6) * 1.5; // 1-4 m/s
    const heading = 45 + Math.sin(timeVariation / 12) * 30; // 15-75 degrees
    const speedKnots = speed * 1.94384; // Convert m/s to knots
    
    const rmcSentence = `$GNRMC,${timeStr},A,${baseLatDeg}${currentLatMin.toFixed(7)},N,00${baseLonDeg}${currentLonMin.toFixed(7)},E,${speedKnots.toFixed(2)},${heading.toFixed(1)},${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear().toString().substr(2)},,,A`;
    const rmcChecksum = this.calculateChecksum(rmcSentence);
    const completeRMC = `${rmcSentence}*${rmcChecksum}`;
    
    return `${completeGGA}\n${completeRMC}`;
  }

  private calculateChecksum(sentence: string): string {
    let checksum = 0;
    const data = sentence.substring(1); // Remove the $ character
    
    for (let i = 0; i < data.length; i++) {
      checksum ^= data.charCodeAt(i);
    }
    
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Restarting GPS simulation...');
      this.connect();
    }, 5000);
  }

  public onData(callback: (data: string) => void) {
    this.onDataCallback = callback;
  }

  public onStatus(callback: (connected: boolean, error?: string) => void) {
    this.onStatusCallback = callback;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }
    
    this.onStatusCallback?.(false);
  }
}

// WebSocket Bridge Server Example (Node.js)
// You would run this on a server to bridge TCP to WebSocket
/*
const WebSocket = require('ws');
const net = require('net');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Create TCP connection to GPS receiver
  const tcpClient = net.createConnection({
    host: '192.168.1.1',
    port: 9877
  });
  
  tcpClient.on('connect', () => {
    console.log('Connected to GPS TCP server');
    ws.send(JSON.stringify({ type: 'status', connected: true }));
  });
  
  tcpClient.on('data', (data) => {
    // Forward NMEA data to WebSocket client
    ws.send(JSON.stringify({ type: 'nmea', data: data.toString() }));
  });
  
  tcpClient.on('error', (error) => {
    console.error('TCP connection error:', error);
    ws.send(JSON.stringify({ type: 'status', connected: false, error: error.message }));
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    tcpClient.end();
  });
});
*/