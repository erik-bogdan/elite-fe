import React from 'react';
import TimelineGrid, { TimelineAction } from './TimelineGrid';

const TimelineGridExample: React.FC = () => {
  // Sample timeline data
  const actions: TimelineAction[] = [
    {
      type: 'hit',
      playerId: 'erik',
      team: 'home',
      timestamp: 1000,
      playerName: 'Erik'
    },
    {
      type: 'miss',
      playerId: 'krisz',
      team: 'home',
      timestamp: 2000,
      playerName: 'Krisz'
    },
    {
      type: 'hit',
      playerId: 'draftd1',
      team: 'away',
      timestamp: 3000,
      playerName: 'DraftD_1'
    },
    {
      type: 'hit',
      playerId: 'draftd2',
      team: 'away',
      timestamp: 4000,
      playerName: 'DraftD_2'
    },
    {
      type: 'miss',
      playerId: 'erik',
      team: 'home',
      timestamp: 5000,
      playerName: 'Erik'
    },
    {
      type: 'hit',
      playerId: 'krisz',
      team: 'home',
      timestamp: 6000,
      playerName: 'Krisz'
    }
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">TimelineGrid Example</h1>
        
        <TimelineGrid
          actions={actions}
          homeTeamName="Home Team"
          awayTeamName="Away Team"
          className="w-full"
          height={250}
        />
        
        <div className="mt-6 text-sm text-gray-600">
          <p>• Green vertical bars = Hits</p>
          <p>• Red dots = Misses</p>
          <p>• Lines branch up for home team, down for away team</p>
          <p>• Actions are displayed in chronological order</p>
        </div>
      </div>
    </div>
  );
};

export default TimelineGridExample;
