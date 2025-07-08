import React from 'react';
import { Navigation, Target, ArrowLeft, ArrowRight, Minus } from 'lucide-react';
import { GuidanceData } from '../types/gps';

interface EnhancedGuidanceDisplayProps {
  guidance: GuidanceData | null;
  isActive: boolean;
}

export const EnhancedGuidanceDisplay: React.FC<EnhancedGuidanceDisplayProps> = ({
  guidance,
  isActive
}) => {
  if (!guidance || !isActive) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Navigation className="w-16 h-16 text-gray-500 mb-4" />
        <p className="text-gray-400 text-xl">No A/B Line Active</p>
        <p className="text-gray-500 text-sm mt-2">Create and activate an A/B line to start guidance</p>
      </div>
    );
  }

  const getErrorColor = (error: number) => {
    const absError = Math.abs(error);
    if (absError < 0.2) return 'text-green-400';
    if (absError < 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBackgroundColor = (error: number) => {
    const absError = Math.abs(error);
    if (absError < 0.2) return 'bg-green-900/20 border-green-500/30';
    if (absError < 0.5) return 'bg-yellow-900/20 border-yellow-500/30';
    return 'bg-red-900/20 border-red-500/30';
  };

  const getSteeringDirection = () => {
    if (Math.abs(guidance.crossTrackError) < 0.1) return 'straight';
    return guidance.crossTrackError > 0 ? 'left' : 'right';
  };

  const direction = getSteeringDirection();

  return (
    <div className={`bg-gray-900 rounded-lg border-2 ${getBackgroundColor(guidance.crossTrackError)} min-h-[400px]`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">A/B Line Guidance</h2>
              <p className="text-gray-400">Precision Navigation Active</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-lg font-bold ${
            guidance.onTrack ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {guidance.onTrack ? 'ON TRACK' : 'OFF TRACK'}
          </div>
        </div>
      </div>

      {/* Main guidance display */}
      <div className="p-6">
        {/* Large steering indicator */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {direction === 'left' && <ArrowLeft className="w-20 h-20 text-yellow-400 animate-pulse" />}
            {direction === 'straight' && <Minus className="w-20 h-20 text-green-400" />}
            {direction === 'right' && <ArrowRight className="w-20 h-20 text-yellow-400 animate-pulse" />}
          </div>
          
          <div className="text-4xl font-bold text-white mb-2">
            {Math.abs(guidance.crossTrackError).toFixed(2)}m
          </div>
          
          <div className={`text-xl font-semibold ${getErrorColor(guidance.crossTrackError)}`}>
            {direction === 'straight' ? 'STRAIGHT' : 
             direction === 'left' ? 'STEER LEFT' : 'STEER RIGHT'}
          </div>
        </div>

        {/* Precision bar */}
        <div className="mb-8">
          <div className="text-center text-gray-400 mb-3">Cross Track Error</div>
          <div className="relative bg-gray-800 rounded-full h-8 mx-8">
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-green-400 transform -translate-x-1/2 z-10" />
            
            {/* Error indicator */}
            <div 
              className={`absolute top-1 bottom-1 w-6 rounded-full transition-all duration-300 ${
                Math.abs(guidance.crossTrackError) < 0.2 ? 'bg-green-400' : 
                Math.abs(guidance.crossTrackError) < 0.5 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{
                left: `${Math.max(2, Math.min(94, 50 + (guidance.crossTrackError / 3) * 50))}%`,
                transform: 'translateX(-50%)'
              }}
            />
            
            {/* Scale markers */}
            <div className="absolute -bottom-6 left-0 text-xs text-gray-500">-3m</div>
            <div className="absolute -bottom-6 left-1/4 text-xs text-gray-500">-1.5m</div>
            <div className="absolute -bottom-6 left-1/2 text-xs text-gray-500 transform -translate-x-1/2">0</div>
            <div className="absolute -bottom-6 right-1/4 text-xs text-gray-500">1.5m</div>
            <div className="absolute -bottom-6 right-0 text-xs text-gray-500">3m</div>
          </div>
        </div>

        {/* Data grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center bg-gray-800/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-white mb-1">
              {guidance.distanceToAB.toFixed(2)}
            </div>
            <div className="text-gray-400 text-sm">Distance to Line (m)</div>
          </div>

          <div className="text-center bg-gray-800/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-white mb-1">
              {Math.abs(guidance.headingError).toFixed(1)}°
            </div>
            <div className="text-gray-400 text-sm">Heading Error</div>
            <div className={`text-xs mt-1 ${getErrorColor(guidance.headingError)}`}>
              {Math.abs(guidance.headingError) < 2 ? 'ALIGNED' : 
               guidance.headingError > 0 ? 'TURN LEFT' : 'TURN RIGHT'}
            </div>
          </div>

          <div className="text-center bg-gray-800/50 rounded-lg p-4">
            <div className={`text-3xl font-bold mb-1 ${
              guidance.onTrack ? 'text-green-400' : 'text-red-400'
            }`}>
              {guidance.onTrack ? '✓' : '✗'}
            </div>
            <div className="text-gray-400 text-sm">On Track Status</div>
            <div className="text-xs text-gray-500 mt-1">±50cm tolerance</div>
          </div>
        </div>
      </div>
    </div>
  );
};