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

console.log('GPS WebSocket bridge server running on port 8080');
