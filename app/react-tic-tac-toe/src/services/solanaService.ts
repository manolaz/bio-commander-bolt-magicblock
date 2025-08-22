import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY 
} from '@solana/web3.js';
import { 
  ApplySystem, 
  AddEntity, 
  InitializeComponent, 
  FindWorldPda, 
  FindComponentPda,
  anchor 
} from "@magicblock-labs/bolt-sdk";
import { BN, Program, Provider } from "@coral-xyz/anchor";
import { 
  UnitType, 
  ZoneType, 
  Faction, 
  ActionType, 
  PlayAction,
  Game,
  Player,
  Zone,
  Unit
} from '../types/bioCommander';

export class BioCommanderSolanaService {
  private connection: Connection;
  private provider: Provider;
  
  // Component Program IDs
  private readonly ZONE_COMPONENT = new PublicKey("9EoKMqQqrgRAxVED34q17e466RKme5sTUkuCqUGH4bij");
  private readonly PLAYER_COMPONENT = new PublicKey("HLzXXTbMUjemRSQr5LHjtZgBvqyieuhY8wE29xYzhZSX");
  private readonly UNIT_COMPONENT = new PublicKey("UNiT111111111111111111111111111111111111111");
  private readonly GAME_COMPONENT = new PublicKey("GAMe111111111111111111111111111111111111111");
  
  // System Program IDs
  private readonly JOIN_GAME = new PublicKey("7TsTc97MB21EKbh2RetcWsGWRJ4xuMkPKKD4DcMJ2Sms");
  private readonly PLAY = new PublicKey("EFLfG5icLgcUYwuSnuScoYptcrgh8WYLHx33M4wvTPFv");
  private readonly EXPAND_ZONE = new PublicKey("EXPa111111111111111111111111111111111111111");
  
  private readonly WORLD_INSTANCE_ID = 1721;
  
  // Component clients
  private zoneClient: Program | null = null;
  private playerClient: Program | null = null;
  private unitClient: Program | null = null;
  private gameClient: Program | null = null;

