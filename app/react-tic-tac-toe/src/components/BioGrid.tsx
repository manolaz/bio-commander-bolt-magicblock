import React from 'react';
import "./BioGrid.scss";
import { motion } from "framer-motion";
import { Zone, Cell, ZoneType, UnitType, UNIT_DATA } from '../types/bioCommander';

type BioGridProps = {
    zone: Zone;
    onCellClick: (row: number, col: number) => void;
    selectedUnit?: UnitType | null;
    currentPlayer?: string;
    selectedCell?: { row: number; col: number } | null;
    onCellHover?: (row: number, col: number) => void;
    onCellLeave?: () => void;
};

const BioGrid: React.FC<BioGridProps> = ({ 
    zone, 
    onCellClick, 
    selectedUnit, 
    currentPlayer,
    selectedCell,
    onCellHover,
    onCellLeave
}) => {
    const getZoneStyle = (zoneType: ZoneType): string => {
        switch (zoneType) {
            case ZoneType.Circulatory:
                return "zone-circulatory";
            case ZoneType.Tissue:
                return "zone-tissue";
            case ZoneType.Lymphatic:
                return "zone-lymphatic";
            case ZoneType.Barrier:
                return "zone-barrier";
            case ZoneType.Organ:
                return "zone-organ";
            default:
                return "zone-tissue";
        }
    };

    const getCellIcon = (cell: Cell | null): string => {
        if (!cell || !cell.unitType) return "";
        
        const unitData = UNIT_DATA[cell.unitType];
        return unitData ? unitData.icon : "";
    };

    const getCellClass = (cell: Cell | null, row: number, col: number): string => {
        let baseClass = "bio-cell";
        
        if (!cell) {
            baseClass += " empty";
        } else {
            baseClass += ` occupied player-${cell.owner}`;
            if (cell.unitType) {
                const unitData = UNIT_DATA[cell.unitType];
                baseClass += ` ${unitData.faction.toLowerCase()}`;
            }
        }
        
        // Highlight selected cell
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            baseClass += " selected";
        }
        
        // Highlight valid placement cells
        if (selectedUnit && !cell) {
            baseClass += " valid-placement";
        }
        
        return baseClass;
    };

    const getZoneTypeDescription = (zoneType: ZoneType): string => {
        switch (zoneType) {
            case ZoneType.Circulatory:
                return "Fast movement, global deployment";
            case ZoneType.Tissue:
                return "Dense defensive positions";
            case ZoneType.Lymphatic:
                return "Immune cell production hub";
            case ZoneType.Barrier:
                return "Strong defensive bonuses";
            case ZoneType.Organ:
                return "Special abilities and win conditions";
            default:
                return "";
        }
    };

    return (
        <div className={`bio-zone ${getZoneStyle(zone.zoneType)}`}>
            <div className="zone-header">
                <div className="zone-title">
                    <h3>Zone {zone.zoneId}: {zone.zoneType}</h3>
                    <p className="zone-description">{getZoneTypeDescription(zone.zoneType)}</p>
                </div>
                <div className="zone-info">
                    <div className="zone-owner">
                        Owner: {zone.owner === "11111111111111111111111111111112" ? "Neutral" : `Player ${zone.owner}`}
                    </div>
                    <div className="zone-resources">
                        <span title="Energy">⚡ {zone.resources.energy}</span>
                        <span title="Antibodies">💊 {zone.resources.antibodies}</span>
                        <span title="Stem Cells">🧬 {zone.resources.stemCells}</span>
                        <span title="Nutrients">🍎 {zone.resources.nutrients}</span>
                    </div>
                    <div className="zone-stats">
                        <span>Units: {zone.unitCount}/256</span>
                        <span>Position: ({zone.x}, {zone.y})</span>
                    </div>
                </div>
            </div>
            
            <div className="bio-grid">
                {zone.grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <motion.div
                            key={`${rowIndex}-${colIndex}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: (rowIndex + colIndex) * 0.005 }}
                            className={getCellClass(cell, rowIndex, colIndex)}
                            onClick={() => onCellClick(rowIndex, colIndex)}
                            onMouseEnter={() => onCellHover?.(rowIndex, colIndex)}
                            onMouseLeave={() => onCellLeave?.()}
                            title={cell ? `${cell.unitType} (${cell.health} HP)` : 'Empty cell'}
                        >
                            <span className="cell-icon">
                                {getCellIcon(cell)}
                            </span>
                            {cell && cell.health && cell.health < (UNIT_DATA[cell.unitType!]?.stats.maxHealth || 100) && (
                                <div className="health-bar">
                                    <div 
                                        className="health-fill" 
                                        style={{ 
                                            width: `${(cell.health / (UNIT_DATA[cell.unitType!]?.stats.maxHealth || 100)) * 100}%` 
                                        }}
                                    />
                                </div>
                            )}
                            {selectedUnit && !cell && (
                                <div className="placement-preview">
                                    {UNIT_DATA[selectedUnit]?.icon}
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            <div className="zone-connections">
                {zone.connectedZones.filter(z => z !== null).length > 0 && (
                    <div className="connections">
                        <span>Connected zones: {zone.connectedZones.filter(z => z !== null).join(", ")}</span>
                    </div>
                )}
                {zone.isBorderZone && (
                    <div className="border-indicator">
                        🔗 Border Zone - Can expand from here
                    </div>
                )}
            </div>
        </div>
    );
};

export default BioGrid;
