// Bio Commander Types - matching Solana program structures

export enum UnitType {
  // Immune Cells
  TCell = "TCell",
  BCell = "BCell", 
  Macrophage = "Macrophage",
  NeutrophilCell = "NeutrophilCell",
  DendriticCell = "DendriticCell",
  NaturalKillerCell = "NaturalKillerCell",
  
  // Pathogens
  Virus = "Virus",
  Bacteria = "Bacteria",
  Fungus = "Fungus",
  Parasite = "Parasite",
  CancerCell = "CancerCell",
  Toxin = "Toxin"
}

export enum ZoneType {
  Circulatory = "Circulatory",
  Tissue = "Tissue",
  Lymphatic = "Lymphatic",
  Barrier = "Barrier",
  Organ = "Organ"
}

export enum Faction {
  ImmuneSystem = "ImmuneSystem",
  Pathogen = "Pathogen"
}

export enum ActionType {
  SpawnUnit = "SpawnUnit",
  MoveUnit = "MoveUnit",
  AttackPosition = "AttackPosition",
  UseSpecialAbility = "UseSpecialAbility",
  EndTurn = "EndTurn"
}

export enum SpecialAbility {
  // Immune Cell Abilities
  AntibodyProduction = "AntibodyProduction",
  Phagocytosis = "Phagocytosis",
  CytokineRelease = "CytokineRelease",
  MemoryResponse = "MemoryResponse",
  Infiltration = "Infiltration",
  ZoneHealing = "ZoneHealing",
  
  // Pathogen Abilities
  Replication = "Replication",
  Mutation = "Mutation",
  ToxinRelease = "ToxinRelease",
  ImmuneEvasion = "ImmuneEvasion",
  Metastasis = "Metastasis",
  ResourceDrain = "ResourceDrain"
}

export interface UnitStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  movementRange: number;
  energyCost: number;
}

export interface UnitInfo {
  type: UnitType;
  name: string;
  icon: string;
  description: string;
  stats: UnitStats;
  specialAbilities: SpecialAbility[];
  faction: Faction;
  cost: ResourceCost;
}

export interface ResourceCost {
  energy: number;
  antibodies: number;
  stemCells: number;
  nutrients: number;
}

export interface PlayerResources {
  energy: number;
  antibodies: number;
  stemCells: number;
  nutrients: number;
}

export interface ZoneResources {
  energy: number;
  antibodies: number;
  stemCells: number;
  nutrients: number;
}

export interface Cell {
  unitId?: number;
  health?: number;
  unitType?: UnitType;
  owner?: string;
}

export interface Unit {
  unitId: number;
  unitType: UnitType;
  health: number;
  maxHealth: number;
  owner: string;
  x: number;
  y: number;
  zoneId: number;
  movementRange: number;
  hasActed: boolean;
  isAlive: boolean;
}

export interface Zone {
  zoneId: number;
  zoneType: ZoneType;
  name: string; // Added name property for display purposes
  x: number;
  y: number;
  owner: string;
  grid: (Cell | null)[][];
  resources: ZoneResources;
  unitCount: number;
  isBorderZone: boolean;
  isControlled: boolean;
  connectedZones: (number | null)[];
}

export interface Player {
  playerId: number;
  playerKey: string;
  faction: Faction;
  resources: PlayerResources;
  controlledZones: number;
  totalUnits: number;
  researchPoints: number;
  unlockedUnits: boolean[];
}

export interface Game {
  gameId: number;
  player1: string;
  player2: string;
  currentTurn: number;
  turnNumber: number;
  mapWidth: number;
  mapHeight: number;
  totalZones: number;
  gameState: GameState;
  winner: string;
  infectionLevel: number;
  immuneResponseLevel: number;
  turnTimeLimit: number;
  lastTurnTimestamp: number;
}

export enum GameState {
  WaitingForPlayers = "WaitingForPlayers",
  Active = "Active",
  Paused = "Paused",
  Finished = "Finished"
}

export interface PlayAction {
  action: ActionType;
  x: number;
  y: number;
  unitType: number;
  abilityIndex: number;
}