  constructor(connection: Connection, provider: Provider) {
    this.connection = connection;
    this.provider = provider;
    anchor.setProvider(provider);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize component clients
      this.zoneClient = await this.getComponentClient(this.ZONE_COMPONENT);
      this.playerClient = await this.getComponentClient(this.PLAYER_COMPONENT);
      this.unitClient = await this.getComponentClient(this.UNIT_COMPONENT);
      this.gameClient = await this.getComponentClient(this.GAME_COMPONENT);
    } catch (error) {
      console.error("Failed to initialize Solana service:", error);
      throw error;
    }
  }

  private async getComponentClient(componentId: PublicKey): Promise<Program> {
    const idl = await Program.fetchIdl(componentId, this.provider);
    if (!idl) throw new Error(`IDL not found for component ${componentId.toBase58()}`);
    return new Program(idl, this.provider);
  }

  async createNewGame(playerPublicKey: PublicKey): Promise<{
    transaction: Transaction;
    entityPda: PublicKey;
    gameId: PublicKey;
  }> {
    const worldPda = FindWorldPda({ worldId: new BN(this.WORLD_INSTANCE_ID) });
    
    // Create the entity
    const addEntity = await AddEntity({
      payer: playerPublicKey,
      world: worldPda,
      connection: this.connection,
    });
    
    const transaction = addEntity.transaction;
    const entityPda = addEntity.entityPda;

    // Initialize all components
    const initGameIx = (await InitializeComponent({
      payer: playerPublicKey,
      entity: entityPda,
      componentId: this.GAME_COMPONENT,
    })).instruction;

    const initZoneIx = (await InitializeComponent({
      payer: playerPublicKey,
      entity: entityPda,
      componentId: this.ZONE_COMPONENT,
    })).instruction;

    const initPlayerIx = (await InitializeComponent({
      payer: playerPublicKey,
      entity: entityPda,
      componentId: this.PLAYER_COMPONENT,
    })).instruction;

    transaction.add(initGameIx);
    transaction.add(initZoneIx);
    transaction.add(initPlayerIx);

    return {
      transaction,
      entityPda,
      gameId: entityPda
    };
  }

  async joinGame(
    playerPublicKey: PublicKey, 
    gameId: PublicKey, 
    faction: Faction
  ): Promise<Transaction> {
    const worldPda = FindWorldPda({ worldId: new BN(this.WORLD_INSTANCE_ID) });
    
    const applySystem = await ApplySystem({
      authority: playerPublicKey,
      systemId: this.JOIN_GAME,
      world: worldPda,
      entities: [
        {
          entity: gameId,
          components: [
            { componentId: this.GAME_COMPONENT },
            { componentId: this.PLAYER_COMPONENT },
            { componentId: this.ZONE_COMPONENT }
          ]
        }
      ],
      args: {
        faction: faction === Faction.ImmuneSystem ? 0 : 1
      }
    });

    return applySystem.transaction;
  }

  async playAction(
    playerPublicKey: PublicKey,
    gameId: PublicKey,
    action: PlayAction
  ): Promise<Transaction> {
    const worldPda = FindWorldPda({ worldId: new BN(this.WORLD_INSTANCE_ID) });
    
    const components = [
      { componentId: this.GAME_COMPONENT },
      { componentId: this.PLAYER_COMPONENT },
      { componentId: this.ZONE_COMPONENT }
    ];
    
    // Add unit component if needed for unit actions
    if (action.action === ActionType.MoveUnit || 
        action.action === ActionType.AttackPosition || 
        action.action === ActionType.UseSpecialAbility) {
      components.push({ componentId: this.UNIT_COMPONENT });
    }

    const applySystem = await ApplySystem({
      authority: playerPublicKey,
      systemId: this.PLAY,
      world: worldPda,
      entities: [
        {
          entity: gameId,
          components
        }
      ],
      args: {
        action: this.actionTypeToNumber(action.action),
        x: action.x,
        y: action.y,
        unit_type: action.unitType,
        ability_index: action.abilityIndex
      }
    });

    return applySystem.transaction;
  }

  async expandZone(
    playerPublicKey: PublicKey,
    gameId: PublicKey,
    expansionType: number,
    newZoneType?: ZoneType
  ): Promise<Transaction> {
    const worldPda = FindWorldPda({ worldId: new BN(this.WORLD_INSTANCE_ID) });
    
    const applySystem = await ApplySystem({
      authority: playerPublicKey,
      systemId: this.EXPAND_ZONE,
      world: worldPda,
      entities: [
        {
          entity: gameId,
          components: [
            { componentId: this.GAME_COMPONENT },
            { componentId: this.PLAYER_COMPONENT },
            { componentId: this.ZONE_COMPONENT }
          ]
        }
      ],
      args: {
        expansion_type: expansionType,
        new_zone_type: newZoneType ? this.zoneTypeToNumber(newZoneType) : 0
      }
    });

    return applySystem.transaction;
  }

  // Subscribe to game state changes
  async subscribeToGame(
    gameId: PublicKey,
    onGameUpdate: (game: Game) => void,
    onPlayerUpdate: (player: Player) => void,
    onZoneUpdate: (zone: Zone) => void
  ): Promise<{
    gameSubscriptionId: number;
    playerSubscriptionId: number;
    zoneSubscriptionId: number;
  }> {
    const gameComponent = FindComponentPda({ 
      componentId: this.GAME_COMPONENT, 
      entity: gameId 
    });
    const playerComponent = FindComponentPda({ 
      componentId: this.PLAYER_COMPONENT, 
      entity: gameId 
    });
    const zoneComponent = FindComponentPda({ 
      componentId: this.ZONE_COMPONENT, 
      entity: gameId 
    });

    const gameSubscriptionId = this.connection.onAccountChange(
      gameComponent,
      (accountInfo) => {
        if (this.gameClient) {
          const parsedData = this.gameClient.coder.accounts.decode("game", accountInfo.data);
          onGameUpdate(this.parseGameData(parsedData));
        }
      },
      'processed'
    );

    const playerSubscriptionId = this.connection.onAccountChange(
      playerComponent,
      (accountInfo) => {
        if (this.playerClient) {
          const parsedData = this.playerClient.coder.accounts.decode("player", accountInfo.data);
          onPlayerUpdate(this.parsePlayerData(parsedData));
        }
      },
      'processed'
    );

    const zoneSubscriptionId = this.connection.onAccountChange(
      zoneComponent,
      (accountInfo) => {
        if (this.zoneClient) {
          const parsedData = this.zoneClient.coder.accounts.decode("zone", accountInfo.data);
          onZoneUpdate(this.parseZoneData(parsedData));
        }
      },
      'processed'
    );

    return { gameSubscriptionId, playerSubscriptionId, zoneSubscriptionId };
  }

  async fetchGameState(gameId: PublicKey): Promise<{
    game?: Game;
    player?: Player;
    zone?: Zone;
  }> {
    const gameComponent = FindComponentPda({ 
      componentId: this.GAME_COMPONENT, 
      entity: gameId 
    });
    const playerComponent = FindComponentPda({ 
      componentId: this.PLAYER_COMPONENT, 
      entity: gameId 
    });
    const zoneComponent = FindComponentPda({ 
      componentId: this.ZONE_COMPONENT, 
      entity: gameId 
    });

    try {
      const [gameData, playerData, zoneData] = await Promise.allSettled([
        this.gameClient?.account.game.fetch(gameComponent, "processed"),
        this.playerClient?.account.player.fetch(playerComponent, "processed"),
        this.zoneClient?.account.zone.fetch(zoneComponent, "processed")
      ]);

      return {
        game: gameData.status === 'fulfilled' ? this.parseGameData(gameData.value) : undefined,
        player: playerData.status === 'fulfilled' ? this.parsePlayerData(playerData.value) : undefined,
        zone: zoneData.status === 'fulfilled' ? this.parseZoneData(zoneData.value) : undefined
      };
    } catch (error) {
      console.error("Failed to fetch game state:", error);
      return {};
    }
  }

  // Helper methods to convert between frontend and Solana program types
  private actionTypeToNumber(action: ActionType): number {
    switch (action) {
      case ActionType.SpawnUnit: return 0;
      case ActionType.MoveUnit: return 1;
      case ActionType.AttackPosition: return 2;
      case ActionType.UseSpecialAbility: return 3;
      case ActionType.EndTurn: return 4;
      default: return 0;
    }
  }

  private zoneTypeToNumber(zoneType: ZoneType): number {
    switch (zoneType) {
      case ZoneType.Circulatory: return 0;
      case ZoneType.Tissue: return 1;
      case ZoneType.Lymphatic: return 2;
      case ZoneType.Barrier: return 3;
      case ZoneType.Organ: return 4;
      default: return 1;
    }
  }

  private unitTypeToNumber(unitType: UnitType): number {
    const unitTypes = Object.values(UnitType);
    return unitTypes.indexOf(unitType);
  }

  private parseGameData(data: any): Game {
    return {
      gameId: data.gameId,
      player1: data.player1.toBase58(),
      player2: data.player2.toBase58(),
      currentTurn: data.currentTurn,
      turnNumber: data.turnNumber,
      mapWidth: data.mapWidth,
      mapHeight: data.mapHeight,
      totalZones: data.totalZones,
      gameState: this.parseGameState(data.gameState),
      winner: data.winner.toBase58(),
      infectionLevel: data.infectionLevel,
      immuneResponseLevel: data.immuneResponseLevel,
      turnTimeLimit: data.turnTimeLimit,
      lastTurnTimestamp: data.lastTurnTimestamp
    };
  }

  private parsePlayerData(data: any): Player {
    return {
      playerId: data.playerId,
      playerKey: data.playerKey.toBase58(),
      faction: data.faction.immuneSystem ? Faction.ImmuneSystem : Faction.Pathogen,
      resources: {
        energy: data.energyReserves,
        antibodies: data.antibodyReserves,
        stemCells: data.stemCellReserves,
        nutrients: data.nutrientReserves
      },
      controlledZones: data.controlledZones,
      totalUnits: data.totalUnits,
      researchPoints: data.researchPoints,
      unlockedUnits: data.unlockedUnits
    };
  }

  private parseZoneData(data: any): Zone {
    return {
      zoneId: data.zoneId,
      zoneType: this.parseZoneType(data.zoneType),
      x: data.x,
      y: data.y,
      owner: data.owner.toBase58(),
      grid: this.parseGrid(data.grid),
      resources: {
        energy: data.energy,
        antibodies: data.antibodies,
        stemCells: data.stemCells,
        nutrients: data.nutrients
      },
      unitCount: data.unitCount,
      isBorderZone: data.isBorderZone,
      isControlled: data.isControlled,
      connectedZones: data.connectedZones
    };
  }

  private parseGameState(state: any): import('../types/bioCommander').GameState {
    if (state.waitingForPlayers) return import('../types/bioCommander').GameState.WaitingForPlayers;
    if (state.active) return import('../types/bioCommander').GameState.Active;
    if (state.paused) return import('../types/bioCommander').GameState.Paused;
    return import('../types/bioCommander').GameState.Finished;
  }

  private parseZoneType(zoneType: any): ZoneType {
    if (zoneType.circulatory) return ZoneType.Circulatory;
    if (zoneType.tissue) return ZoneType.Tissue;
    if (zoneType.lymphatic) return ZoneType.Lymphatic;
    if (zoneType.barrier) return ZoneType.Barrier;
    if (zoneType.organ) return ZoneType.Organ;
    return ZoneType.Tissue;
  }

  private parseGrid(grid: any[][]): (import('../types/bioCommander').Cell | null)[][] {
    return grid.map(row => 
      row.map(cell => {
        if (!cell) return null;
        if (cell.immuneCell) {
          return {
            unitId: cell.immuneCell.unitId,
            health: cell.immuneCell.health,
            unitType: UnitType.TCell, // This would need proper parsing
            owner: "1" // This would need proper parsing
          };
        }
        if (cell.pathogen) {
          return {
            unitId: cell.pathogen.unitId,
            health: cell.pathogen.health,
            unitType: UnitType.Virus, // This would need proper parsing
            owner: "2" // This would need proper parsing
          };
        }
        return null;
      })
    );
  }

  // Send transaction to the network
  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const signature = await this.provider.sendAndConfirm(transaction);
      return signature;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  // Confirm transaction
  async confirmTransaction(signature: string): Promise<void> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Failed to confirm transaction:', error);
      throw error;
    }
  }

  // Expand zone with different expansion types
  async expandZone(
    gameId: PublicKey,
    playerFaction: Faction,
    expansionType: 'CreateNewZone' | 'InfectionSpread' | 'ImmuneResponse' | 'ConquerZone',
    newZoneType?: ZoneType,
    sourceZoneId?: number,
    targetZoneId?: number
  ): Promise<Transaction> {
    const worldPda = FindWorldPda({ worldId: new BN(this.WORLD_INSTANCE_ID) });
    
    const applySystem = await ApplySystem({
      authority: this.provider.wallet.publicKey!,
      systemId: this.EXPAND_ZONE,
      world: worldPda,
      entities: [
        {
          entity: gameId,
          components: [
            { componentId: this.GAME_COMPONENT },
            { componentId: this.PLAYER_COMPONENT },
            { componentId: this.ZONE_COMPONENT }
          ]
        }
      ],
      args: {
        expansion_type: this.expansionTypeToNumber(expansionType),
        new_zone_type: newZoneType ? this.zoneTypeToNumber(newZoneType) : 0,
        source_zone_id: sourceZoneId || 0,
        target_zone_id: targetZoneId || 0
      }
    });

    return applySystem.transaction;
  }

  // Convert expansion type to number for Solana program
  private expansionTypeToNumber(expansionType: string): number {
    switch (expansionType) {
      case 'CreateNewZone': return 0;
      case 'InfectionSpread': return 1;
      case 'ImmuneResponse': return 2;
      case 'ConquerZone': return 3;
      default: return 0;
    }
  }

  // Convert zone type to number for Solana program
  private zoneTypeToNumber(zoneType: ZoneType): number {
    switch (zoneType) {
      case ZoneType.Circulatory: return 0;
      case ZoneType.Tissue: return 1;
      case ZoneType.Lymphatic: return 2;
      case ZoneType.Barrier: return 3;
      case ZoneType.Organ: return 4;
      default: return 1;
    }
  }
}
