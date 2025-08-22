import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerResources, ZoneResources, Faction } from '../types/bioCommander';
import './ResourceManager.scss';

interface ResourceManagerProps {
  playerResources: PlayerResources;
  zoneResources: ZoneResources[];
  playerFaction: Faction;
  currentTurn: number;
  onResourceTransfer?: (fromZone: number, toPlayer: boolean, resourceType: keyof PlayerResources, amount: number) => void;
  onResourceTrade?: (give: Partial<PlayerResources>, receive: Partial<PlayerResources>) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface ResourceInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
  sources: string[];
  uses: string[];
}

const RESOURCE_INFO: Record<keyof PlayerResources, ResourceInfo> = {
  energy: {
    name: "Energy",
    icon: "⚡",
    color: "#fbbf24",
    description: "Primary resource for all cellular activities and unit deployment",
    sources: ["Zone production", "Unit abilities", "Resource nodes"],
    uses: ["Unit spawning", "Movement", "Special abilities", "Zone expansion"]
  },
  antibodies: {
    name: "Antibodies",
    icon: "💊",
    color: "#3b82f6",
    description: "Specialized proteins that neutralize threats and boost defenses",
    sources: ["B-Cells", "Lymphatic zones", "Immune responses"],
    uses: ["Unit production", "Defense bonuses", "Zone healing", "Immune abilities"]
  },
  stemCells: {
    name: "Stem Cells",
    icon: "🧬",
    color: "#10b981",
    description: "Undifferentiated cells capable of becoming any unit type",
    sources: ["Bone marrow zones", "Special abilities", "Research"],
    uses: ["Advanced units", "Unit upgrades", "Regeneration", "Zone creation"]
  },
  nutrients: {
    name: "Nutrients",
    icon: "🍎",
    color: "#f59e0b",
    description: "Essential compounds needed for growth and maintenance",
    sources: ["Tissue zones", "Resource consumption", "Metabolic processes"],
    uses: ["Unit health", "Growth", "Maintenance", "Cellular repair"]
  }
};

