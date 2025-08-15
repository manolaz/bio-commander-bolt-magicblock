import React from 'react';
import "./UnitPanel.scss";
import { motion } from "framer-motion";
import { CellType } from './BioGrid';

interface UnitInfo {
    type: CellType;
    name: string;
    icon: string;
    cost: {
        energy: number;
        antibodies?: number;
        nutrients?: number;
    };
    description: string;
    stats: {
        health: number;
        attack?: number;
        defense?: number;
        movement?: number;
    };
}

const UNIT_DATA: UnitInfo[] = [
    {
        type: CellType.ImmuneCell,
        name: "T-Cell",
        icon: "🛡️",
        cost: { energy: 10, nutrients: 5 },
        description: "Primary immune defender, attacks pathogens",
        stats: { health: 100, attack: 25, defense: 15, movement: 2 }
    },
    {
        type: CellType.BloodCell,
        name: "White Blood Cell",
        icon: "🩸",
        cost: { energy: 15, nutrients: 8 },
        description: "Fast-moving immune cell, good for scouting",
        stats: { health: 80, attack: 20, defense: 10, movement: 3 }
    },
    {
        type: CellType.Antibody,
        name: "Antibody",
        icon: "💊",
        cost: { energy: 5, antibodies: 1 },
        description: "Defensive unit that provides area protection",
        stats: { health: 60, attack: 15, defense: 25, movement: 1 }
    },
    {
        type: CellType.Pathogen,
        name: "Virus",
        icon: "🦠",
        cost: { energy: 8, nutrients: 3 },
        description: "Infectious agent that spreads and damages tissue",
        stats: { health: 70, attack: 30, defense: 5, movement: 2 }
    }
];

type UnitPanelProps = {
    selectedUnit: CellType | null;
    onUnitSelect: (unitType: CellType) => void;
    playerResources: {
        energy: number;
        antibodies: number;
        nutrients: number;
    };
    currentPlayer: string;
};

const UnitPanel: React.FC<UnitPanelProps> = ({ 
    selectedUnit, 
    onUnitSelect, 
    playerResources,
    currentPlayer 
}) => {
    const canAfford = (unit: UnitInfo): boolean => {
        if (unit.cost.energy > playerResources.energy) return false;
        if (unit.cost.antibodies && unit.cost.antibodies > playerResources.antibodies) return false;
        if (unit.cost.nutrients && unit.cost.nutrients > playerResources.nutrients) return false;
        return true;
    };

    const getUnitAvailability = (unit: UnitInfo): string => {
        // Simple logic: pathogens for player 2, immune units for player 1
        if (currentPlayer === "1" && unit.type === CellType.Pathogen) {
            return "enemy-unit";
        }
        if (currentPlayer === "2" && unit.type !== CellType.Pathogen) {
            return "ally-unit";
        }
        return "available";
    };

    return (
        <div className="unit-panel">
            <div className="panel-header">
                <h3>Unit Selection</h3>
                <div className="player-resources">
                    <span className="resource">⚡ {playerResources.energy}</span>
                    <span className="resource">💊 {playerResources.antibodies}</span>
                    <span className="resource">🍎 {playerResources.nutrients}</span>
                </div>
            </div>
            
            <div className="unit-grid">
                {UNIT_DATA.map((unit) => {
                    const isSelected = selectedUnit === unit.type;
                    const affordable = canAfford(unit);
                    const availability = getUnitAvailability(unit);
                    const isClickable = affordable && availability === "available";
                    
                    return (
                        <motion.div
                            key={unit.type}
                            className={`unit-card ${isSelected ? 'selected' : ''} ${!affordable ? 'unaffordable' : ''} ${availability}`}
                            onClick={() => isClickable && onUnitSelect(unit.type)}
                            whileHover={isClickable ? { scale: 1.05 } : {}}
                            whileTap={isClickable ? { scale: 0.95 } : {}}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: UNIT_DATA.indexOf(unit) * 0.1 }}
                        >
                            <div className="unit-icon">{unit.icon}</div>
                            <div className="unit-info">
                                <h4>{unit.name}</h4>
                                <p className="unit-description">{unit.description}</p>
                                
                                <div className="unit-stats">
                                    <div className="stat">❤️ {unit.stats.health}</div>
                                    {unit.stats.attack && <div className="stat">⚔️ {unit.stats.attack}</div>}
                                    {unit.stats.defense && <div className="stat">🛡️ {unit.stats.defense}</div>}
                                    {unit.stats.movement && <div className="stat">👟 {unit.stats.movement}</div>}
                                </div>
                                
                                <div className="unit-cost">
                                    <span>⚡{unit.cost.energy}</span>
                                    {unit.cost.antibodies && <span>💊{unit.cost.antibodies}</span>}
                                    {unit.cost.nutrients && <span>🍎{unit.cost.nutrients}</span>}
                                </div>
                            </div>
                            
                            {!affordable && (
                                <div className="insufficient-resources">
                                    Insufficient Resources
                                </div>
                            )}
                            
                            {availability === "enemy-unit" && (
                                <div className="unavailable-unit">
                                    Enemy Unit
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
                        <p>Selected: <strong>{UNIT_DATA.find(u => u.type === selectedUnit)?.name}</strong></p>
                        <p>Click on an empty cell to place this unit</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default UnitPanel;
