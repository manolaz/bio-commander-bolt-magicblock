import { Zone, ZoneType, Cell, UnitType, UNIT_DATA } from '../types/bioCommander';

export interface GameState {
    zones: Zone[];
    currentPlayer: string;
    turn: number;
    globalResources: {
        player1: PlayerResources;
        player2: PlayerResources;
    };
    gamePhase: GamePhase;
    selectedZone: number | null;
}

export interface PlayerResources {
    energy: number;
    antibodies: number;
    nutrients: number;
    stemCells: number;
}

export enum GamePhase {
    Setup = "setup",
    Deploy = "deploy", 
    Combat = "combat",
    Expansion = "expansion",
    Victory = "victory"
}

export const createEmptyCell = (): Cell => ({
    unitType: undefined,
    owner: undefined,
    health: undefined
});

export const createEmptyGrid = (): Cell[][] => {
    return Array(16).fill(null).map(() => 
        Array(16).fill(null).map(() => createEmptyCell())
    );
};

export const createInitialZone = (zoneId: number, zoneType: ZoneType): Zone => ({
    zoneId,
    zoneType,
    name: `${zoneType} Zone ${zoneId}`, // Generate name from zone type and ID
    x: 0,
    y: 0,
    owner: "11111111111111111111111111111112", // neutral
    grid: createEmptyGrid(),
    resources: {
        energy: zoneType === ZoneType.Circulatory ? 20 : 10,
        antibodies: zoneType === ZoneType.Lymphatic ? 15 : 5,
        nutrients: zoneType === ZoneType.Tissue ? 25 : 10,
        stemCells: zoneType === ZoneType.Lymphatic ? 5 : 2
    },
    unitCount: 0,
    isBorderZone: true,
    isControlled: false,
    connectedZones: []
});

export const createInitialGameState = (): GameState => {
    // Create starting zones based on Bio Commander concept
    const bloodstreamZone = createInitialZone(1, ZoneType.Circulatory);
    const lymphNodeZone = createInitialZone(2, ZoneType.Lymphatic);
    const infectedTissueZone = createInitialZone(3, ZoneType.Tissue);
    
    // Connect zones
    bloodstreamZone.connectedZones = [2, 3];
    lymphNodeZone.connectedZones = [1];
    infectedTissueZone.connectedZones = [1];
    
    // Add some initial tissue and pathogens
    infectedTissueZone.grid[8][8] = { unitType: UnitType.Bacteria, owner: "neutral", health: 100 };
    infectedTissueZone.grid[7][7] = { unitType: UnitType.Virus, owner: "2", health: 80 };
    infectedTissueZone.grid[9][9] = { unitType: UnitType.Bacteria, owner: "2", health: 80 };
    
    // Add some initial immune presence
    bloodstreamZone.grid[4][4] = { unitType: UnitType.TCell, owner: "1", health: 100 };
    lymphNodeZone.grid[8][8] = { unitType: UnitType.BCell, owner: "1", health: 100 };
    
    return {
        zones: [bloodstreamZone, lymphNodeZone, infectedTissueZone],
        currentPlayer: "1",
        turn: 1,
        globalResources: {
            player1: {
                energy: 50,
                antibodies: 10,
                nutrients: 30,
                stemCells: 5
            },
            player2: {
                energy: 40,
                antibodies: 5,
                nutrients: 20,
                stemCells: 3
            }
        },
        gamePhase: GamePhase.Deploy,
        selectedZone: 1
    };
};

export const canPlaceUnit = (
    zone: Zone, 
    row: number, 
    col: number, 
    unitType: UnitType,
    player: string,
    resources: PlayerResources
): { canPlace: boolean; reason?: string } => {
    // Check bounds
    if (row < 0 || row >= 16 || col < 0 || col >= 16) {
        return { canPlace: false, reason: "Out of bounds" };
    }
    
    // Check if cell is empty
    const cell = zone.grid[row][col];
    if (cell && cell.unitType !== undefined) {
        return { canPlace: false, reason: "Cell occupied" };
    }
    
    // Check unit type restrictions based on faction
    const isPathogenUnit = [UnitType.Virus, UnitType.Bacteria, UnitType.Fungus, UnitType.Parasite, UnitType.CancerCell, UnitType.Toxin].includes(unitType);
    const isImmuneUnit = [UnitType.TCell, UnitType.BCell, UnitType.Macrophage, UnitType.NeutrophilCell, UnitType.DendriticCell, UnitType.NaturalKillerCell].includes(unitType);
    
    if (player === "1" && !isImmuneUnit) {
        return { canPlace: false, reason: "Player 1 can only place immune cells" };
    }
    
    if (player === "2" && !isPathogenUnit) {
        return { canPlace: false, reason: "Player 2 can only place pathogens" };
    }
    
    // Check resource costs (simplified)
    const energyCost = getUnitCost(unitType).energy;
    if (resources.energy < energyCost) {
        return { canPlace: false, reason: "Insufficient energy" };
    }
    
    return { canPlace: true };
};

