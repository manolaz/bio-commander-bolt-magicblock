import React from 'react';
import "./UnitPanel.scss";
import { motion } from "framer-motion";
import { UnitType, UNIT_DATA, Faction, PlayerResources, SpecialAbility } from '../types/bioCommander';

type UnitPanelProps = {
    selectedUnit: UnitType | null;
    onUnitSelect: (unitType: UnitType) => void;
    playerResources: PlayerResources;
    currentPlayer: string;
    playerFaction: Faction;
    unlockedUnits: boolean[];
};

const UnitPanel: React.FC<UnitPanelProps> = ({ 
    selectedUnit, 
    onUnitSelect, 
    playerResources,
    currentPlayer,
    playerFaction,
    unlockedUnits
}) => {
    const canAfford = (unitType: UnitType): boolean => {
        const unit = UNIT_DATA[unitType];
        if (unit.cost.energy > playerResources.energy) return false;
        if (unit.cost.antibodies > playerResources.antibodies) return false;
        if (unit.cost.stemCells > playerResources.stemCells) return false;
        if (unit.cost.nutrients > playerResources.nutrients) return false;
        return true;
    };

    const getUnitAvailability = (unitType: UnitType): string => {
        const unit = UNIT_DATA[unitType];
        const unitIndex = Object.values(UnitType).indexOf(unitType);
        
        // Check if unit is unlocked
        if (!unlockedUnits[unitIndex]) {
            return "locked";
        }
        
        // Check faction restrictions
        if (playerFaction !== unit.faction) {
            return "wrong-faction";
        }
        
        return "available";
    };

    const getAvailableUnits = (): UnitType[] => {
        return Object.values(UnitType).filter(unitType => {
            const unit = UNIT_DATA[unitType];
            return unit.faction === playerFaction;
        });
    };

    return (
        <div className="unit-panel">
            <div className="panel-header">
                <h3>Unit Selection</h3>
                <div className="player-resources">
                    <span className="resource">⚡ {playerResources.energy}</span>
                    <span className="resource">💊 {playerResources.antibodies}</span>
                    <span className="resource">🧬 {playerResources.stemCells}</span>
                    <span className="resource">🍎 {playerResources.nutrients}</span>
                </div>
                <div className="faction-indicator">
                    {playerFaction === Faction.ImmuneSystem ? "🛡️ Immune System" : "🦠 Pathogen"}
                </div>
            </div>
            
            <div className="unit-grid">
                {getAvailableUnits().map((unitType) => {
                    const unit = UNIT_DATA[unitType];
                    const isSelected = selectedUnit === unitType;
                    const affordable = canAfford(unitType);
                    const availability = getUnitAvailability(unitType);
                    const isClickable = affordable && availability === "available";
                    
                    return (
                        <motion.div
                            key={unitType}
                            className={`unit-card ${isSelected ? 'selected' : ''} ${!affordable ? 'unaffordable' : ''} ${availability}`}
                            onClick={() => isClickable && onUnitSelect(unitType)}
                            whileHover={isClickable ? { scale: 1.05 } : {}}
                            whileTap={isClickable ? { scale: 0.95 } : {}}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Object.values(UnitType).indexOf(unitType) * 0.05 }}
                        >
                            <div className="unit-icon">{unit.icon}</div>
                            <div className="unit-info">
                                <h4>{unit.name}</h4>
                                <p className="unit-description">{unit.description}</p>
                                
                                <div className="unit-stats">
                                    <div className="stat">❤️ {unit.stats.health}</div>
                                    <div className="stat">⚔️ {unit.stats.attack}</div>
                                    <div className="stat">🛡️ {unit.stats.defense}</div>
                                    <div className="stat">👟 {unit.stats.movementRange}</div>
                                </div>
                                
                                <div className="special-abilities">
                                    {unit.specialAbilities.map((ability, index) => (
                                        <span key={index} className="ability" title={ability}>
                                            {getAbilityIcon(ability)}
                                        </span>
                                    ))}
                                </div>
                                
                                <div className="unit-cost">
                                    <span>⚡{unit.cost.energy}</span>
                                    {unit.cost.antibodies > 0 && <span>💊{unit.cost.antibodies}</span>}
                                    {unit.cost.stemCells > 0 && <span>🧬{unit.cost.stemCells}</span>}
                                    {unit.cost.nutrients > 0 && <span>🍎{unit.cost.nutrients}</span>}
                                </div>
                            </div>
                            
                            {!affordable && (
                                <div className="insufficient-resources">
                                    Insufficient Resources
                                </div>
                            )}
                            
                            {availability === "locked" && (
                                <div className="locked-unit">
                                    🔒 Locked
                                </div>
                            )}
                            
                            {availability === "wrong-faction" && (
                                <div className="unavailable-unit">
                                    Wrong Faction
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
            
            <div className="selection-info">
                {selectedUnit && (
                    <motion.div 
                        className="selected-unit-info"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p>Selected: <strong>{UNIT_DATA[selectedUnit]?.name}</strong></p>
                        <p>Click on an empty cell to place this unit</p>
                        <div className="selected-abilities">
                            Special Abilities:
                            {UNIT_DATA[selectedUnit]?.specialAbilities.map((ability, index) => (
                                <span key={index} className="ability-name">{ability}</span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const getAbilityIcon = (ability: SpecialAbility): string => {
    switch (ability) {
        case SpecialAbility.AntibodyProduction: return "💊";
        case SpecialAbility.Phagocytosis: return "🍽️";
        case SpecialAbility.CytokineRelease: return "📡";
        case SpecialAbility.MemoryResponse: return "🧠";
        case SpecialAbility.Infiltration: return "🥷";
        case SpecialAbility.ZoneHealing: return "💚";
        case SpecialAbility.Replication: return "🔄";
        case SpecialAbility.Mutation: return "🧬";
        case SpecialAbility.ToxinRelease: return "☠️";
        case SpecialAbility.ImmuneEvasion: return "👻";
        case SpecialAbility.Metastasis: return "🌊";
        case SpecialAbility.ResourceDrain: return "🩸";
        default: return "✨";
    }
};

export default UnitPanel;
