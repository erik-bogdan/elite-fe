import React, { useEffect, useRef } from 'react';

export type PlayerStats = {
  id: string;
  name: string;
  hits: number;
  total: number;
  percentage: number;
};

export type TeamStats = {
  home: PlayerStats[];
  away: PlayerStats[];
  homeTotal: { hits: number; total: number; percentage: number };
  awayTotal: { hits: number; total: number; percentage: number };
  winner: 'home' | 'away' | null;
};

export type ThrowAction = {
  type: 'hit' | 'miss';
  playerId: string;
  team: 'home' | 'away';
  timestamp: number;
  roundIndex: number;
};

export interface GameStatsGridProps {
  teamStats: TeamStats;
  throws: ThrowAction[];
  gameNumber?: number;
  className?: string;
}

const GameStatsGrid: React.FC<GameStatsGridProps> = ({
  teamStats,
  throws,
  gameNumber = 1,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Group throws by round
  const throwsByRound = (throws || []).reduce((acc, throwAction) => {
    if (!acc[throwAction.roundIndex]) {
      acc[throwAction.roundIndex] = [];
    }
    acc[throwAction.roundIndex].push(throwAction);
    return acc;
  }, {} as Record<number, ThrowAction[]>);

  const rounds = Object.keys(throwsByRound).map(Number).sort((a, b) => a - b);
  const maxRounds = Math.max(...rounds, 0);

  // Auto-scroll to the end when new rounds are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [maxRounds]);

  return (
    <div className={`bg-black/30 rounded-2xl p-6 border-2 border-[#ff5c1a] ${className}`}>
      
      {/* Summary Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
          <tbody>
            <tr>

              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white p-2" style={{ width: '30%' }}>
                {teamStats.home.map((player, index) => (
                  <div key={`home-${player.id || index}`} className="text-sm">{player.name}</div>
                ))}
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2" style={{ width: '12%' }}>
                {teamStats.home.map((player, index) => (
                  <div key={`home-${player.id || index}`} className="text-sm">{player.percentage}%</div>
                ))}
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2" style={{ width: '12%' }}>
                {teamStats.home.map((player, index) => (
                  <div key={`home-${player.id || index}`} className="text-sm">{player.hits}/{player.total}</div>
                ))}
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2" style={{ width: '12%' }}>
                {teamStats.homeTotal.percentage}%
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2" style={{ width: '12%' }}>
                {teamStats.winner === 'home' ? '★' : ''}{teamStats.homeTotal.hits}/{teamStats.homeTotal.total} ({teamStats.homeTotal.total - teamStats.homeTotal.hits})
              </td>
            </tr>
            <tr>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white p-2">
                {teamStats.away.map((player, index) => (
                  <div key={`away-${player.id || index}`} className="text-sm">{player.name}</div>
                ))}
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2">
                {teamStats.away.map((player, index) => (
                  <div key={`away-${player.id || index}`} className="text-sm">{player.percentage}%</div>
                ))}
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2">
                {teamStats.away.map((player, index) => (
                  <div key={`away-${player.id || index}`} className="text-sm">{player.hits}/{player.total}</div>
                ))}
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2">
                {teamStats.awayTotal.percentage}%
              </td>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white text-center p-2">
                {teamStats.winner === 'away' ? '★' : ''}{teamStats.awayTotal.hits}/{teamStats.awayTotal.total} ({teamStats.awayTotal.total - teamStats.awayTotal.hits})
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Throw History */}
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <table className="border-collapse" style={{ tableLayout: 'fixed', width: 'auto' }}>
          <tbody>
            {/* Home Team Row */}
            <tr>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white p-2" style={{ width: '30%' }}>
                {teamStats.home.map((player, index) => (
                  <div key={`home-${player.id || index}`} className="text-sm">{player.name}</div>
                ))}
              </td>
              {rounds.map((roundIndex) => {
                const roundThrows = throwsByRound[roundIndex] || [];
                const homeThrows = roundThrows.filter(t => t.team === 'home');
                const hasHeavyBorder = roundIndex === 4; // After regular time
                
                // If this is the first round and home team didn't start, add empty TD
                if (roundIndex === 0 && homeThrows.length === 0) {
                  return (
                    <td 
                      key={`empty-${roundIndex}`}
                      className={`st-shots border border-gray-600 p-2 text-center ${
                        hasHeavyBorder ? 'border-r-2 border-black' : 'border-r border-gray-400'
                      }`}
                      style={{ width: '80px' }}
                    />
                  );
                }
                
                // Only render TD if there are home throws in this round
                if (homeThrows.length === 0) {
                  return null;
                }
                
                return (
                  <td 
                    key={roundIndex}
                    className={`st-shots border border-gray-600 p-2 text-center ${
                      hasHeavyBorder ? 'border-r-2 border-black' : 'border-r border-gray-400'
                    }`}
                    style={{ 
                      minWidth: '80px',
                      width: homeThrows.length > 2 ? `${80 + (homeThrows.length - 2) * 10}px` : '80px'
                    }}
                  >
                    {homeThrows.map((throwAction, index) => {
                      // Determine which home player threw this
                      const isFirstPlayer = throwAction.playerId === teamStats.home[0]?.id;
                      const verticalAlign = isFirstPlayer ? '+50%' : '-50%';
                      
                      return (
                        <span
                          key={`${throwAction.playerId}-${throwAction.timestamp}`}
                          className={`inline-block ${
                            throwAction.type === 'hit'
                              ? 'text-green-500 text-lg'
                              : 'text-red-500 text-sm'
                          }`}
                          style={{ 
                            verticalAlign: verticalAlign,
                            marginRight: '2px'
                          }}
                        >
                          {throwAction.type === 'hit' ? '⎮' : '●'}
                        </span>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
            
            {/* Away Team Row */}
            <tr>
              <td className="st-stats-header border border-gray-600 bg-gray-800 text-white p-2 border-b-2 border-black">
                {teamStats.away.map((player, index) => (
                  <div key={`away-${player.id || index}`} className="text-sm">{player.name}</div>
                ))}
              </td>
              {rounds.map((roundIndex) => {
                const roundThrows = throwsByRound[roundIndex] || [];
                const awayThrows = roundThrows.filter(t => t.team === 'away');
                const hasHeavyBorder = roundIndex === 4; // After regular time
                
                // If this is the first round and away team didn't start, add empty TD
                if (roundIndex === 0 && awayThrows.length === 0) {
                  return (
                    <td 
                      key={`empty-${roundIndex}`}
                      className={`st-shots border border-gray-600 p-2 text-center border-b-2 border-black ${
                        hasHeavyBorder ? 'border-r-2 border-black' : 'border-r border-black'
                      }`}
                      style={{ width: '80px' }}
                    />
                  );
                }
                
                // Only render TD if there are away throws in this round
                if (awayThrows.length === 0) {
                  return null;
                }
                
                return (
                  <td 
                    key={roundIndex}
                    className={`st-shots border border-gray-600 p-2 text-center border-b-2 border-black ${
                      hasHeavyBorder ? 'border-r-2 border-black' : 'border-r border-black'
                    }`}
                    style={{ 
                      minWidth: '80px',
                      width: awayThrows.length > 2 ? `${80 + (awayThrows.length - 2) * 10}px` : '80px'
                    }}
                  >
                    {awayThrows.map((throwAction, index) => {
                      // Determine which away player threw this
                      const isFirstPlayer = throwAction.playerId === teamStats.away[0]?.id;
                      const verticalAlign = isFirstPlayer ? '+50%' : '-50%';
                      
                      return (
                        <span
                          key={`${throwAction.playerId}-${throwAction.timestamp}`}
                          className={`inline ${
                            throwAction.type === 'hit'
                              ? 'text-green-500 text-lg'
                              : 'text-red-500 text-sm'
                          }`}
                          style={{ 
                            verticalAlign: verticalAlign,
                            marginRight: '2px'
                          }}
                        >
                          {throwAction.type === 'hit' ? '⎮' : '●'}
                        </span>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameStatsGrid;
