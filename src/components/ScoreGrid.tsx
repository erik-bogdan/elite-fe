import React from 'react';

export type Marker = { type: 'tick' | 'dot'; verticalAlign: '+50%' | '-50%' };
export type Player = { name: string; id: string };
export type CellKey = `${number}-${number}`; // rowIndex-columnIndex

export interface ScoreGridProps {
  players: Player[];          // array of players (each gets their own row)
  columns: number;            // number of round columns
  data: Record<CellKey, Marker[]>; // markers by cell
  heavySeparatorsAfter?: number[]; // column indexes after which a heavy border appears
  className?: string;
  cellHeight?: number;        // px, default 40
  nameColWidth?: number;      // px, default 200
}

const ScoreGrid: React.FC<ScoreGridProps> = ({
  players,
  columns,
  data,
  heavySeparatorsAfter = [],
  className = '',
  cellHeight = 40,
  nameColWidth = 200,
}) => {
  const totalRows = players.length; // Each player gets their own row

  const getCellBorderClasses = (rowIndex: number, colIndex: number): string => {
    const isLastRow = rowIndex === totalRows - 1;
    const isLastCol = colIndex === columns - 1;
    const hasHeavySeparator = heavySeparatorsAfter.includes(colIndex);
    
    let classes = 'border border-gray-300';
    
    // Heavy outer border
    if (rowIndex === 0) classes += ' border-t-2 border-gray-600';
    if (isLastRow) classes += ' border-b-2 border-gray-600';
    if (colIndex === 0) classes += ' border-l-2 border-gray-600';
    if (isLastCol) classes += ' border-r-2 border-gray-600';
    
    // Heavy vertical separators
    if (hasHeavySeparator) classes += ' border-r-2 border-gray-600';
    
    // Heavy separator between teams (after home team players)
    if (rowIndex === 1) {
      classes += ' border-b-2 border-gray-600';
    }
    
    return classes;
  };

  const getAriaLabel = (markers: Marker[], colIndex: number): string => {
    if (markers.length === 0) return colIndex === 0 ? 'No throws' : '';
    
    const hits = markers.filter(m => m.type === 'tick').length;
    const misses = markers.filter(m => m.type === 'dot').length;
    
    if (hits === 0) return `${misses} miss${misses !== 1 ? 'es' : ''}`;
    if (misses === 0) return `${hits} hit${hits !== 1 ? 's' : ''}`;
    return `${hits} hit${hits !== 1 ? 's' : ''}, ${misses} miss${misses !== 1 ? 'es' : ''}`;
  };

  return (
    <div 
      className={`w-full rounded-lg shadow-sm ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `${nameColWidth}px repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${totalRows}, ${cellHeight}px)`,
      }}
    >
      {/* Name column */}
      {players.map((player, playerIndex) => (
        <div 
          key={`name-${playerIndex}`}
          className={`border-r-2 border-gray-600 flex items-center px-4 py-2 ${
            playerIndex === 0 ? 'border-t-2' : ''
          } ${playerIndex === players.length - 1 ? 'border-b-2' : ''}`}
          style={{ 
            gridRow: playerIndex + 1,
            gridColumn: '1',
          }}
        >
          <div className="text-left">
            <div className="font-semibold text-white text-sm">{player.name}</div>
          </div>
        </div>
      ))}

      {/* Data cells */}
      {Array.from({ length: totalRows }, (_, rowIndex) => {
        let actualColIndex = 0; // Track actual column position
        
        return Array.from({ length: columns }, (_, colIndex) => {
          const cellKey: CellKey = `${rowIndex}-${colIndex}`;
          const markers = data[cellKey] || [];
          
          // Skip empty cells except for the first column
          if (markers.length === 0 && colIndex !== 0) {
            return null;
          }
          
          const currentCol = actualColIndex;
          actualColIndex++;
          
          return (
            <div
              key={cellKey}
              className={`relative flex items-center justify-center ${getCellBorderClasses(rowIndex, currentCol)}`}
              style={{
                gridRow: rowIndex + 1,
                gridColumn: currentCol + 2, // +2 because column 1 is names
              }}
              aria-label={getAriaLabel(markers, colIndex)}
            >
              {markers.map((marker, markerIndex) => (
                <span
                  key={markerIndex}
                  className={`inline-block ${
                    marker.type === 'tick'
                      ? 'text-green-500 text-lg'
                      : 'text-red-500 text-sm'
                  }`}
                  style={{ 
                    verticalAlign: marker.verticalAlign,
                    marginRight: '2px'
                  }}
                >
                  {marker.type === 'tick' ? '⎮' : '●'}
                </span>
              ))}
            </div>
          );
        }).filter(Boolean);
      })}
    </div>
  );
};

export default ScoreGrid;