// Unit data matching Solana program
export const UNIT_DATA: Record<UnitType, UnitInfo> = {
  [UnitType.TCell]: {
    type: UnitType.TCell,
    name: "T-Cell",
    icon: "🛡️",
    description: "Cytotoxic lymphocyte that destroys infected cells",
    stats: { health: 80, maxHealth: 80, attack: 15, defense: 10, movementRange: 3, energyCost: 20 },
    specialAbilities: [SpecialAbility.CytokineRelease, SpecialAbility.MemoryResponse],
    faction: Faction.ImmuneSystem,
    cost: { energy: 20, antibodies: 5, stemCells: 1, nutrients: 8 }
  },
  
  [UnitType.BCell]: {
    type: UnitType.BCell,
    name: "B-Cell",
    icon: "💊",
    description: "Produces antibodies to neutralize threats",
    stats: { health: 60, maxHealth: 60, attack: 8, defense: 8, movementRange: 2, energyCost: 25 },
    specialAbilities: [SpecialAbility.AntibodyProduction, SpecialAbility.MemoryResponse],
    faction: Faction.ImmuneSystem,
    cost: { energy: 25, antibodies: 2, stemCells: 2, nutrients: 6 }
  },
  
  [UnitType.Macrophage]: {
    type: UnitType.Macrophage,
    name: "Macrophage",
    icon: "🍽️",
    description: "Large phagocyte that engulfs and destroys pathogens",
    stats: { health: 120, maxHealth: 120, attack: 20, defense: 15, movementRange: 2, energyCost: 30 },
    specialAbilities: [SpecialAbility.Phagocytosis, SpecialAbility.CytokineRelease],
    faction: Faction.ImmuneSystem,
    cost: { energy: 30, antibodies: 8, stemCells: 2, nutrients: 12 }
  },
  
  [UnitType.NeutrophilCell]: {
    type: UnitType.NeutrophilCell,
    name: "Neutrophil",
    icon: "⚡",
    description: "Fast-response immune cell, first line of defense",
    stats: { health: 70, maxHealth: 70, attack: 18, defense: 8, movementRange: 4, energyCost: 15 },
    specialAbilities: [SpecialAbility.Phagocytosis, SpecialAbility.Infiltration],
    faction: Faction.ImmuneSystem,
    cost: { energy: 15, antibodies: 3, stemCells: 1, nutrients: 5 }
  },
  
  [UnitType.DendriticCell]: {
    type: UnitType.DendriticCell,
    name: "Dendritic Cell",
    icon: "📡",
    description: "Antigen-presenting cell that activates other immune cells",
    stats: { health: 50, maxHealth: 50, attack: 5, defense: 12, movementRange: 3, energyCost: 35 },
    specialAbilities: [SpecialAbility.CytokineRelease, SpecialAbility.Infiltration],
    faction: Faction.ImmuneSystem,
    cost: { energy: 35, antibodies: 12, stemCells: 3, nutrients: 8 }
  },
  
  [UnitType.NaturalKillerCell]: {
    type: UnitType.NaturalKillerCell,
    name: "NK Cell",
    icon: "🗡️",
    description: "Elite killer that destroys compromised cells",
    stats: { health: 90, maxHealth: 90, attack: 25, defense: 10, movementRange: 3, energyCost: 40 },
    specialAbilities: [SpecialAbility.CytokineRelease, SpecialAbility.ZoneHealing],
    faction: Faction.ImmuneSystem,
    cost: { energy: 40, antibodies: 10, stemCells: 3, nutrients: 15 }
  },
  
  [UnitType.Virus]: {
    type: UnitType.Virus,
    name: "Virus",
    icon: "🦠",
    description: "Infectious agent that hijacks cellular machinery",
    stats: { health: 40, maxHealth: 40, attack: 12, defense: 5, movementRange: 4, energyCost: 10 },
    specialAbilities: [SpecialAbility.Replication, SpecialAbility.ImmuneEvasion],
    faction: Faction.Pathogen,
    cost: { energy: 10, antibodies: 0, stemCells: 0, nutrients: 4 }
  },
  
  [UnitType.Bacteria]: {
    type: UnitType.Bacteria,
    name: "Bacteria",
    icon: "🧫",
    description: "Bacterial pathogen that multiplies rapidly",
    stats: { health: 60, maxHealth: 60, attack: 15, defense: 8, movementRange: 2, energyCost: 15 },
    specialAbilities: [SpecialAbility.Replication, SpecialAbility.ToxinRelease],
    faction: Faction.Pathogen,
    cost: { energy: 15, antibodies: 0, stemCells: 0, nutrients: 6 }
  },
  
  [UnitType.Fungus]: {
    type: UnitType.Fungus,
    name: "Fungus",
    icon: "🍄",
    description: "Fungal infection that spreads through spores",
    stats: { health: 80, maxHealth: 80, attack: 10, defense: 12, movementRange: 1, energyCost: 20 },
    specialAbilities: [SpecialAbility.Replication, SpecialAbility.ResourceDrain],
    faction: Faction.Pathogen,
    cost: { energy: 20, antibodies: 0, stemCells: 0, nutrients: 8 }
  },
  
  [UnitType.Parasite]: {
    type: UnitType.Parasite,
    name: "Parasite",
    icon: "🪱",
    description: "Parasitic organism that drains host resources",
    stats: { health: 70, maxHealth: 70, attack: 18, defense: 6, movementRange: 3, energyCost: 25 },
    specialAbilities: [SpecialAbility.ImmuneEvasion, SpecialAbility.ResourceDrain],
    faction: Faction.Pathogen,
    cost: { energy: 25, antibodies: 0, stemCells: 0, nutrients: 10 }
  },
  
  [UnitType.CancerCell]: {
    type: UnitType.CancerCell,
    name: "Cancer Cell",
    icon: "⚫",
    description: "Malignant cell that grows uncontrollably",
    stats: { health: 100, maxHealth: 100, attack: 20, defense: 10, movementRange: 2, energyCost: 30 },
    specialAbilities: [SpecialAbility.Replication, SpecialAbility.Metastasis],
    faction: Faction.Pathogen,
    cost: { energy: 30, antibodies: 0, stemCells: 0, nutrients: 12 }
  },
  
  [UnitType.Toxin]: {
    type: UnitType.Toxin,
    name: "Toxin",
    icon: "☠️",
    description: "Poisonous substance that damages tissue",
    stats: { health: 30, maxHealth: 30, attack: 30, defense: 2, movementRange: 5, energyCost: 5 },
    specialAbilities: [SpecialAbility.ToxinRelease, SpecialAbility.ResourceDrain],
    faction: Faction.Pathogen,
    cost: { energy: 5, antibodies: 0, stemCells: 0, nutrients: 2 }
  }
};

