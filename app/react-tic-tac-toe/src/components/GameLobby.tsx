import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Faction } from '../types/bioCommander';
import { BioCommanderSolanaService } from '../services/solanaService';
import './GameLobby.scss';

interface GameInfo {
  gameId: string;
  player1: string | null;
  player2: string | null;
  gameState: 'WaitingForPlayers' | 'Active' | 'Finished';
  createdAt: Date;
  faction1?: Faction;
  faction2?: Faction;
}

interface GameLobbyProps {
  solanaService: BioCommanderSolanaService;
  onGameJoined: (gameId: string, faction: Faction) => void;
  onGameCreated: (gameId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  solanaService,
  onGameJoined,
  onGameCreated,
  isVisible,
  onClose
}) => {
  const { publicKey } = useWallet();
  const [activeGames, setActiveGames] = useState<GameInfo[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [gameIdInput, setGameIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'join'>('browse');

  // Mock data for demonstration - in real implementation, this would come from a game discovery service
  useEffect(() => {
    if (isVisible) {
      // Simulate fetching active games
      const mockGames: GameInfo[] = [
        {
          gameId: 'game_001',
          player1: '7TsTc97MB21EKbh2RetcWsGWRJ4xuMkPKKD4DcMJ2Sms',
          player2: null,
          gameState: 'WaitingForPlayers',
          createdAt: new Date(Date.now() - 300000),
          faction1: Faction.ImmuneSystem
        },
        {
          gameId: 'game_002',
          player1: 'EFLfG5icLgcUYwuSnuScoYptcrgh8WYLHx33M4wvTPFv',
          player2: null,
          gameState: 'WaitingForPlayers',
          createdAt: new Date(Date.now() - 120000),
          faction1: Faction.Pathogen
        },
        {
          gameId: 'game_003',
          player1: '9EoKMqQqrgRAxVED34q17e466RKme5sTUkuCqUGH4bij',
          player2: 'HLzXXTbMUjemRSQr5LHjtZgBvqyieuhY8wE29xYzhZSX',
          gameState: 'Active',
          createdAt: new Date(Date.now() - 600000),
          faction1: Faction.ImmuneSystem,
          faction2: Faction.Pathogen
        }
      ];
      setActiveGames(mockGames);
    }
  }, [isVisible]);

  const handleCreateGame = async () => {
    if (!publicKey || !selectedFaction) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { gameId } = await solanaService.createNewGame(publicKey);
      onGameCreated(gameId.toBase58());
      setIsCreatingGame(false);
      onClose();
    } catch (err) {
      setError(`Failed to create game: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string, faction: Faction) => {
    if (!publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await solanaService.joinGame(publicKey, new PublicKey(gameId), faction);
      onGameJoined(gameId, faction);
      onClose();
    } catch (err) {
      setError(`Failed to join game: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByGameId = async () => {
    if (!publicKey || !gameIdInput || !selectedFaction) return;
    
    try {
      await handleJoinGame(gameIdInput, selectedFaction);
    } catch (err) {
      setError(`Invalid game ID or failed to join: ${err}`);
    }
  };

  const getTimeSince = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getFactionIcon = (faction: Faction): string => {
    return faction === Faction.ImmuneSystem ? '🛡️' : '🦠';
  };

  const getOpposingFaction = (faction: Faction): Faction => {
    return faction === Faction.ImmuneSystem ? Faction.Pathogen : Faction.ImmuneSystem;
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="game-lobby-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="game-lobby"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="lobby-header">
          <h2>🧬 Bio Commander Lobby</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="lobby-tabs">
          <button
            className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            🔍 Browse Games
          </button>
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Game
          </button>
          <button
            className={`tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            🔗 Join by ID
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              className="tab-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="games-list">
                <h3>Available Games ({activeGames.filter(g => g.gameState === 'WaitingForPlayers').length})</h3>
                
                {activeGames.filter(game => game.gameState === 'WaitingForPlayers').length === 0 ? (
                  <div className="no-games">
                    <p>🎮 No games waiting for players</p>
                    <p>Create a new game to start playing!</p>
                  </div>
                ) : (
                  <div className="games-grid">
                    {activeGames
                      .filter(game => game.gameState === 'WaitingForPlayers')
                      .map((game) => (
                        <motion.div
                          key={game.gameId}
                          className="game-card"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="game-info">
                            <div className="game-id">Game: {game.gameId}</div>
                            <div className="game-time">Created {getTimeSince(game.createdAt)}</div>
                            <div className="players-info">
                              <div className="player">
                                Player 1: {getFactionIcon(game.faction1!)} {game.faction1}
                              </div>
                              <div className="waiting">
                                Waiting for: {getFactionIcon(getOpposingFaction(game.faction1!))} {getOpposingFaction(game.faction1!)}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            className="join-button"
                            onClick={() => handleJoinGame(game.gameId, getOpposingFaction(game.faction1!))}
                            disabled={loading}
                          >
                            Join as {getOpposingFaction(game.faction1!)}
                          </button>
                        </motion.div>
                      ))}
                  </div>
                )}

                <div className="active-games-section">
                  <h3>Active Games ({activeGames.filter(g => g.gameState === 'Active').length})</h3>
                  <div className="active-games-list">
                    {activeGames
                      .filter(game => game.gameState === 'Active')
                      .map((game) => (
                        <div key={game.gameId} className="active-game">
                          <span>{game.gameId}</span>
                          <span>{getFactionIcon(game.faction1!)} vs {getFactionIcon(game.faction2!)}</span>
                          <span className="status">🔥 In Progress</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              className="tab-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="create-game">
                <h3>Create New Game</h3>
                <p>Choose your faction and create a new Bio Commander battle!</p>

                <div className="faction-selection">
                  <h4>Select Your Faction:</h4>
                  <div className="faction-options">
                    <button
                      className={`faction-option ${selectedFaction === Faction.ImmuneSystem ? 'selected' : ''}`}
                      onClick={() => setSelectedFaction(Faction.ImmuneSystem)}
                    >
                      <div className="faction-icon">🛡️</div>
                      <div className="faction-name">Immune System</div>
                      <div className="faction-desc">Defend and coordinate</div>
                    </button>
                    
                    <button
                      className={`faction-option ${selectedFaction === Faction.Pathogen ? 'selected' : ''}`}
                      onClick={() => setSelectedFaction(Faction.Pathogen)}
                    >
                      <div className="faction-icon">🦠</div>
                      <div className="faction-name">Pathogen</div>
                      <div className="faction-desc">Infect and spread</div>
                    </button>
                  </div>
                </div>

                <button
                  className="create-button"
                  onClick={handleCreateGame}
                  disabled={!selectedFaction || loading}
                >
                  {loading ? '🔄 Creating...' : '🎮 Create Game'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'join' && (
            <motion.div
              key="join"
              className="tab-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="join-game">
                <h3>Join Game by ID</h3>
                <p>Enter a specific game ID to join a friend's game</p>

                <div className="join-form">
                  <div className="input-group">
                    <label>Game ID:</label>
                    <input
                      type="text"
                      value={gameIdInput}
                      onChange={(e) => setGameIdInput(e.target.value)}
                      placeholder="Enter game ID..."
                      className="game-id-input"
                    />
                  </div>

                  <div className="faction-selection">
                    <label>Your Faction:</label>
                    <div className="faction-buttons">
                      <button
                        className={`faction-btn ${selectedFaction === Faction.ImmuneSystem ? 'selected' : ''}`}
                        onClick={() => setSelectedFaction(Faction.ImmuneSystem)}
                      >
                        🛡️ Immune System
                      </button>
                      <button
                        className={`faction-btn ${selectedFaction === Faction.Pathogen ? 'selected' : ''}`}
                        onClick={() => setSelectedFaction(Faction.Pathogen)}
                      >
                        🦠 Pathogen
                      </button>
                    </div>
                  </div>

                  <button
                    className="join-button"
                    onClick={handleJoinByGameId}
                    disabled={!gameIdInput || !selectedFaction || loading}
                  >
                    {loading ? '🔄 Joining...' : '🔗 Join Game'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⚠️ {error}
            <button onClick={() => setError(null)}>✕</button>
          </motion.div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner">🧬</div>
            <p>Processing...</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GameLobby;
