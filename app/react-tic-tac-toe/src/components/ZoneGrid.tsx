import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zone, ZoneType, Faction } from '../types/bioCommander';
import './ZoneGrid.scss';

interface ZoneGridProps {
  zones: Zone[];
  selectedZone: Zone | null;
  onZoneSelect: (zone: Zone) => void;
  playerFaction: Faction;
  maxGridSize?: number;
}

export const ZoneGrid: React.FC<ZoneGridProps> = ({
  zones,
  selectedZone,
  onZoneSelect,
  playerFaction,
  maxGridSize = 8
}) => {
  const [gridZones, setGridZones] = useState<(Zone | null)[][]>([]);

  // Organize zones into a grid based on their x,y coordinates
  useEffect(() => {
    const grid: (Zone | null)[][] = Array(maxGridSize).fill(null).map(() => Array(maxGridSize).fill(null));
    
    zones.forEach(zone => {
      if (zone.x < maxGridSize && zone.y < maxGridSize) {
        grid[zone.y][zone.x] = zone;
      }
    });
    
    setGridZones(grid);
  }, [zones, maxGridSize]);

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

  const getZoneStatus = (zone: Zone): string => {
    if (!zone.isControlled) return 'Uncontrolled';
    if (zone.isBorderZone) return 'Border';
    return 'Controlled';
  };

  const getZoneStatusColor = (zone: Zone): string => {
    if (!zone.isControlled) return '#95a5a6';
    if (zone.isBorderZone) return '#f39c12';
    return '#27ae60';
  };

  const isAdjacentToSelected = (x: number, y: number): boolean => {
    if (!selectedZone) return false;
    
    const dx = Math.abs(x - selectedZone.x);
    const dy = Math.abs(y - selectedZone.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  };

  const canExpandTo = (x: number, y: number): boolean => {
    if (!selectedZone) return false;
    
    // Check if this position is adjacent to selected zone
    if (!isAdjacentToSelected(x, y)) return false;
    
    // Check if position is empty
    const zoneAtPosition = gridZones[y]?.[x];
    return !zoneAtPosition || !zoneAtPosition.isControlled;
  };

  return (
    <div className="zone-grid-container">
      <div className="zone-grid-header">
        <h3>🌍 Zone Map</h3>
        <div className="grid-info">
          <span>Grid Size: {maxGridSize}x{maxGridSize}</span>
          <span>Total Zones: {zones.length}</span>
          <span>Controlled: {zones.filter(z => z.isControlled).length}</span>
        </div>
      </div>

      <div className="zone-grid" style={{ 
        gridTemplateColumns: `repeat(${maxGridSize}, 1fr)`,
        gridTemplateRows: `repeat(${maxGridSize}, 1fr)`
      }}>
        {Array.from({ length: maxGridSize * maxGridSize }, (_, index) => {
          const x = index % maxGridSize;
          const y = Math.floor(index / maxGridSize);
          const zone = gridZones[y]?.[x];
          const isSelected = selectedZone?.zoneId === zone?.zoneId;
          const isAdjacent = isAdjacentToSelected(x, y);
          const canExpand = canExpandTo(x, y);

          return (
            <motion.div
              key={`${x}-${y}`}
              className={`zone-grid-cell ${zone ? 'occupied' : 'empty'} ${isSelected ? 'selected' : ''} ${isAdjacent ? 'adjacent' : ''} ${canExpand ? 'expandable' : ''}`}
              onClick={() => zone && onZoneSelect(zone)}
              whileHover={{ scale: zone ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.95 }}
              style={{
                gridColumn: x + 1,
                gridRow: y + 1
              }}
            >
              {zone ? (
                <div className="zone-content">
                  <div className="zone-icon">{getZoneIcon(zone.zoneType)}</div>
                  <div className="zone-id">#{zone.zoneId}</div>
                  <div 
                    className="zone-owner-indicator"
                    style={{ backgroundColor: getZoneColor(zone) }}
                  />
                  <div className="zone-status" style={{ color: getZoneStatusColor(zone) }}>
                    {getZoneStatus(zone)}
                  </div>
                  <div className="zone-resources">
                    <div className="resource">⚡{zone.resources.energy}</div>
                    <div className="resource">💊{zone.resources.antibodies}</div>
                  </div>
                  <div className="zone-units">{zone.unitCount} units</div>
                </div>
              ) : (
                <div className="empty-zone">
                  <div className="coordinates">({x}, {y})</div>
                  {canExpand && (
                    <div className="expand-hint">+</div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="zone-legend">
        <div className="legend-item">
          <div className="legend-color controlled"></div>
          <span>Controlled Zone</span>
        </div>
        <div className="legend-item">
          <div className="legend-color uncontrolled"></div>
          <span>Uncontrolled Zone</span>
        </div>
        <div className="legend-item">
          <div className="legend-color border"></div>
          <span>Border Zone</span>
        </div>
        <div className="legend-item">
          <div className="legend-color adjacent"></div>
          <span>Adjacent to Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-color expandable"></div>
          <span>Can Expand To</span>
        </div>
      </div>

      {selectedZone && (
        <div className="selected-zone-info">
          <h4>Selected Zone: {selectedZone.name || selectedZone.zoneType}</h4>
          <div className="zone-details">
            <div className="detail-row">
              <span>Type:</span>
              <span>{getZoneIcon(selectedZone.zoneType)} {selectedZone.zoneType}</span>
            </div>
            <div className="detail-row">
              <span>Position:</span>
              <span>({selectedZone.x}, {selectedZone.y})</span>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <span style={{ color: getZoneStatusColor(selectedZone) }}>
                {getZoneStatus(selectedZone)}
              </span>
            </div>
            <div className="detail-row">
              <span>Owner:</span>
              <span>{selectedZone.owner || 'None'}</span>
            </div>
            <div className="detail-row">
              <span>Connected Zones:</span>
              <span>{selectedZone.connectedZones.filter(z => z !== null).length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