export const getZoneResourceGeneration = (zoneType: ZoneType): ZoneResources => {
  switch (zoneType) {
    case ZoneType.Circulatory:
      return { energy: 10, antibodies: 5, stemCells: 2, nutrients: 8 };
    case ZoneType.Tissue:
      return { energy: 5, antibodies: 15, stemCells: 1, nutrients: 10 };
    case ZoneType.Lymphatic:
      return { energy: 8, antibodies: 20, stemCells: 5, nutrients: 5 };
    case ZoneType.Barrier:
      return { energy: 3, antibodies: 25, stemCells: 1, nutrients: 3 };
    case ZoneType.Organ:
      return { energy: 15, antibodies: 10, stemCells: 3, nutrients: 15 };
  }
};

export const getZoneDefenseBonus = (zoneType: ZoneType): number => {
  switch (zoneType) {
    case ZoneType.Circulatory:
      return 0;
    case ZoneType.Tissue:
      return 2;
    case ZoneType.Lymphatic:
      return 3;
    case ZoneType.Barrier:
      return 5;
    case ZoneType.Organ:
      return 1;
  }
};

export const getZoneMovementCost = (zoneType: ZoneType): number => {
  switch (zoneType) {
    case ZoneType.Circulatory:
      return 1;
    case ZoneType.Tissue:
      return 3;
    case ZoneType.Lymphatic:
      return 2;
    case ZoneType.Barrier:
      return 4;
    case ZoneType.Organ:
      return 2;
  }
};
