import React from 'react';
import { motion } from 'framer-motion';
import { Faction } from '../types/bioCommander';
import './FactionSelector.scss';

interface FactionSelectorProps {
  selectedFaction: Faction | null;
  onFactionSelect: (faction: Faction) => void;
  onConfirm: () => void;
  isVisible: boolean;
}

const FactionSelector: React.FC<FactionSelectorProps> = ({
  selectedFaction,
  onFactionSelect,
  onConfirm,
  isVisible
}) => {
  if (!isVisible) return null;

  const factionData = {
    [Faction.ImmuneSystem]: {
      name: "Immune System",
      icon: "🛡️",
      color: "#4A90E2",
      description: "Defend the body from infections and foreign invaders",
      strengths: [
        "🩸 Superior coordination and communication",
        "💊 Antibody production capabilities", 
        "🧠 Memory response to previous threats",
        "🛡️ Strong defensive capabilities"
      ],
      units: [
        "🛡️ T-Cells - Cytotoxic destroyers",
        "💊 B-Cells - Antibody producers", 
        "🍽️ Macrophages - Engulf enemies",
        "⚡ Neutrophils - First responders",
        "📡 Dendritic Cells - Intelligence network",
        "🗡️ NK Cells - Elite assassins"
      ],
      strategy: "Focus on coordination, defense, and targeted elimination of threats"
    },
    [Faction.Pathogen]: {
      name: "Pathogen",
      icon: "🦠",
      color: "#E74C3C",
      description: "Infect and overwhelm the host's defenses",
      strengths: [
        "🔄 Rapid replication and spread",
        "👻 Immune system evasion",
        "☠️ Toxin production",
        "🌊 Metastatic capabilities"
      ],
      units: [
        "🦠 Viruses - Fast, evasive infiltrators",
        "🧫 Bacteria - Rapid multipliers",
        "🍄 Fungi - Persistent spreaders",
        "🪱 Parasites - Resource drainers", 
        "⚫ Cancer Cells - Uncontrolled growth",
        "☠️ Toxins - Area damage dealers"
      ],
      strategy: "Overwhelm through numbers, spread quickly, and drain host resources"
    }
  };

  return (
    <motion.div
      className="faction-selector-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="faction-selector"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Choose Your Faction</h2>
        <p className="subtitle">Select your role in the biological battlefield</p>
        
        <div className="faction-options">
          {Object.entries(factionData).map(([faction, data]) => {
            const isSelected = selectedFaction === faction;
            
            return (
              <motion.div
                key={faction}
                className={`faction-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onFactionSelect(faction as Faction)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ '--faction-color': data.color } as React.CSSProperties}
              >
                <div className="faction-header">
                  <div className="faction-icon">{data.icon}</div>
                  <h3>{data.name}</h3>
                </div>
                
                <p className="faction-description">{data.description}</p>
                
                <div className="faction-details">
                  <div className="strengths">
                    <h4>Strengths:</h4>
                    <ul>
                      {data.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="units">
                    <h4>Units:</h4>
                    <ul>
                      {data.units.map((unit, index) => (
                        <li key={index}>{unit}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="strategy">
                    <h4>Strategy:</h4>
                    <p>{data.strategy}</p>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div
                    className="selected-indicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ✓ Selected
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {selectedFaction && (
          <motion.div
            className="confirm-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p>
              You have chosen: <strong>{factionData[selectedFaction].name}</strong>
            </p>
            <motion.button
              className="confirm-button"
              onClick={onConfirm}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Battle
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FactionSelector;