const ResourceManager: React.FC<ResourceManagerProps> = ({
  playerResources,
  zoneResources,
  playerFaction,
  currentTurn,
  onResourceTransfer,
  onResourceTrade,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'zones' | 'trade'>('overview');
  const [selectedResource, setSelectedResource] = useState<keyof PlayerResources | null>(null);
  const [tradeOffer, setTradeOffer] = useState<Partial<PlayerResources>>({});
  const [tradeRequest, setTradeRequest] = useState<Partial<PlayerResources>>({});

  const getTotalZoneResources = (): PlayerResources => {
    return zoneResources.reduce((total, zone) => ({
      energy: total.energy + zone.resources.energy,
      antibodies: total.antibodies + zone.resources.antibodies,
      stemCells: total.stemCells + zone.resources.stemCells,
      nutrients: total.nutrients + zone.resources.nutrients
    }), { energy: 0, antibodies: 0, stemCells: 0, nutrients: 0 });
  };

  const getResourceEfficiency = (): number => {
    const totalResources = playerResources.energy + playerResources.antibodies + 
                           playerResources.stemCells + playerResources.nutrients;
    const maxEfficiency = 1000; // Theoretical maximum
    return Math.min((totalResources / maxEfficiency) * 100, 100);
  };

  const getResourceTrend = (resourceType: keyof PlayerResources): 'up' | 'down' | 'stable' => {
    // Mock trend calculation - in real implementation, this would track historical data
    const zoneTotal = getTotalZoneResources()[resourceType];
    const playerTotal = playerResources[resourceType];
    
    if (zoneTotal > playerTotal * 0.1) return 'up';
    if (zoneTotal < playerTotal * 0.05) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getFactionResourceBonus = (): Partial<PlayerResources> => {
    switch (playerFaction) {
      case Faction.ImmuneSystem:
        return { antibodies: 20, stemCells: 10 };
      case Faction.Pathogen:
        return { energy: 30, nutrients: 15 };
      default:
        return {};
    }
  };

  const handleTradeProposal = () => {
    if (onResourceTrade) {
      onResourceTrade(tradeOffer, tradeRequest);
      setTradeOffer({});
      setTradeRequest({});
    }
  };

  const canAffordTrade = (): boolean => {
    return Object.entries(tradeOffer).every(([resource, amount]) => 
      playerResources[resource as keyof PlayerResources] >= (amount || 0)
    );
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="resource-manager-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="resource-manager"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="manager-header">
          <h2>📊 Resource Management</h2>
          <p>Manage your biological resources and economy</p>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="resource-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Overview
          </button>
          <button
            className={`tab ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            🌍 Zone Resources
          </button>
          <button
            className={`tab ${activeTab === 'trade' ? 'active' : ''}`}
            onClick={() => setActiveTab('trade')}
          >
            💱 Resource Trade
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              className="tab-content overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="resource-summary">
                <div className="summary-header">
                  <h3>Resource Portfolio</h3>
                  <div className="efficiency-meter">
                    <span>Efficiency: {getResourceEfficiency().toFixed(1)}%</span>
                    <div className="efficiency-bar">
                      <div 
                        className="efficiency-fill"
                        style={{ width: `${getResourceEfficiency()}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="resource-cards">
                  {Object.entries(RESOURCE_INFO).map(([resourceKey, info]) => {
                    const resourceType = resourceKey as keyof PlayerResources;
                    const amount = playerResources[resourceType];
                    const trend = getResourceTrend(resourceType);
                    const zoneTotal = getTotalZoneResources()[resourceType];

                    return (
                      <motion.div
                        key={resourceKey}
                        className={`resource-card ${selectedResource === resourceType ? 'selected' : ''}`}
                        onClick={() => setSelectedResource(selectedResource === resourceType ? null : resourceType)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ '--resource-color': info.color } as React.CSSProperties}
                      >
                        <div className="card-header">
                          <span className="resource-icon">{info.icon}</span>
                          <div className="resource-info">
                            <h4>{info.name}</h4>
                            <span className="resource-amount">{amount.toLocaleString()}</span>
                          </div>
                          <div className="resource-trend">
                            <span className="trend-icon">{getTrendIcon(trend)}</span>
                            <span className="zone-production">+{zoneTotal}/turn</span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedResource === resourceType && (
                            <motion.div
                              className="card-details"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <p className="resource-description">{info.description}</p>
                              
                              <div className="resource-breakdown">
                                <div className="sources">
                                  <h5>Sources:</h5>
                                  <ul>
                                    {info.sources.map((source, index) => (
                                      <li key={index}>{source}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="uses">
                                  <h5>Uses:</h5>
                                  <ul>
                                    {info.uses.map((use, index) => (
                                      <li key={index}>{use}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="faction-bonuses">
                  <h3>Faction Bonuses</h3>
                  <div className="bonus-info">
                    <span className="faction-icon">
                      {playerFaction === Faction.ImmuneSystem ? '🛡️' : '🦠'}
                    </span>
                    <span className="faction-name">{playerFaction}</span>
                    <div className="bonuses">
                      {Object.entries(getFactionResourceBonus()).map(([resource, bonus]) => (
                        <span key={resource} className="bonus">
                          {RESOURCE_INFO[resource as keyof PlayerResources].icon} +{bonus}/turn
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'zones' && (
            <motion.div
              key="zones"
              className="tab-content zones"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="zone-resources">
                <h3>Zone Resource Production</h3>
                
                <div className="zones-grid">
                  {zoneResources.map((zone, index) => (
                    <div key={index} className="zone-resource-card">
                      <div className="zone-header">
                        <h4>Zone {index + 1}</h4>
                        <span className="zone-production">Production/Turn</span>
                      </div>
                      
                      <div className="zone-resources-list">
                        {Object.entries(zone).map(([resourceKey, amount]) => {
                          const resourceType = resourceKey as keyof ZoneResources;
                          const info = RESOURCE_INFO[resourceType];
                          
                          return (
                            <div key={resourceKey} className="zone-resource-item">
                              <span className="resource-icon">{info.icon}</span>
                              <span className="resource-name">{info.name}</span>
                              <span className="resource-amount">+{amount}</span>
                              {onResourceTransfer && (
                                <button
                                  className="transfer-button"
                                  onClick={() => onResourceTransfer(index, true, resourceType, amount)}
                                  title={`Transfer ${amount} ${info.name} to player reserves`}
                                >
                                  📤
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="total-production">
                  <h4>Total Zone Production</h4>
                  <div className="production-summary">
                    {Object.entries(getTotalZoneResources()).map(([resourceKey, total]) => {
                      const info = RESOURCE_INFO[resourceKey as keyof PlayerResources];
                      return (
                        <div key={resourceKey} className="production-item">
                          <span className="resource-icon">{info.icon}</span>
                          <span>{info.name}: +{total}/turn</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'trade' && (
            <motion.div
              key="trade"
              className="tab-content trade"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="resource-trade">
                <h3>Resource Exchange</h3>
                <p>Convert between different resource types</p>

                <div className="trade-interface">
                  <div className="trade-section">
                    <h4>Offer (Give)</h4>
                    <div className="trade-inputs">
                      {Object.entries(RESOURCE_INFO).map(([resourceKey, info]) => {
                        const resourceType = resourceKey as keyof PlayerResources;
                        const available = playerResources[resourceType];
                        
                        return (
                          <div key={resourceKey} className="trade-input">
                            <label>
                              <span className="resource-icon">{info.icon}</span>
                              {info.name}
                              <span className="available">({available} available)</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={available}
                              value={tradeOffer[resourceType] || 0}
                              onChange={(e) => setTradeOffer({
                                ...tradeOffer,
                                [resourceType]: parseInt(e.target.value) || 0
                              })}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="trade-arrow">⇄</div>

                  <div className="trade-section">
                    <h4>Request (Receive)</h4>
                    <div className="trade-inputs">
                      {Object.entries(RESOURCE_INFO).map(([resourceKey, info]) => {
                        const resourceType = resourceKey as keyof PlayerResources;
                        
                        return (
                          <div key={resourceKey} className="trade-input">
                            <label>
                              <span className="resource-icon">{info.icon}</span>
                              {info.name}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={tradeRequest[resourceType] || 0}
                              onChange={(e) => setTradeRequest({
                                ...tradeRequest,
                                [resourceType]: parseInt(e.target.value) || 0
                              })}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="trade-rates">
                  <h4>Current Exchange Rates</h4>
                  <div className="rates-grid">
                    <div className="rate-item">⚡ 1 Energy = 💊 0.5 Antibodies</div>
                    <div className="rate-item">💊 1 Antibody = 🧬 0.2 Stem Cells</div>
                    <div className="rate-item">🧬 1 Stem Cell = 🍎 2 Nutrients</div>
                    <div className="rate-item">🍎 1 Nutrient = ⚡ 0.8 Energy</div>
                  </div>
                </div>

                <div className="trade-actions">
                  <button
                    className="trade-button"
                    onClick={handleTradeProposal}
                    disabled={!canAffordTrade() || Object.keys(tradeOffer).length === 0}
                  >
                    Execute Trade
                  </button>
                  <button
                    className="clear-button"
                    onClick={() => {
                      setTradeOffer({});
                      setTradeRequest({});
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ResourceManager;
