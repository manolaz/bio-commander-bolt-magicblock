import React from 'react';
import "./BioGrid.scss";
import { motion } from "framer-motion";

export enum CellType {
    Empty = "empty",
    ImmuneCell = "immune-cell",
    Pathogen = "pathogen",
    Tissue = "tissue",
    BloodCell = "blood-cell",
    Antibody = "antibody"
}

export enum ZoneType {
    Circulatory = "circulatory",
    Tissue = "tissue", 
    Lymphatic = "lymphatic",
    Barrier = "barrier",
    Organ = "organ"
}

export interface Cell {
    type: CellType;
    owner?: string; // player ID
    health?: number;
    energy?: number;
}

export interface Zone {
    id: string;
    type: ZoneType;
    grid: Cell[][];
    name: string;
    connections: string[]; // connected zone IDs
    resources: {
        energy: number;
        antibodies: number;
        nutrients: number;
    };
}

type BioGridProps = {
    zone: Zone;
    onCellClick: (row: number, col: number) => void;
    selectedUnit?: CellType;
    currentPlayer?: string;
};

const BioGrid: React.FC<BioGridProps> = ({ zone, onCellClick, selectedUnit, currentPlayer }) => {
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

    const getCellIcon = (cell: Cell): string => {
        switch (cell.type) {
            case CellType.ImmuneCell:
                return "🛡️";
            case CellType.Pathogen:
                return "🦠";
            case CellType.Tissue:
                return "🔬";
            case CellType.BloodCell:
                return "🩸";
            case CellType.Antibody:
                return "💊";
            default:
                return "";
        }
    };

    const getCellClass = (cell: Cell): string => {
        let baseClass = `bio-cell ${cell.type}`;
        if (cell.owner) {
            baseClass += ` player-${cell.owner}`;
        }
        return baseClass;
    };

    return (
        <div className={`bio-zone ${getZoneStyle(zone.type)}`}>
            <div className="zone-header">
                <h3>{zone.name}</h3>
                <div className="zone-resources">
                    <span>⚡ {zone.resources.energy}</span>
                    <span>💊 {zone.resources.antibodies}</span>
                    <span>🍎 {zone.resources.nutrients}</span>
                </div>
            </div>
            
            <div className="bio-grid">
                {zone.grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <motion.div
                            key={`${rowIndex}-${colIndex}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: (rowIndex + colIndex) * 0.01 }}
                            className={getCellClass(cell)}
                            onClick={() => onCellClick(rowIndex, colIndex)}
                            title={`${cell.type} ${cell.health ? `(${cell.health} HP)` : ''}`}
                        >
                            <span className="cell-icon">
                                {getCellIcon(cell)}
                            </span>
                            {cell.health && cell.health < 100 && (
                                <div className="health-bar">
                                    <div 
                                        className="health-fill" 
                                        style={{ width: `${cell.health}%` }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            <div className="zone-connections">
                {zone.connections.length > 0 && (
                    <div className="connections">
                        <span>Connected to: {zone.connections.join(", ")}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BioGrid;
