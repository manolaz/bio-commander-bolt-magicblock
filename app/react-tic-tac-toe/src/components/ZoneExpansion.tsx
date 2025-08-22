import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoneType, Faction, PlayerResources, Zone } from '../types/bioCommander';
import './ZoneExpansion.scss';

export enum ExpansionType {
  InfectionSpread = 0,    // Pathogens spreading to adjacent zones
  ImmuneResponse = 1,     // Immune system establishing staging areas
  CreateNewZone = 2,      // Player-initiated zone creation
  ConquerZone = 3         // Taking control of existing zone
}

interface ExpansionOption {
  type: ExpansionType;
  name: string;
  icon: string;
  description: string;
  allowedFactions: Faction[];
  cost: {
    energy: number;
    antibodies: number;
    stemCells: number;
    nutrients: number;
  };
  requirements: string[];
}

interface ZoneExpansionProps {
  currentZone: Zone;
  adjacentZones: Zone[];
  playerFaction: Faction;
  playerResources: PlayerResources;
  onExpand: (expansionType: ExpansionType, targetZone?: Zone, newZoneType?: ZoneType) => void;
  isVisible: boolean;
  onClose: () => void;
  isPlayerTurn: boolean;
}

const EXPANSION_OPTIONS: ExpansionOption[] = [
  {
    type: ExpansionType.InfectionSpread,
    name: "Infection Spread",
    icon: "🦠",
    description: "Spread infection to adjacent zones, weakening enemy defenses",
    allowedFactions: [Faction.Pathogen],
    cost: { energy: 100, antibodies: 0, stemCells: 0, nutrients: 50 },
    requirements: ["Adjacent zone must exist", "Must be pathogen faction"]
  },
  {
    type: ExpansionType.ImmuneResponse,
    name: "Immune Response",
    icon: "🛡️",
    description: "Establish immune staging area to boost defenses",
    allowedFactions: [Faction.ImmuneSystem],
    cost: { energy: 80, antibodies: 40, stemCells: 10, nutrients: 30 },
    requirements: ["Adjacent zone must exist", "Must be immune system faction"]
  },
  {
    type: ExpansionType.CreateNewZone,
    name: "Create New Zone",
    icon: "🏗️",
    description: "Create a completely new zone to expand the battlefield",
    allowedFactions: [Faction.ImmuneSystem, Faction.Pathogen],
    cost: { energy: 200, antibodies: 50, stemCells: 20, nutrients: 100 },
    requirements: ["Border zone required", "High resource cost"]
  },
  {
    type: ExpansionType.ConquerZone,
    name: "Conquer Zone",
    icon: "⚔️",
    description: "Take control of an enemy-controlled zone through force",
    allowedFactions: [Faction.ImmuneSystem, Faction.Pathogen],
    cost: { energy: 300, antibodies: 100, stemCells: 15, nutrients: 200 },
    requirements: ["Adjacent enemy zone", "Strong military presence"]
  }
];

