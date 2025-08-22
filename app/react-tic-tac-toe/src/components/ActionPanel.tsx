import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionType, UnitType, SpecialAbility, UNIT_DATA } from '../types/bioCommander';
import './ActionPanel.scss';

interface ActionPanelProps {
  currentPlayer: string;
  selectedCell: { row: number; col: number } | null;
  selectedUnit: UnitType | null;
  onAction: (action: ActionType, params?: any) => void;
  availableActions: ActionType[];
  unitAtCell?: {
    unitType: UnitType;
    health: number;
    owner: string;
    abilities: SpecialAbility[];
  } | null;
  isMyTurn: boolean;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  currentPlayer,
  selectedCell,
  selectedUnit,
  onAction,
  availableActions,
  unitAtCell,
  isMyTurn
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<number | null>(null);

  const getActionIcon = (action: ActionType): string => {
    switch (action) {
      case ActionType.SpawnUnit:
        return "➕";
      case ActionType.MoveUnit:
        return "🏃";
      case ActionType.AttackPosition:
        return "⚔️";
      case ActionType.UseSpecialAbility:
        return "✨";
      case ActionType.EndTurn:
        return "⏭️";
      default:
        return "❓";
    }
  };

  const getActionName = (action: ActionType): string => {
    switch (action) {
      case ActionType.SpawnUnit:
        return "Spawn Unit";
      case ActionType.MoveUnit:
        return "Move Unit";
      case ActionType.AttackPosition:
        return "Attack";
      case ActionType.UseSpecialAbility:
        return "Special Ability";
      case ActionType.EndTurn:
        return "End Turn";
      default:
        return "Unknown";
    }
  };

  const getActionDescription = (action: ActionType): string => {
    switch (action) {
      case ActionType.SpawnUnit:
        return "Place a new unit on an empty cell";
      case ActionType.MoveUnit:
        return "Move the selected unit to a new position";
      case ActionType.AttackPosition:
        return "Attack an enemy unit or position";
      case ActionType.UseSpecialAbility:
        return "Activate a special ability";
      case ActionType.EndTurn:
        return "End your turn and pass to opponent";
      default:
        return "";
    }
  };

  const handleActionClick = (action: ActionType) => {
    if (!isMyTurn) return;
    
    if (action === ActionType.EndTurn) {
      onAction(action);
      return;
    }
    
    setSelectedAction(action);
  };

  const handleExecuteAction = () => {
    if (!selectedAction || !selectedCell) return;
    
    const params: any = {
      x: selectedCell.col,
      y: selectedCell.row,
      unitType: selectedUnit ? Object.values(UnitType).indexOf(selectedUnit) : 0,
      abilityIndex: selectedAbility || 0
    };
    
    onAction(selectedAction, params);
    setSelectedAction(null);
    setSelectedAbility(null);
  };

  const canExecuteAction = (): boolean => {
    if (!selectedAction || !selectedCell) return false;
    
    switch (selectedAction) {
      case ActionType.SpawnUnit:
        return selectedUnit !== null;
      case ActionType.MoveUnit:
      case ActionType.AttackPosition:
        return unitAtCell !== null && unitAtCell.owner === currentPlayer;
      case ActionType.UseSpecialAbility:
        return unitAtCell !== null && unitAtCell.owner === currentPlayer && selectedAbility !== null;
      default:
        return true;
    }
  };

  return (
    <div className={`action-panel ${!isMyTurn ? 'disabled' : ''}`}>
      <div className="panel-header">
        <h3>Actions</h3>
        <div className="turn-indicator">
          {isMyTurn ? "🟢 Your Turn" : "🔴 Opponent's Turn"}
        </div>
      </div>
      
      <div className="cell-info">
        {selectedCell ? (
          <div className="selected-cell">
            <h4>Selected Cell: ({selectedCell.row}, {selectedCell.col})</h4>
            {unitAtCell ? (
              <div className="unit-info">
                <div className="unit-header">
                  <span className="unit-icon">{UNIT_DATA[unitAtCell.unitType]?.icon}</span>
                  <span className="unit-name">{UNIT_DATA[unitAtCell.unitType]?.name}</span>
                  <span className={`owner player-${unitAtCell.owner}`}>
                    Player {unitAtCell.owner}
                  </span>
                </div>
                <div className="unit-stats">
                  <span>❤️ {unitAtCell.health}/{UNIT_DATA[unitAtCell.unitType]?.stats.maxHealth}</span>
                  <span>⚔️ {UNIT_DATA[unitAtCell.unitType]?.stats.attack}</span>
                  <span>🛡️ {UNIT_DATA[unitAtCell.unitType]?.stats.defense}</span>
                </div>
                {unitAtCell.abilities.length > 0 && (
                  <div className="unit-abilities">
                    <span>Abilities:</span>
                    {unitAtCell.abilities.map((ability, index) => (
                      <span key={index} className="ability-tag">
                        {ability}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-cell">Empty cell</div>
            )}
          </div>
        ) : (
          <div className="no-selection">Click on a cell to select it</div>
        )}
      </div>
      
      <div className="action-buttons">
        {availableActions.map((action) => {
          const isSelected = selectedAction === action;
          const isAvailable = isMyTurn && (
            action === ActionType.EndTurn || 
            selectedCell !== null
          );
          
          return (
            <motion.button
              key={action}
              className={`action-button ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
              onClick={() => handleActionClick(action)}
              disabled={!isAvailable}
              whileHover={isAvailable ? { scale: 1.05 } : {}}
              whileTap={isAvailable ? { scale: 0.95 } : {}}
              title={getActionDescription(action)}
            >
              <span className="action-icon">{getActionIcon(action)}</span>
              <span className="action-name">{getActionName(action)}</span>
            </motion.button>
          );
        })}
      </div>
      
      <AnimatePresence>
        {selectedAction && selectedAction !== ActionType.EndTurn && (
          <motion.div
            className="action-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4>Configure {getActionName(selectedAction)}</h4>
            
            {selectedAction === ActionType.UseSpecialAbility && unitAtCell && (
              <div className="ability-selection">
                <p>Select ability to use:</p>
                <div className="ability-buttons">
                  {unitAtCell.abilities.map((ability, index) => (
                    <button
                      key={index}
                      className={`ability-button ${selectedAbility === index ? 'selected' : ''}`}
                      onClick={() => setSelectedAbility(index)}
                    >
                      {ability}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedAction === ActionType.SpawnUnit && (
              <div className="spawn-info">
                <p>
                  {selectedUnit 
                    ? `Spawn ${UNIT_DATA[selectedUnit]?.name} at selected cell`
                    : "Select a unit type first"
                  }
                </p>
              </div>
            )}
            
            <div className="action-controls">
              <button
                className="execute-button"
                onClick={handleExecuteAction}
                disabled={!canExecuteAction()}
              >
                Execute {getActionName(selectedAction)}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setSelectedAction(null);
                  setSelectedAbility(null);
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="quick-actions">
        <motion.button
          className="end-turn-button"
          onClick={() => onAction(ActionType.EndTurn)}
          disabled={!isMyTurn}
          whileHover={isMyTurn ? { scale: 1.05 } : {}}
          whileTap={isMyTurn ? { scale: 0.95 } : {}}
        >
          <span className="action-icon">⏭️</span>
          End Turn
        </motion.button>
      </div>
    </div>
  );
};

export default ActionPanel;
