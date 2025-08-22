import { Zone, ZoneType, Cell } from '../types/bioCommander';

export interface GameState {
    zones: Zone[];
    currentPlayer: string;
    turn: number;
    globalResources: {
        player1: PlayerResources;
        player2: PlayerResources;
    };
    gamePhase: GamePhase;
    selectedZone: string | null;
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
    type: CellType.Empty
});

export const createEmptyGrid = (): Cell[][] => {
    return Array(16).fill(null).map(() => 
        Array(16).fill(null).map(() => createEmptyCell())
    );
};

export const createInitialZone = (id: string, type: ZoneType, name: string): Zone => ({
    id,
    type,
    name,
    grid: createEmptyGrid(),
    connections: [],
    resources: {
        energy: type === ZoneType.Circulatory ? 20 : 10,
        antibodies: type === ZoneType.Lymphatic ? 15 : 5,
        nutrients: type === ZoneType.Tissue ? 25 : 10
    }
});

export const createInitialGameState = (): GameState => {
    // Create starting zones based on Bio Commander concept
    const bloodstreamZone = createInitialZone("bloodstream", ZoneType.Circulatory, "Bloodstream");
    const lymphNodeZone = createInitialZone("lymph-node", ZoneType.Lymphatic, "Lymph Node");
    const infectedTissueZone = createInitialZone("infected-tissue", ZoneType.Tissue, "Infected Tissue");
    
    // Connect zones
    bloodstreamZone.connections = ["lymph-node", "infected-tissue"];
    lymphNodeZone.connections = ["bloodstream"];
    infectedTissueZone.connections = ["bloodstream"];
    
    // Add some initial tissue and pathogens
    infectedTissueZone.grid[8][8] = { type: CellType.Tissue, health: 100 };
    infectedTissueZone.grid[7][7] = { type: CellType.Pathogen, owner: "2", health: 80 };
    infectedTissueZone.grid[9][9] = { type: CellType.Pathogen, owner: "2", health: 80 };
    
    // Add some initial immune presence
    bloodstreamZone.grid[4][4] = { type: CellType.ImmuneCell, owner: "1", health: 100 };
    lymphNodeZone.grid[8][8] = { type: CellType.ImmuneCell, owner: "1", health: 100 };
    
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
        selectedZone: "bloodstream"
    };
};

export const canPlaceUnit = (
    zone: Zone, 
    row: number, 
    col: number, 
    unitType: CellType,
    player: string,
    resources: PlayerResources
): { canPlace: boolean; reason?: string } => {
    // Check bounds
    if (row < 0 || row >= 16 || col < 0 || col >= 16) {
        return { canPlace: false, reason: "Out of bounds" };
    }
    
    // Check if cell is empty
    if (zone.grid[row][col].type !== CellType.Empty) {
        return { canPlace: false, reason: "Cell occupied" };
    }
    
    // Check unit type restrictions
    if (player === "1" && unitType === CellType.Pathogen) {
        return { canPlace: false, reason: "Cannot place enemy units" };
    }
    
    if (player === "2" && unitType !== CellType.Pathogen) {
        return { canPlace: false, reason: "Can only place pathogens" };
    }
    
    // Check resource costs (simplified)
    const energyCost = getUnitCost(unitType).energy;
    if (resources.energy < energyCost) {
        return { canPlace: false, reason: "Insufficient energy" };
    }
    
    return { canPlace: true };
};

export const getUnitCost = (unitType: CellType): { energy: number; antibodies?: number; nutrients?: number } => {
    switch (unitType) {
        case CellType.ImmuneCell:
            return { energy: 10, nutrients: 5 };
        case CellType.BloodCell:
            return { energy: 15, nutrients: 8 };
        case CellType.Antibody:
            return { energy: 5, antibodies: 1 };
        case CellType.Pathogen:
            return { energy: 8, nutrients: 3 };
        default:
            return { energy: 0 };
    }
};

export const placeUnit = (
    gameState: GameState,
    zoneId: string,
    row: number,
    col: number,
    unitType: CellType
): GameState => {
    const newState = { ...gameState };
    const zone = newState.zones.find(z => z.id === zoneId);
    
    if (!zone) return gameState;
    
    const player = newState.currentPlayer;
    const resources = newState.globalResources[`player${player}` as keyof typeof newState.globalResources];
    
    const { canPlace } = canPlaceUnit(zone, row, col, unitType, player, resources);
    if (!canPlace) return gameState;
    
    // Place the unit
    zone.grid[row][col] = {
        type: unitType,
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

export const getUnitHealth = (unitType: CellType): number => {
    switch (unitType) {
        case CellType.ImmuneCell:
            return 100;
        case CellType.BloodCell:
            return 80;
        case CellType.Antibody:
            return 60;
        case CellType.Pathogen:
            return 70;
        case CellType.Tissue:
            return 120;
        default:
            return 50;
    }
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
        const player1Units = zone.grid.flat().filter(cell => cell.owner === "1").length;
        const player2Units = zone.grid.flat().filter(cell => cell.owner === "2").length;
        
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
        const player1Units = cells.filter(cell => cell.owner === "1").length;
        const player2Units = cells.filter(cell => cell.owner === "2").length;
        
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
    const player1Units = allCells.filter(cell => cell.owner === "1").length;
    const player2Units = allCells.filter(cell => cell.owner === "2").length;
    
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