export const getUnitCost = (unitType: UnitType): { energy: number; antibodies?: number; nutrients?: number } => {
    const unitData = UNIT_DATA[unitType];
    if (unitData) {
        return {
            energy: unitData.cost.energy,
            antibodies: unitData.cost.antibodies,
            nutrients: unitData.cost.nutrients
        };
    }
    return { energy: 0 };
};

export const placeUnit = (
    gameState: GameState,
    zoneId: number,
    row: number,
    col: number,
    unitType: UnitType
): GameState => {
    const newState = { ...gameState };
    const zone = newState.zones.find(z => z.zoneId === zoneId);
    
    if (!zone) return gameState;
    
    const player = newState.currentPlayer;
    const resources = newState.globalResources[`player${player}` as keyof typeof newState.globalResources];
    
    const { canPlace } = canPlaceUnit(zone, row, col, unitType, player, resources);
    if (!canPlace) return gameState;
    
    // Place the unit
    zone.grid[row][col] = {
        unitType: unitType,
        owner: player,
        health: getUnitHealth(unitType)
    };
    
    // Deduct resources
    const cost = getUnitCost(unitType);
    resources.energy -= cost.energy;
    if (cost.antibodies) resources.antibodies -= cost.antibodies;
    if (cost.nutrients) resources.nutrients -= cost.nutrients;
    
    return newState;
};

export const getUnitHealth = (unitType: UnitType): number => {
    const unitData = UNIT_DATA[unitType];
    return unitData ? unitData.stats.maxHealth : 50;
};

export const switchPlayer = (gameState: GameState): GameState => {
    return {
        ...gameState,
        currentPlayer: gameState.currentPlayer === "1" ? "2" : "1",
        turn: gameState.currentPlayer === "2" ? gameState.turn + 1 : gameState.turn
    };
};

export const generateResources = (gameState: GameState): GameState => {
    const newState = { ...gameState };
    
    // Generate resources based on controlled zones and units
    newState.zones.forEach(zone => {
        const player1Units = zone.grid.flat().filter(cell => cell && cell.owner === "1").length;
        const player2Units = zone.grid.flat().filter(cell => cell && cell.owner === "2").length;
        
        if (player1Units > player2Units) {
            // Player 1 controls this zone
            newState.globalResources.player1.energy += zone.resources.energy;
            newState.globalResources.player1.antibodies += zone.resources.antibodies;
            newState.globalResources.player1.nutrients += zone.resources.nutrients;
        } else if (player2Units > player1Units) {
            // Player 2 controls this zone
            newState.globalResources.player2.energy += zone.resources.energy;
            newState.globalResources.player2.antibodies += zone.resources.antibodies;
            newState.globalResources.player2.nutrients += zone.resources.nutrients;
        }
    });
    
    return newState;
};

export interface VictoryCondition {
    type: 'zone_control' | 'elimination' | 'organ_capture' | 'infection_spread';
    description: string;
    checkVictory: (gameState: GameState) => { winner?: string; reason?: string };
}

export const checkVictoryConditions = (gameState: GameState): { winner?: string; reason?: string } => {
    // Zone control victory - control majority of zones
    const zoneControl = gameState.zones.map(zone => {
        const cells = zone.grid.flat();
        const player1Units = cells.filter(cell => cell && cell.owner === "1").length;
        const player2Units = cells.filter(cell => cell && cell.owner === "2").length;
        
        if (player1Units > player2Units) return "1";
        if (player2Units > player1Units) return "2";
        return "neutral";
    });
    
    const player1Zones = zoneControl.filter(control => control === "1").length;
    const player2Zones = zoneControl.filter(control => control === "2").length;
    const totalZones = gameState.zones.length;
    
    if (player1Zones > totalZones / 2) {
        return { winner: "1", reason: "Immune system has secured the majority of zones!" };
    }
    
    if (player2Zones > totalZones / 2) {
        return { winner: "2", reason: "Pathogens have infected the majority of zones!" };
    }
    
    // Elimination victory - opponent has no units
    const allCells = gameState.zones.flatMap(zone => zone.grid.flat());
    const player1Units = allCells.filter(cell => cell && cell.owner === "1").length;
    const player2Units = allCells.filter(cell => cell && cell.owner === "2").length;
    
    if (player1Units === 0) {
        return { winner: "2", reason: "All immune defenses have been eliminated!" };
    }
    
    if (player2Units === 0) {
        return { winner: "1", reason: "All pathogens have been eliminated!" };
    }
    
    // Resource depletion victory
    if (gameState.globalResources.player1.energy <= 0 && 
        gameState.globalResources.player1.nutrients <= 0) {
        return { winner: "2", reason: "Immune system has run out of resources!" };
    }
    
    if (gameState.globalResources.player2.energy <= 0 && 
        gameState.globalResources.player2.nutrients <= 0) {
        return { winner: "1", reason: "Pathogens have been starved of resources!" };
    }
    
    return {}; // No victory yet
};
