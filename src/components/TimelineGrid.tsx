import React from 'react';

export type TimelineAction = {
  type: 'hit' | 'miss';
  playerId: string;
  team: 'home' | 'away';
  timestamp: number;
  playerName: string;
};

export interface TimelineGridProps {
  actions: TimelineAction[];
  homeTeamName?: string;
  awayTeamName?: string;
  className?: string;
  height?: number; // px, default 200
}

const TimelineGrid: React.FC<TimelineGridProps> = ({
  actions,
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  className = '',
  height = 200,
}) => {
  const sortedActions = [...actions].sort((a, b) => a.timestamp - b.timestamp);
  
  if (sortedActions.length === 0) {
    return (
      <div className={`bg-black/30 rounded-2xl p-6 border-2 border-[#ff5c1a] ${className}`}>
        <h2 className="text-xl text-white mb-4 text-center font-bold">Dobás történet</h2>
        <div className="text-white text-center">Még nincsenek dobások</div>
      </div>
    );
  }

  return (
    <div className={`bg-black/30 rounded-2xl p-6 border-2 border-[#ff5c1a] ${className}`}>
      <h2 className="text-xl text-white mb-4 text-center font-bold">Dobás történet</h2>
      
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Center timeline */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-400 transform -translate-y-1/2"></div>
        
        {/* Team labels */}
        <div className="absolute top-4 left-4 text-white text-sm font-semibold">
          {homeTeamName}
        </div>
        <div className="absolute bottom-4 left-4 text-white text-sm font-semibold">
          {awayTeamName}
        </div>
        
        {/* Actions */}
        {sortedActions.map((action, index) => {
          const totalActions = sortedActions.length;
          const x = totalActions > 1 ? (index / (totalActions - 1)) * 80 + 10 : 50; // 10-90% of width
          const y = action.team === 'home' ? 25 : 75; // 25% for home (up), 75% for away (down)
          
          return (
            <div key={`${action.playerId}-${action.timestamp}`} className="absolute">
              {/* Connection line from timeline to action */}
              <div
                className="absolute bg-gray-400"
                style={{
                  left: `${x}%`,
                  top: '50%',
                  width: '2px',
                  height: action.team === 'home' ? '25%' : '25%',
                  transform: 'translateX(-50%)',
                }}
              />
              
              {/* Action indicator */}
              <div
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                  action.type === 'hit'
                    ? 'w-3 h-5 bg-green-500 rounded'
                    : 'w-3 h-3 bg-red-500 rounded-full'
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
                title={`${action.playerName} - ${action.type.toUpperCase()}`}
              />
              
              {/* Player name label */}
              <div
                className="absolute text-white text-xs font-medium whitespace-nowrap"
                style={{
                  left: `${x}%`,
                  top: action.team === 'home' ? `${y - 20}%` : `${y + 20}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {action.playerName}
              </div>
              
              {/* Round number */}
              <div
                className="absolute text-white text-xs bg-gray-600 px-2 py-1 rounded"
                style={{
                  left: `${x}%`,
                  top: '5%',
                  transform: 'translateX(-50%)',
                }}
              >
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineGrid;
