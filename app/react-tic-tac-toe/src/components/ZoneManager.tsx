import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicKey } from '@solana/web3.js';
import { Zone, ZoneType, Faction, PlayerResources } from '../types/bioCommander';
import { BioCommanderSolanaService } from '../services/solanaService';
import './ZoneManager.scss';

interface ZoneManagerProps {
  solanaService: BioCommanderSolanaService;
  gameId: PublicKey;
  playerFaction: Faction;
  playerResources: PlayerResources;
  onZoneUpdate: (zones: Zone[]) => void;
  onResourcesUpdate: (resources: PlayerResources) => void;
}

interface ZoneCreationForm {
  zoneType: ZoneType;
  x: number;
  y: number;
  expansionType: 'CreateNewZone' | 'InfectionSpread' | 'ImmuneResponse' | 'ConquerZone';
}

export const ZoneManager: React.FC<ZoneManagerProps> = ({
  solanaService,
  gameId,
  playerFaction,
  playerResources,
  onZoneUpdate,
  onResourcesUpdate
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [creationForm, setCreationForm] = useState<ZoneCreationForm>({
    zoneType: ZoneType.Tissue,
    x: 0,
    y: 0,
    expansionType: 'CreateNewZone'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial zones
  useEffect(() => {
    loadZones();
  }, [gameId]);

  const loadZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const gameState = await solanaService.fetchGameState(gameId);
      if (gameState.zone) {
        // Convert single zone to array format for consistency
        setZones([gameState.zone]);
        onZoneUpdate([gameState.zone]);
      }
    } catch (err) {
      console.error('Failed to load zones:', err);
      setError('Failed to load zones');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, solanaService, onZoneUpdate]);

  const createZone = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const transaction = await solanaService.expandZone(
        gameId,
        playerFaction,
        creationForm.expansionType,
        creationForm.zoneType
      );

      // Sign and send transaction
      const signature = await solanaService.sendTransaction(transaction);
      console.log('Zone creation transaction:', signature);

      // Wait for confirmation and reload zones
      await solanaService.confirmTransaction(signature);
      await loadZones();

      setShowCreationForm(false);
      setCreationForm({
        zoneType: ZoneType.Tissue,
        x: 0,
        y: 0,
        expansionType: 'CreateNewZone'
      });

    } catch (err) {
      console.error('Failed to create zone:', err);
      setError('Failed to create zone. Please check your resources and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const expandToZone = async (targetZone: Zone, expansionType: 'InfectionSpread' | 'ImmuneResponse' | 'ConquerZone') => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedZone) {
        setError('Please select a source zone first');
        return;
      }

      const transaction = await solanaService.expandZone(
        gameId,
        playerFaction,
        expansionType,
        undefined,
        selectedZone.zoneId,
        targetZone.zoneId
      );

      const signature = await solanaService.sendTransaction(transaction);
      console.log('Zone expansion transaction:', signature);

      await solanaService.confirmTransaction(signature);
      await loadZones();

    } catch (err) {
      console.error('Failed to expand zone:', err);
      setError('Failed to expand zone. Please check your resources and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getZoneCost = (zoneType: ZoneType, expansionType: string): PlayerResources => {
    const baseCosts = {
      [ZoneType.Circulatory]: { energy: 200, antibodies: 100, stemCells: 20, nutrients: 150 },
      [ZoneType.Tissue]: { energy: 150, antibodies: 75, stemCells: 15, nutrients: 100 },
      [ZoneType.Lymphatic]: { energy: 300, antibodies: 150, stemCells: 30, nutrients: 200 },
      [ZoneType.Barrier]: { energy: 400, antibodies: 200, stemCells: 40, nutrients: 300 },
      [ZoneType.Organ]: { energy: 500, antibodies: 250, stemCells: 50, nutrients: 400 }
    };

    const baseCost = baseCosts[zoneType];
    const factionModifier = playerFaction === Faction.Pathogen ? 1.2 : 1.0;

    return {
      energy: Math.floor(baseCost.energy * factionModifier),
      antibodies: Math.floor(baseCost.antibodies * factionModifier),
      stemCells: Math.floor(baseCost.stemCells * factionModifier),
      nutrients: Math.floor(baseCost.nutrients * factionModifier)
    };
  };

  const canAffordZone = (zoneType: ZoneType): boolean => {
    const cost = getZoneCost(zoneType, 'CreateNewZone');
    return (
      playerResources.energy >= cost.energy &&
      playerResources.antibodies >= cost.antibodies &&
      playerResources.stemCells >= cost.stemCells &&
      playerResources.nutrients >= cost.nutrients
    );
  };

  const getZoneIcon = (zoneType: ZoneType): string => {
    const icons = {
      [ZoneType.Circulatory]: '🩸',
      [ZoneType.Tissue]: '🫁',
      [ZoneType.Lymphatic]: '🦠',
      [ZoneType.Barrier]: '🛡️',
      [ZoneType.Organ]: '❤️'
    };
    return icons[zoneType] || '❓';
  };

  const getZoneColor = (zone: Zone): string => {
    if (!zone.isControlled) return '#666';
    if (zone.owner === 'player1') return '#4CAF50';
    return '#F44336';
  };

  return (
    <div className="zone-manager">
      <div className="zone-manager-header">
        <h3>🌍 Zone Management</h3>
        <button 
          className="create-zone-btn"
          onClick={() => setShowCreationForm(true)}
          disabled={isLoading}
        >
          ➕ Create Zone
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="zone-grid">
        {zones.map((zone) => (
          <motion.div
            key={zone.zoneId}
            className={`zone-card ${selectedZone?.zoneId === zone.zoneId ? 'selected' : ''}`}
            style={{ borderColor: getZoneColor(zone) }}
            onClick={() => setSelectedZone(zone)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="zone-header">
              <span className="zone-icon">{getZoneIcon(zone.zoneType)}</span>
              <span className="zone-name">{zone.zoneType}</span>
              <span className="zone-id">#{zone.zoneId}</span>
            </div>
            
            <div className="zone-position">
              ({zone.x}, {zone.y})
            </div>

            <div className="zone-status">
              <span className={`status ${zone.isControlled ? 'controlled' : 'uncontrolled'}`}>
                {zone.isControlled ? 'Controlled' : 'Uncontrolled'}
              </span>
              {zone.isBorderZone && <span className="border-zone">Border</span>}
            </div>

            <div className="zone-resources">
              <div className="resource">
                <span>⚡</span> {zone.resources.energy}
              </div>
              <div className="resource">
                <span>💊</span> {zone.resources.antibodies}
              </div>
              <div className="resource">
                <span>🧬</span> {zone.resources.stemCells}
              </div>
              <div className="resource">
                <span>🍎</span> {zone.resources.nutrients}
              </div>
            </div>

            <div className="zone-units">
              Units: {zone.unitCount}
            </div>

            {zone.connectedZones.length > 0 && (
              <div className="connected-zones">
                Connected: {zone.connectedZones.filter(z => z !== null).length}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {selectedZone && (
        <div className="zone-actions">
          <h4>Zone Actions - {selectedZone.zoneType}</h4>
          <div className="action-buttons">
            {playerFaction === Faction.Pathogen && (
              <button 
                onClick={() => expandToZone(selectedZone, 'InfectionSpread')}
                disabled={isLoading}
                className="action-btn infection"
              >
                🦠 Spread Infection
              </button>
            )}
            
            {playerFaction === Faction.ImmuneSystem && (
              <button 
                onClick={() => expandToZone(selectedZone, 'ImmuneResponse')}
                disabled={isLoading}
                className="action-btn immune"
              >
                🛡️ Establish Defense
              </button>
            )}
            
            <button 
              onClick={() => expandToZone(selectedZone, 'ConquerZone')}
              disabled={isLoading}
              className="action-btn conquer"
            >
              ⚔️ Conquer Zone
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreationForm && (
          <motion.div 
            className="zone-creation-modal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="modal-content">
              <h3>Create New Zone</h3>
              
              <div className="form-group">
                <label>Zone Type:</label>
                <select 
                  value={creationForm.zoneType}
                  onChange={(e) => setCreationForm({
                    ...creationForm,
                    zoneType: e.target.value as ZoneType
                  })}
                >
                  {Object.values(ZoneType).map(type => (
                    <option key={type} value={type}>
                      {getZoneIcon(type)} {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>X Coordinate:</label>
                <input 
                  type="number" 
                  value={creationForm.x}
                  onChange={(e) => setCreationForm({
                    ...creationForm,
                    x: parseInt(e.target.value) || 0
                  })}
                  min="0"
                  max="7"
                />
              </div>

              <div className="form-group">
                <label>Y Coordinate:</label>
                <input 
                  type="number" 
                  value={creationForm.y}
                  onChange={(e) => setCreationForm({
                    ...creationForm,
                    y: parseInt(e.target.value) || 0
                  })}
                  min="0"
                  max="7"
                />
              </div>

              <div className="zone-cost">
                <h4>Cost:</h4>
                {(() => {
                  const cost = getZoneCost(creationForm.zoneType, 'CreateNewZone');
                  const canAfford = canAffordZone(creationForm.zoneType);
                  return (
                    <div className={`cost-breakdown ${canAfford ? 'affordable' : 'unaffordable'}`}>
                      <div>⚡ {cost.energy}</div>
                      <div>💊 {cost.antibodies}</div>
                      <div>🧬 {cost.stemCells}</div>
                      <div>🍎 {cost.nutrients}</div>
                    </div>
                  );
                })()}
              </div>

              <div className="modal-actions">
                <button 
                  onClick={createZone}
                  disabled={isLoading || !canAffordZone(creationForm.zoneType)}
                  className="create-btn"
                >
                  {isLoading ? 'Creating...' : 'Create Zone'}
                </button>
                <button 
                  onClick={() => setShowCreationForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
