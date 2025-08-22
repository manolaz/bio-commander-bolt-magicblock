import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { Provider } from "@coral-xyz/anchor";
import { SimpleProvider } from "./components/Wallet";
import Alert from "./components/Alert";

// Enhanced Bio Commander Components
import FactionSelector from "./components/FactionSelector";
import GameLobby from "./components/GameLobby";
import UnitPanel from "./components/UnitPanel";
import BioGrid from "./components/BioGrid";
import ActionPanel from "./components/ActionPanel";
import ZoneMinimap from "./components/ZoneMinimap";
import ZoneExpansion, { ExpansionType } from "./components/ZoneExpansion";
import ResourceManager from "./components/ResourceManager";
import { ZoneManager } from "./components/ZoneManager";
import { ZoneGrid } from "./components/ZoneGrid";

// Types and Services
import {
  UnitType,
  ZoneType,
  Faction,
  ActionType,
  Zone,
  Player,
  Game,
  PlayerResources,
  UNIT_DATA
} from "./types/bioCommander";
import { BioCommanderSolanaService } from "./services/solanaService";

// Enhanced App Component with full Bio Commander integration
const EnhancedBioCommanderApp: React.FC = () => {
  let { connection } = useConnection();
  const provider = useRef<Provider>(new SimpleProvider(connection));
  const { publicKey, sendTransaction } = useWallet();
  
  // Solana Service
  const [solanaService, setSolanaService] = useState<BioCommanderSolanaService | null>(null);
  
  // Game State
  const [gameState, setGameState] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number>(0);
  
  // UI State
  const [gamePhase, setGamePhase] = useState<'lobby' | 'faction' | 'playing' | 'finished'>('lobby');
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  
  // Modal States
  const [showFactionSelector, setShowFactionSelector] = useState<boolean>(false);
  const [showGameLobby, setShowGameLobby] = useState<boolean>(true);
  const [showZoneExpansion, setShowZoneExpansion] = useState<boolean>(false);
  const [showResourceManager, setShowResourceManager] = useState<boolean>(false);
  
  // Transaction State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState<string | null>(null);
  
  // Initialize Solana Service
  useEffect(() => {
    if (connection && provider.current) {
      const service = new BioCommanderSolanaService(connection, provider.current);
      service.initialize().then(() => {
        setSolanaService(service);
      }).catch(console.error);
    }
  }, [connection]);

  // Game Handlers
  const handleFactionSelect = useCallback((faction: Faction) => {
    setSelectedFaction(faction);
  }, []);

  const handleFactionConfirm = useCallback(() => {
    setShowFactionSelector(false);
    setGamePhase('playing');
    // Initialize game with selected faction
    // In a real implementation, this would create/join a game
  }, []);

  const handleGameCreated = useCallback((gameId: string) => {
    console.log("Game created:", gameId);
    setShowFactionSelector(true);
    setShowGameLobby(false);
  }, []);

  const handleGameJoined = useCallback((gameId: string, faction: Faction) => {
    console.log("Game joined:", gameId, faction);
    setSelectedFaction(faction);
    setGamePhase('playing');
    setShowGameLobby(false);
  }, []);

  // Zone management handlers
  const handleZoneUpdate = useCallback((updatedZones: Zone[]) => {
    setZones(updatedZones);
    if (updatedZones.length > 0) {
      setCurrentZone(updatedZones[0]);
    }
  }, []);

  const handleResourcesUpdate = useCallback((resources: PlayerResources) => {
    if (currentPlayer) {
      setCurrentPlayer({ ...currentPlayer, resources });
    }
    setPlayerResources(resources);
  }, [currentPlayer]);

  const handleUnitSelect = useCallback((unitType: UnitType) => {
    setSelectedUnit(unitType);
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  const handleAction = useCallback(async (action: ActionType, params?: any) => {
    if (!solanaService || !publicKey || !gameState) return;
    
    setIsSubmitting(true);
    setTransactionError(null);
    
    try {
      const playAction = {
        action,
        x: params?.x || 0,
        y: params?.y || 0,
        unitType: params?.unitType || 0,
        abilityIndex: params?.abilityIndex || 0
      };
      
      const transaction = await solanaService.playAction(
        publicKey,
        new PublicKey(gameState.gameId.toString()),
        playAction
      );
      
      const signature = await sendTransaction(transaction, connection);
      console.log("Action executed:", signature);
      setTransactionSuccess("Action executed successfully!");
      
      // Switch turns after action
      setIsMyTurn(false);
      
    } catch (error) {
      setTransactionError(`Action failed: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [solanaService, publicKey, gameState, sendTransaction, connection]);

  const handleZoneExpansion = useCallback(async (
    expansionType: ExpansionType,
    targetZone?: Zone,
    newZoneType?: ZoneType
  ) => {
    if (!solanaService || !publicKey || !gameState) return;
    
    setIsSubmitting(true);
    try {
      const transaction = await solanaService.expandZone(
        publicKey,
        new PublicKey(gameState.gameId.toString()),
        expansionType,
        newZoneType
      );
      
      const signature = await sendTransaction(transaction, connection);
      console.log("Zone expansion executed:", signature);
      setTransactionSuccess("Zone expansion successful!");
      setShowZoneExpansion(false);
      
    } catch (error) {
      setTransactionError(`Zone expansion failed: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [solanaService, publicKey, gameState, sendTransaction, connection]);

  const handleZoneSwitch = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedZoneIndex(prev => prev > 0 ? prev - 1 : zones.length - 1);
    } else {
      setSelectedZoneIndex(prev => prev < zones.length - 1 ? prev + 1 : 0);
    }
  }, [zones.length]);

  const handleZoneSelect = useCallback((index: number) => {
    setSelectedZoneIndex(index);
  }, []);

  // Initialize with empty zones - will be populated by real data
  const [playerResources, setPlayerResources] = useState<PlayerResources>({
    energy: 0,
    antibodies: 0,
    stemCells: 0,
    nutrients: 0
  });

  const mockUnlockedUnits = Array(12).fill(false);
  mockUnlockedUnits[0] = true; // T-Cell
  mockUnlockedUnits[1] = true; // B-Cell
  mockUnlockedUnits[2] = true; // Macrophage

  // Get available actions based on game state
  const getAvailableActions = (): ActionType[] => {
    return [
      ActionType.SpawnUnit,
      ActionType.MoveUnit,
      ActionType.AttackPosition,
      ActionType.UseSpecialAbility,
      ActionType.EndTurn
    ];
  };

  return (
    <div className="bio-commander-app">
      {/* Wallet Connection */}
      <div className="wallet-buttons">
        <WalletMultiButton />
      </div>

      {/* Game Header */}
      <motion.div
        className="game-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>🧬 BIO COMMANDER: Corpus Humanus 🦠</h1>
        <p>Command your forces in the ultimate biological warfare</p>
      </motion.div>

      {/* Game Phase: Lobby */}
      <AnimatePresence>
        {gamePhase === 'lobby' && (
          <GameLobby
            solanaService={solanaService!}
            onGameJoined={handleGameJoined}
            onGameCreated={handleGameCreated}
            isVisible={showGameLobby}
            onClose={() => setShowGameLobby(false)}
          />
        )}
      </AnimatePresence>

      {/* Game Phase: Faction Selection */}
      <AnimatePresence>
        {gamePhase === 'faction' && (
          <FactionSelector
            selectedFaction={selectedFaction}
            onFactionSelect={handleFactionSelect}
            onConfirm={handleFactionConfirm}
            isVisible={showFactionSelector}
          />
        )}
      </AnimatePresence>

      {/* Game Phase: Playing */}
      {gamePhase === 'playing' && (
        <motion.div
          className="game-interface"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Game Controls */}
          <div className="game-controls">
            <div className="control-buttons">
              <button onClick={() => setShowResourceManager(true)}>
                📊 Resources
              </button>
              <button onClick={() => setShowZoneExpansion(true)}>
                🌍 Expand
              </button>
              <button onClick={() => setGamePhase('lobby')}>
                🏠 Lobby
              </button>
            </div>
            
            <div className="turn-info">
              <span className={`turn-indicator ${isMyTurn ? 'my-turn' : 'opponent-turn'}`}>
                {isMyTurn ? '🟢 Your Turn' : '🔴 Opponent\'s Turn'}
              </span>
              <span className="faction-indicator">
                {selectedFaction === Faction.ImmuneSystem ? '🛡️ Immune System' : '🦠 Pathogen'}
              </span>
            </div>
          </div>

          {/* Zone Grid Visualization */}
          {zones.length > 0 && (
            <ZoneGrid
              zones={zones}
              selectedZone={currentZone}
              onZoneSelect={(zone) => {
                setCurrentZone(zone);
                const zoneIndex = zones.findIndex(z => z.zoneId === zone.zoneId);
                if (zoneIndex !== -1) {
                  setSelectedZoneIndex(zoneIndex);
                }
              }}
              playerFaction={selectedFaction || Faction.ImmuneSystem}
              maxGridSize={8}
            />
          )}

          {/* Real Zone Management */}
          {solanaService && gameState && selectedFaction && (
            <ZoneManager
              solanaService={solanaService}
              gameId={new PublicKey(gameState.gameId.toString())}
              playerFaction={selectedFaction}
              playerResources={currentPlayer?.resources || { energy: 0, antibodies: 0, stemCells: 0, nutrients: 0 }}
              onZoneUpdate={handleZoneUpdate}
              onResourcesUpdate={handleResourcesUpdate}
            />
          )}

          {/* Main Game Area */}
          <div className="main-game-area">
            {/* Left Panel */}
            <div className="left-panel">
              <UnitPanel
                selectedUnit={selectedUnit}
                onUnitSelect={handleUnitSelect}
                playerResources={playerResources}
                currentPlayer="1"
                playerFaction={selectedFaction || Faction.ImmuneSystem}
                unlockedUnits={mockUnlockedUnits}
              />
              
              <ZoneMinimap
                zones={zones}
                selectedZoneIndex={selectedZoneIndex}
                onZoneSelect={handleZoneSelect}
              />
            </div>

            {/* Center - Game Grid */}
            <div className="center-panel">
              {zones[selectedZoneIndex] && (
                <BioGrid
                  zone={zones[selectedZoneIndex]}
                  onCellClick={handleCellClick}
                  selectedUnit={selectedUnit}
                  currentPlayer="1"
                  selectedCell={selectedCell}
                />
              )}
            </div>

            {/* Right Panel */}
            <div className="right-panel">
              <ActionPanel
                currentPlayer="1"
                selectedCell={selectedCell}
                selectedUnit={selectedUnit}
                onAction={handleAction}
                availableActions={getAvailableActions()}
                isMyTurn={isMyTurn}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Zone Expansion Modal */}
      <AnimatePresence>
        {showZoneExpansion && zones[selectedZoneIndex] && (
          <ZoneExpansion
            currentZone={zones[selectedZoneIndex]}
            adjacentZones={zones.filter((_, index) => index !== selectedZoneIndex)}
            playerFaction={selectedFaction || Faction.ImmuneSystem}
            playerResources={playerResources}
            onExpand={handleZoneExpansion}
            isVisible={showZoneExpansion}
            onClose={() => setShowZoneExpansion(false)}
            isPlayerTurn={isMyTurn}
          />
        )}
      </AnimatePresence>

      {/* Resource Manager Modal */}
      <AnimatePresence>
        {showResourceManager && (
          <ResourceManager
            playerResources={playerResources}
            zoneResources={zones.map(z => z.resources)}
            playerFaction={selectedFaction || Faction.ImmuneSystem}
            currentTurn={1}
            isVisible={showResourceManager}
            onClose={() => setShowResourceManager(false)}
          />
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="loading-overlay">
          <div className="spinner">🧬</div>
          <p>Processing transaction...</p>
        </div>
      )}

      {/* Alerts */}
      {transactionError && (
        <Alert 
          type="error" 
          message={transactionError} 
          onClose={() => setTransactionError(null)} 
        />
      )}

      {transactionSuccess && (
        <Alert 
          type="success" 
          message={transactionSuccess} 
          onClose={() => setTransactionSuccess(null)} 
        />
      )}
    </div>
  );
};

export default EnhancedBioCommanderApp;