const ZoneExpansion: React.FC<ZoneExpansionProps> = ({
  currentZone,
  adjacentZones,
  playerFaction,
  playerResources,
  onExpand,
  isVisible,
  onClose,
  isPlayerTurn
}) => {
  const [selectedExpansion, setSelectedExpansion] = useState<ExpansionType | null>(null);
  const [selectedTargetZone, setSelectedTargetZone] = useState<Zone | null>(null);
  const [selectedNewZoneType, setSelectedNewZoneType] = useState<ZoneType>(ZoneType.Tissue);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const getAvailableExpansions = (): ExpansionOption[] => {
    return EXPANSION_OPTIONS.filter(option => 
      option.allowedFactions.includes(playerFaction)
    );
  };

  const canAffordExpansion = (expansion: ExpansionOption): boolean => {
    return playerResources.energy >= expansion.cost.energy &&
           playerResources.antibodies >= expansion.cost.antibodies &&
           playerResources.stemCells >= expansion.cost.stemCells &&
           playerResources.nutrients >= expansion.cost.nutrients;
  };

  const getValidTargetZones = (expansionType: ExpansionType): Zone[] => {
    switch (expansionType) {
      case ExpansionType.InfectionSpread:
        return adjacentZones.filter(zone => 
          zone.owner !== playerFaction.toString() // Not owned by player
        );
      case ExpansionType.ImmuneResponse:
        return adjacentZones.filter(zone => 
          zone.owner === "neutral" || zone.owner !== playerFaction.toString()
        );
      case ExpansionType.ConquerZone:
        return adjacentZones.filter(zone => 
          zone.owner !== playerFaction.toString() && zone.owner !== "neutral"
        );
      default:
        return adjacentZones;
    }
  };

  const handleExpansionSelect = (expansion: ExpansionOption) => {
    setSelectedExpansion(expansion.type);
    setSelectedTargetZone(null);
    
    if (expansion.type === ExpansionType.CreateNewZone) {
      // For new zone creation, no target needed
      setShowConfirmation(true);
    }
  };

  const handleTargetZoneSelect = (zone: Zone) => {
    setSelectedTargetZone(zone);
    setShowConfirmation(true);
  };

  const handleConfirmExpansion = () => {
    if (selectedExpansion === null) return;
    
    if (selectedExpansion === ExpansionType.CreateNewZone) {
      onExpand(selectedExpansion, undefined, selectedNewZoneType);
    } else {
      onExpand(selectedExpansion, selectedTargetZone || undefined);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setSelectedExpansion(null);
    setSelectedTargetZone(null);
    setShowConfirmation(false);
    onClose();
  };

  const getZoneTypeInfo = (zoneType: ZoneType) => {
    const info = {
      [ZoneType.Circulatory]: { icon: "🩸", name: "Circulatory", bonus: "Fast movement" },
      [ZoneType.Tissue]: { icon: "🔬", name: "Tissue", bonus: "Balanced stats" },
      [ZoneType.Lymphatic]: { icon: "💊", name: "Lymphatic", bonus: "High antibody production" },
      [ZoneType.Barrier]: { icon: "🛡️", name: "Barrier", bonus: "Strong defense" },
      [ZoneType.Organ]: { icon: "❤️", name: "Organ", bonus: "Special abilities" }
    };
    return info[zoneType];
  };

  const getExpansionPreview = (): string => {
    if (!selectedExpansion) return "";
    
    const expansion = EXPANSION_OPTIONS.find(e => e.type === selectedExpansion);
    if (!expansion) return "";

    switch (selectedExpansion) {
      case ExpansionType.InfectionSpread:
        return selectedTargetZone 
          ? `Spread infection to Zone ${selectedTargetZone.zoneId}, reducing its defenses by 50%`
          : "Select a target zone to infect";
      case ExpansionType.ImmuneResponse:
        return selectedTargetZone
          ? `Establish immune staging area in Zone ${selectedTargetZone.zoneId}, boosting antibody production`
          : "Select a zone to establish immune presence";
      case ExpansionType.CreateNewZone:
        return `Create new ${selectedNewZoneType} zone adjacent to current position`;
      case ExpansionType.ConquerZone:
        return selectedTargetZone
          ? `Launch assault on Zone ${selectedTargetZone.zoneId} to take control`
          : "Select an enemy zone to conquer";
      default:
        return "";
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="zone-expansion-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`zone-expansion ${!isPlayerTurn ? 'disabled' : ''}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="expansion-header">
          <h2>🌍 Zone Expansion</h2>
          <p>Expand your influence across the biological battlefield</p>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        <div className="current-zone-info">
          <h3>Current Zone: {currentZone.zoneId} ({currentZone.zoneType})</h3>
          <div className="zone-stats">
            <span>Position: ({currentZone.x}, {currentZone.y})</span>
            <span>Units: {currentZone.unitCount}</span>
            <span>Border Zone: {currentZone.isBorderZone ? "Yes" : "No"}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedExpansion && (
            <motion.div
              key="expansion-selection"
              className="expansion-options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3>Choose Expansion Type</h3>
              <div className="options-grid">
                {getAvailableExpansions().map((expansion) => {
                  const canAfford = canAffordExpansion(expansion);
                  
                  return (
                    <motion.div
                      key={expansion.type}
                      className={`expansion-option ${!canAfford ? 'unaffordable' : ''} ${!isPlayerTurn ? 'disabled' : ''}`}
                      onClick={() => canAfford && isPlayerTurn && handleExpansionSelect(expansion)}
                      whileHover={canAfford && isPlayerTurn ? { scale: 1.02 } : {}}
                      whileTap={canAfford && isPlayerTurn ? { scale: 0.98 } : {}}
                    >
                      <div className="option-header">
                        <span className="option-icon">{expansion.icon}</span>
                        <h4>{expansion.name}</h4>
                      </div>
                      
                      <p className="option-description">{expansion.description}</p>
                      
                      <div className="option-cost">
                        <span className="cost-label">Cost:</span>
                        <div className="cost-items">
                          {expansion.cost.energy > 0 && <span>⚡{expansion.cost.energy}</span>}
                          {expansion.cost.antibodies > 0 && <span>💊{expansion.cost.antibodies}</span>}
                          {expansion.cost.stemCells > 0 && <span>🧬{expansion.cost.stemCells}</span>}
                          {expansion.cost.nutrients > 0 && <span>🍎{expansion.cost.nutrients}</span>}
                        </div>
                      </div>
                      
                      <div className="option-requirements">
                        {expansion.requirements.map((req, index) => (
                          <span key={index} className="requirement">• {req}</span>
                        ))}
                      </div>
                      
                      {!canAfford && (
                        <div className="insufficient-resources">
                          Insufficient Resources
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {selectedExpansion !== null && !showConfirmation && (
            <motion.div
              key="target-selection"
              className="target-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="selection-header">
                <button 
                  className="back-button"
                  onClick={() => setSelectedExpansion(null)}
                >
                  ← Back
                </button>
                <h3>
                  {EXPANSION_OPTIONS.find(e => e.type === selectedExpansion)?.name}
                </h3>
              </div>

              {selectedExpansion === ExpansionType.CreateNewZone ? (
                <div className="new-zone-selection">
                  <h4>Select New Zone Type:</h4>
                  <div className="zone-type-options">
                    {Object.values(ZoneType).map((zoneType) => {
                      const zoneInfo = getZoneTypeInfo(zoneType);
                      return (
                        <button
                          key={zoneType}
                          className={`zone-type-option ${selectedNewZoneType === zoneType ? 'selected' : ''}`}
                          onClick={() => setSelectedNewZoneType(zoneType)}
                        >
                          <span className="zone-icon">{zoneInfo.icon}</span>
                          <span className="zone-name">{zoneInfo.name}</span>
                          <span className="zone-bonus">{zoneInfo.bonus}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    className="proceed-button"
                    onClick={() => setShowConfirmation(true)}
                  >
                    Create {getZoneTypeInfo(selectedNewZoneType).name} Zone
                  </button>
                </div>
              ) : (
                <div className="zone-target-selection">
                  <h4>Select Target Zone:</h4>
                  <div className="target-zones">
                    {getValidTargetZones(selectedExpansion).map((zone) => (
                      <motion.div
                        key={zone.zoneId}
                        className={`target-zone ${selectedTargetZone?.zoneId === zone.zoneId ? 'selected' : ''}`}
                        onClick={() => handleTargetZoneSelect(zone)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="zone-header">
                          <span>Zone {zone.zoneId}</span>
                          <span className="zone-type">{getZoneTypeInfo(zone.zoneType).icon} {zone.zoneType}</span>
                        </div>
                        <div className="zone-details">
                          <span>Position: ({zone.x}, {zone.y})</span>
                          <span>Owner: {zone.owner === "neutral" ? "Neutral" : `Player ${zone.owner}`}</span>
                          <span>Units: {zone.unitCount}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {getValidTargetZones(selectedExpansion).length === 0 && (
                    <div className="no-valid-targets">
                      <p>No valid target zones for this expansion type.</p>
                      <p>Try a different expansion strategy.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {showConfirmation && (
            <motion.div
              key="confirmation"
              className="expansion-confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>Confirm Expansion</h3>
              
              <div className="expansion-preview">
                <div className="preview-icon">
                  {EXPANSION_OPTIONS.find(e => e.type === selectedExpansion)?.icon}
                </div>
                <div className="preview-text">
                  {getExpansionPreview()}
                </div>
              </div>

              <div className="cost-summary">
                <h4>Resource Cost:</h4>
                <div className="cost-breakdown">
                  {EXPANSION_OPTIONS.find(e => e.type === selectedExpansion)?.cost && (
                    <>
                      <span>⚡ {EXPANSION_OPTIONS.find(e => e.type === selectedExpansion)!.cost.energy}</span>
                      <span>💊 {EXPANSION_OPTIONS.find(e => e.type === selectedExpansion)!.cost.antibodies}</span>
                      <span>🧬 {EXPANSION_OPTIONS.find(e => e.type === selectedExpansion)!.cost.stemCells}</span>
                      <span>🍎 {EXPANSION_OPTIONS.find(e => e.type === selectedExpansion)!.cost.nutrients}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="confirmation-buttons">
                <button
                  className="cancel-button"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  onClick={handleConfirmExpansion}
                  disabled={!isPlayerTurn}
                >
                  Execute Expansion
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isPlayerTurn && (
          <div className="turn-warning">
            ⏳ Wait for your turn to expand zones
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ZoneExpansion;
