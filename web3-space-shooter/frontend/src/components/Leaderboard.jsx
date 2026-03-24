// src/components/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { useGameContract } from '../hooks/useGameContract';

// Mock leaderboard data for testing (until contracts are deployed)
const MOCK_LEADERBOARD = [
  { address: '0x1234567890123456789012345678901234567890', name: 'CyberNinja', score: 5420, games: 24, earned: '125.50' },
  { address: '0x2345678901234567890123456789012345678901', name: 'SpaceAce', score: 4890, games: 18, earned: '98.30' },
  { address: '0x3456789012345678901234567890123456789012', name: 'NovaStrike', score: 4350, games: 16, earned: '87.60' },
  { address: '0x4567890123456789012345678901234567890123', name: 'QuantumRider', score: 3920, games: 14, earned: '76.45' },
  { address: '0x5678901234567890123456789012345678901234', name: 'PhantomFlash', score: 3540, games: 13, earned: '65.20' },
  { address: '0x6789012345678901234567890123456789012345', name: 'VortexPilot', score: 3180, games: 11, earned: '54.10' },
  { address: '0x7890123456789012345678901234567890123456', name: 'SonicBurst', score: 2890, games: 10, earned: '45.75' },
  { address: '0x8901234567890123456789012345678901234567', name: 'IceBreaker', score: 2450, games: 9, earned: '38.90' },
  { address: '0x9012345678901234567890123456789012345678', name: 'BlazeFury', score: 2120, games: 8, earned: '32.15' },
  { address: '0xa123456789012345678901234567890123456789', name: 'StormChaser', score: 1890, games: 7, earned: '28.50' }
];

export default function Leaderboard({ web3Data }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // all, week, day
  const [playerRank, setPlayerRank] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const { getContracts } = useGameContract(web3Data?.signer, web3Data?.chainId);

  useEffect(() => {
    fetchLeaderboard();
  }, [web3Data, timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const contracts = getContracts();

      // Check if contracts are available and valid
      const hasValidContracts = contracts &&
                               contracts.game &&
                               contracts.game.address &&
                               contracts.game.address !== '0x...';

      // NOTE: SpaceShooterGame contract doesn't have getTopPlayers or getPlayerStats
      // The contract only has highScores(address) for individual lookups
      // For now, we use mock data. Use LeaderboardNew.jsx with Firebase for real leaderboard

      if (hasValidContracts && web3Data?.account) {
        try {
          // Get current user's high score only
          const userHighScore = await contracts.game.highScores(web3Data.account);

          // Use mock data with user's real score injected
          const leaderboardData = MOCK_LEADERBOARD.map((player, index) => ({
            ...player,
            rank: index + 1,
            isCurrentPlayer: web3Data?.account?.toLowerCase() === player.address.toLowerCase()
          }));

          // If user has a score, find/update their entry
          if (userHighScore > 0) {
            const userEntry = leaderboardData.find(p => p.isCurrentPlayer);
            if (userEntry) {
              userEntry.score = Number(userHighScore);
            }
          }

          setLeaderboard(leaderboardData);
          setUsingMockData(true); // Still mostly mock
        } catch (contractError) {
          console.warn('Contract call failed, using mock data:', contractError);
          useMockData();
        }
      } else {
        // Use mock data if contracts not available
        useMockData();
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      useMockData();
    } finally {
      setLoading(false);
    }
  };

  const useMockData = () => {
    // Add ranks to mock data
    const leaderboardData = MOCK_LEADERBOARD.map((player, index) => ({
      ...player,
      rank: index + 1,
      isCurrentPlayer: web3Data?.account?.toLowerCase() === player.address.toLowerCase()
    }));

    setLeaderboard(leaderboardData);
    setUsingMockData(true);
    
    // Set player rank if connected
    const userRank = leaderboardData.find(p => p.isCurrentPlayer)?.rank;
    if (userRank) {
      setPlayerRank(userRank);
    }
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2 className="cyber-title">LEADERBOARD</h2>
        
        {usingMockData && (
          <div className="mock-data-notice">
            <span>📝 Displaying demo data (contracts not deployed)</span>
          </div>
        )}
        
        <div className="timeframe-tabs">
          <button 
            className={timeframe === 'day' ? 'active' : ''}
            onClick={() => setTimeframe('day')}
          >
            24H
          </button>
          <button 
            className={timeframe === 'week' ? 'active' : ''}
            onClick={() => setTimeframe('week')}
          >
            7D
          </button>
          <button 
            className={timeframe === 'all' ? 'active' : ''}
            onClick={() => setTimeframe('all')}
          >
            ALL TIME
          </button>
        </div>
      </div>

      {web3Data?.account && playerRank && (
        <div className="player-rank-banner">
          <span>Your Rank: #{playerRank}</span>
          <button onClick={fetchLeaderboard} className="refresh-btn">↻</button>
        </div>
      )}

      <div className="leaderboard-table">
        <div className="table-header">
          <span className="col-rank">RANK</span>
          <span className="col-player">PILOT</span>
          <span className="col-score">HIGH SCORE</span>
          <span className="col-games">GAMES</span>
          <span className="col-earned">EARNED</span>
        </div>

        <div className="table-body">
          {loading ? (
            <div className="loading-state">
              <div className="cyber-spinner"></div>
              <span>Loading blockchain data...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-state">
              <span>No scores recorded yet. Be the first!</span>
            </div>
          ) : (
            leaderboard.map((player) => (
              <div 
                key={player.address}
                className={`table-row ${player.isCurrentPlayer ? 'current-player' : ''} ${getRankStyle(player.rank)}`}
              >
                <span className="col-rank">
                  {player.rank === 1 && '👑'}
                  {player.rank === 2 && '🥈'}
                  {player.rank === 3 && '🥉'}
                  {player.rank > 3 && `#${player.rank}`}
                </span>
                
                <span className="col-player">
                  <span className="player-name">{player.name}</span>
                  <span className="player-address">{formatAddress(player.address)}</span>
                  {player.isCurrentPlayer && <span className="you-badge">YOU</span>}
                </span>
                
                <span className="col-score cyber-text">
                  {player.score.toLocaleString()}
                </span>
                
                <span className="col-games">{player.games}</span>
                
                <span className="col-earned gold">{player.earned} SPACE</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="leaderboard-footer">
        <p>Powered by Shardeum Blockchain</p>
        <a 
          href="https://explorer.shardeum.org" 
          target="_blank" 
          rel="noopener noreferrer"
          className="explorer-link"
        >
          View on Explorer →
        </a>
      </div>
    </div>
  );
}