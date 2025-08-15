import React from 'react';
import "./ZoneMinimap.scss";
import { motion } from "framer-motion";
import { Zone, ZoneType } from './BioGrid';

type ZoneMinimapProps = {
    zones: Zone[];
    selectedZoneIndex: number;
    onZoneSelect: (index: number) => void;
};

const ZoneMinimap: React.FC<ZoneMinimapProps> = ({ zones, selectedZoneIndex, onZoneSelect }) => {
    const getZoneColor = (zoneType: ZoneType): string => {
        switch (zoneType) {
            case ZoneType.Circulatory:
                return "#e74c3c";
            case ZoneType.Tissue:
                return "#8e44ad";
            case ZoneType.Lymphatic:
                return "#27ae60";
            case ZoneType.Barrier:
                return "#f39c12";
            case ZoneType.Organ:
                return "#9b59b6";
            default:
                return "#555";
        }
    };

    const getZoneIcon = (zoneType: ZoneType): string => {
        switch (zoneType) {
            case ZoneType.Circulatory:
                return "🩸";
            case ZoneType.Tissue:
                return "🔬";
            case ZoneType.Lymphatic:
                return "💧";
            case ZoneType.Barrier:
                return "🛡️";
            case ZoneType.Organ:
                return "🫀";
            default:
                return "⚪";
        }
    };

    const getControlStatus = (zone: Zone): { player1: number; player2: number; neutral: number } => {
        const cells = zone.grid.flat();
        const player1Units = cells.filter(cell => cell.owner === "1").length;
        const player2Units = cells.filter(cell => cell.owner === "2").length;
        const neutralCells = cells.filter(cell => !cell.owner && cell.type !== "empty").length;
        
        return { player1: player1Units, player2: player2Units, neutral: neutralCells };
    };

    return (
        <div className="zone-minimap">
            <h4>Zone Overview</h4>
            <div className="minimap-grid">
                {zones.map((zone, index) => {
                    const isSelected = index === selectedZoneIndex;
                    const control = getControlStatus(zone);
                    const dominantPlayer = control.player1 > control.player2 ? "1" : 
                                          control.player2 > control.player1 ? "2" : "neutral";
                    
                    return (
                        <motion.div
                            key={zone.id}
                            className={`zone-card ${isSelected ? 'selected' : ''} control-${dominantPlayer}`}
                            onClick={() => onZoneSelect(index)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ borderColor: getZoneColor(zone.type) }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="zone-icon" style={{ color: getZoneColor(zone.type) }}>
                                {getZoneIcon(zone.type)}
                            </div>
                            
                            <div className="zone-info">
                                <h5>{zone.name}</h5>
                                <div className="zone-stats">
                                    <div className="control-bars">
                                        <div className="control-bar player1" style={{ 
                                            width: `${(control.player1 / (control.player1 + control.player2 + control.neutral + 1)) * 100}%` 
                                        }} />
                                        <div className="control-bar player2" style={{ 
                                            width: `${(control.player2 / (control.player1 + control.player2 + control.neutral + 1)) * 100}%` 
                                        }} />
                                    </div>
                                    <div className="unit-counts">
                                        <span className="player1-count">🛡️{control.player1}</span>
                                        <span className="player2-count">🦠{control.player2}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="zone-resources">
                                <div className="resource">⚡{zone.resources.energy}</div>
                                <div className="resource">💊{zone.resources.antibodies}</div>
                                <div className="resource">🍎{zone.resources.nutrients}</div>
                            </div>
                            
                            {zone.connections.length > 0 && (
                                <div className="connections-indicator">
                                    <span>🔗{zone.connections.length}</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
            
            <div className="minimap-legend">
                <div className="legend-item">
                    <div className="legend-color control-1"></div>
                    <span>Immune Controlled</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color control-2"></div>
                    <span>Pathogen Controlled</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color control-neutral"></div>
                    <span>Contested</span>
                </div>
            </div>
        </div>
    );
};

export default ZoneMinimap;
