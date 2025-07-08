import React, { useState, useEffect } from 'react';
import { Tractor, Settings as SettingsIcon, Map, BarChart3 } from 'lucide-react';
import { GPSPosition, ABLine, PathPoint, GuidanceData } from './types/gps';
import { useGPS } from './hooks/useGPS';
import { calculateCrossTrackError, findClosestParallelLine } from './utils/gpsUtils';
import { GPSStatus } from './components/GPSStatus';
import { EnhancedGuidanceDisplay } from './components/EnhancedGuidanceDisplay';
import { ABLineManager } from './components/ABLineManager';
import { MapGuidanceView } from './components/MapGuidanceView';
import { CoverageStats } from './components/CoverageStats';
import { Settings } from './components/Settings';

function App() {
  const { 
    currentPosition, 
    isConnected, 
    error, 
    satelliteCount, 
    fixQuality, 
    hdop
  } = useGPS();
  
  const [abLines, setAbLines] = useState<ABLine[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [pathPoints, setPathPoints] = useState<PathPoint[]>([]);
  const [guidanceData, setGuidanceData] = useState<GuidanceData | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'guidance' | 'map' | 'coverage'>('map');
  const [showSettings, setShowSettings] = useState(false);
  const [machineWidth, setMachineWidth] = useState(3.0); // Default 3m width
  const [showTreatmentMap, setShowTreatmentMap] = useState(true);

  // Update guidance data when position or active line changes
  useEffect(() => {
    if (currentPosition && activeLineId) {
      const activeLine = abLines.find(line => line.id === activeLineId);
      if (activeLine) {
        // Find the closest parallel line for more accurate guidance
        const { line: closestLine } = findClosestParallelLine(currentPosition, activeLine, machineWidth);
        const guidance = calculateCrossTrackError(currentPosition, closestLine);
        setGuidanceData(guidance);
      }
    } else {
      setGuidanceData(null);
    }
  }, [currentPosition, activeLineId, abLines, machineWidth]);

  // Record path points
  useEffect(() => {
    if (currentPosition && isConnected && fixQuality > 0) {
      const newPathPoint: PathPoint = {
        position: currentPosition,
        treated: true, // In real implementation, this would be based on implement status
        timestamp: Date.now()
      };
      
      setPathPoints(prev => [...prev, newPathPoint]);
    }
  }, [currentPosition, isConnected, fixQuality]);

  const handleCreateLine = (pointA: GPSPosition, pointB: GPSPosition, name: string) => {
    const newLine: ABLine = {
      id: Date.now().toString(),
      pointA,
      pointB,
      name,
      created: Date.now()
    };
    setAbLines(prev => [...prev, newLine]);
  };

  const handleDeleteLine = (id: string) => {
    setAbLines(prev => prev.filter(line => line.id !== id));
    if (activeLineId === id) {
      setActiveLineId(null);
    }
  };

  const handleActivateLine = (id: string) => {
    setActiveLineId(id);
  };

  const handleDeactivateLine = () => {
    setActiveLineId(null);
  };

  const clearPathData = () => {
    setPathPoints([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-800 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tractor className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">AgriNav Pro</h1>
              <p className="text-green-200 text-sm">GPS Guidance System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="text-green-200">
                {satelliteCount} sats | {fixQuality > 0 ? 'GPS' : 'NO FIX'}
              </div>
              <div className="text-green-300 text-xs">
                HDOP: {hdop.toFixed(1)}
              </div>
            </div>
            <button
              onClick={clearPathData}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
            >
              Clear Path
            </button>
            <SettingsIcon 
              onClick={() => setShowSettings(true)}
              className="w-6 h-6 text-green-200 cursor-pointer hover:text-white transition-colors" 
            />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('guidance')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'guidance'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Guidance
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'map'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="w-4 h-4" />
            Satellite Map
          </button>
          <button
            onClick={() => setActiveTab('coverage')}
            className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'coverage'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Coverage
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'guidance' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <EnhancedGuidanceDisplay
                guidance={guidanceData}
                isActive={activeLineId !== null}
              />
              <ABLineManager
                abLines={abLines}
                currentPosition={currentPosition}
                activeLineId={activeLineId}
                onCreateLine={handleCreateLine}
                onDeleteLine={handleDeleteLine}
                onActivateLine={handleActivateLine}
                onDeactivateLine={handleDeactivateLine}
              />
            </div>
            <div>
              <GPSStatus
                position={currentPosition}
                isConnected={isConnected}
                error={error}
                satelliteCount={satelliteCount}
                fixQuality={fixQuality}
                hdop={hdop}
              />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <div className="h-[600px]">
                <MapGuidanceView
                  currentPosition={currentPosition}
                  abLines={abLines}
                  activeLineId={activeLineId}
                  pathPoints={pathPoints}
                  machineWidth={machineWidth}
                  showTreatmentMap={showTreatmentMap}
                  onToggleTreatmentMap={() => setShowTreatmentMap(!showTreatmentMap)}
                />
              </div>
            </div>
            <div>
              <GPSStatus
                currentPosition={currentPosition}
                isConnected={isConnected}
                error={error}
                satelliteCount={satelliteCount}
                fixQuality={fixQuality}
                hdop={hdop}
              />
            </div>
          </div>
        )}

        {activeTab === 'guidance' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <EnhancedGuidanceDisplay
                guidance={guidanceData}
                isActive={activeLineId !== null}
              />
              <ABLineManager
                abLines={abLines}
                position={currentPosition}
                activeLineId={activeLineId}
                onCreateLine={handleCreateLine}
                onDeleteLine={handleDeleteLine}
                onActivateLine={handleActivateLine}
                onDeactivateLine={handleDeactivateLine}
              />
            </div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        machineWidth={machineWidth}
        onMachineWidthChange={setMachineWidth}
        showTreatmentMap={showTreatmentMap}
        onToggleTreatmentMap={() => setShowTreatmentMap(!showTreatmentMap)}
      />
    </div>
  );
}

export default App;