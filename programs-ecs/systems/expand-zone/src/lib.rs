use bolt_lang::*;
use grid::{Zone, ZoneType};
use players::{Player, Faction};
use game::{Game, GameState};

declare_id!("EXPa111111111111111111111111111111111111111");

#[error_code]
pub enum ExpandZoneError {
    #[msg("Player is not in the game.")]
    NotInGame,
    #[msg("Game is not active.")]
    NotActive,
    #[msg("Not player's turn.")]
    NotPlayersTurn,
    #[msg("Insufficient resources.")]
    InsufficientResources,
    #[msg("Zone already controlled.")]
    ZoneAlreadyControlled,
    #[msg("Zone not adjacent.")]
    ZoneNotAdjacent,
    #[msg("Invalid zone type.")]
    InvalidZoneType,
    #[msg("Expansion not possible.")]
    ExpansionNotPossible,
    #[msg("Max zones reached.")]
    MaxZonesReached,
}

#[system]
pub mod expand_zone {

    pub fn execute(ctx: Context<Components>, args: Args) -> Result<Components> {
        let game = &mut ctx.accounts.game;
        let player = &mut ctx.accounts.player;
        let source_zone = &ctx.accounts.source_zone;
        let target_zone = &mut ctx.accounts.target_zone;
        let authority = *ctx.accounts.authority.key;

        // Validate player is in game and it's their turn
        require!(game.is_player_turn(&authority), ExpandZoneError::NotPlayersTurn);
        require!(game.is_game_active(), ExpandZoneError::NotActive);
        require!(player.player_key == authority, ExpandZoneError::NotInGame);

        match args.expansion_type {
            ExpansionType::InfectionSpread => {
                infection_spread_expansion(game, player, source_zone, target_zone)?;
            }
            ExpansionType::ImmuneResponse => {
                immune_response_expansion(game, player, source_zone, target_zone)?;
            }
            ExpansionType::CreateNewZone => {
                create_new_zone(game, player, target_zone, args.new_zone_type)?;
            }
            ExpansionType::ConquerZone => {
                conquer_zone(game, player, source_zone, target_zone)?;
            }
        }

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub game: Game,
        pub player: Player,
        pub source_zone: Zone,
        pub target_zone: Zone,
    }

    #[arguments]
    struct Args {
        expansion_type: ExpansionType,
        new_zone_type: u8, // Used for CreateNewZone
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum ExpansionType {
    InfectionSpread,    // Pathogens spreading to adjacent zones
    ImmuneResponse,     // Immune system establishing staging areas
    CreateNewZone,      // Player-initiated zone creation
    ConquerZone,        // Taking control of existing zone
}

fn infection_spread_expansion(
    game: &mut Game,
    player: &mut Player,
    source_zone: &Zone,
    target_zone: &mut Zone,
) -> Result<()> {
    // Only pathogen players can use infection spread
    require!(
        matches!(player.faction, Faction::Pathogen),
        ExpandZoneError::ExpansionNotPossible
    );

    // Check if source zone is controlled by player
    require!(source_zone.owner == player.player_key, ExpandZoneError::NotInGame);

    // Check if zones are adjacent
    require!(
        is_adjacent_zone(source_zone, target_zone),
        ExpandZoneError::ZoneNotAdjacent
    );

    // Check expansion cost
    let expansion_cost = calculate_infection_spread_cost(source_zone, target_zone);
    require!(
        player.can_afford(expansion_cost.0, expansion_cost.1, expansion_cost.2, expansion_cost.3),
        ExpandZoneError::InsufficientResources
    );

    // Deduct resources
    player.spend_resources(expansion_cost.0, expansion_cost.1, expansion_cost.2, expansion_cost.3);

    // Spread infection to target zone
    if target_zone.owner == Pubkey::default() {
        // Unclaimed zone - take control
        target_zone.owner = player.player_key;
        target_zone.is_controlled = true;
        target_zone.zone_type = ZoneType::Tissue; // Infected tissue
        player.controlled_zones += 1;
    } else {
        // Enemy zone - start infection process
        target_zone.energy = target_zone.energy.saturating_sub(50);
        target_zone.nutrients = target_zone.nutrients.saturating_sub(30);
    }

    // Update game infection level
    game.update_infection_level(5);

    Ok(())
}

fn immune_response_expansion(
    game: &mut Game,
    player: &mut Player,
    source_zone: &Zone,
    target_zone: &mut Zone,
) -> Result<()> {
    // Only immune system players can use immune response
    require!(
        matches!(player.faction, Faction::ImmuneSystem),
        ExpandZoneError::ExpansionNotPossible
    );

    // Check if source zone is controlled by player
    require!(source_zone.owner == player.player_key, ExpandZoneError::NotInGame);

    // Check if zones are adjacent
    require!(
        is_adjacent_zone(source_zone, target_zone),
        ExpandZoneError::ZoneNotAdjacent
    );

    // Check expansion cost
    let expansion_cost = calculate_immune_response_cost(source_zone, target_zone);
    require!(
        player.can_afford(expansion_cost.0, expansion_cost.1, expansion_cost.2, expansion_cost.3),
        ExpandZoneError::InsufficientResources
    );

    // Deduct resources
    player.spend_resources(expansion_cost.0, expansion_cost.1, expansion_cost.2, expansion_cost.3);

    // Establish immune staging area
    if target_zone.owner == Pubkey::default() {
        // Unclaimed zone - take control
        target_zone.owner = player.player_key;
        target_zone.is_controlled = true;
        target_zone.zone_type = ZoneType::Lymphatic; // Immune staging area
        player.controlled_zones += 1;
    } else {
        // Enemy zone - boost immune defenses
        target_zone.antibodies = (target_zone.antibodies + 100).min(1000);
        target_zone.energy = (target_zone.energy + 50).min(1000);
    }

    // Update game immune response level
    game.update_immune_response_level(5);

    Ok(())
}

fn create_new_zone(
    game: &mut Game,
    player: &mut Player,
    target_zone: &mut Zone,
    zone_type_index: u8,
) -> Result<()> {
    // Check if we've reached max zones
    require!(game.total_zones < 64, ExpandZoneError::MaxZonesReached);

    // Check if zone is unclaimed
    require!(target_zone.owner == Pubkey::default(), ExpandZoneError::ZoneAlreadyControlled);

    // Get zone type
    let zone_type = match zone_type_index {
        0 => ZoneType::Circulatory,
        1 => ZoneType::Tissue,
        2 => ZoneType::Lymphatic,
        3 => ZoneType::Barrier,
        4 => ZoneType::Organ,
        _ => return Err(ExpandZoneError::InvalidZoneType.into()),
    };

    // Check creation cost
    let creation_cost = calculate_zone_creation_cost(&zone_type, player.faction);
    require!(
        player.can_afford(creation_cost.0, creation_cost.1, creation_cost.2, creation_cost.3),
        ExpandZoneError::InsufficientResources
    );

    // Deduct resources
    player.spend_resources(creation_cost.0, creation_cost.1, creation_cost.2, creation_cost.3);

    // Create new zone
    target_zone.zone_id = game.total_zones;
    target_zone.zone_type = zone_type;
    target_zone.owner = player.player_key;
    target_zone.is_controlled = true;
    target_zone.is_border_zone = true; // New zones are typically border zones

    // Set initial resources based on zone type
    let (energy, antibodies, stem_cells, nutrients) = zone_type.get_resource_generation();
    target_zone.energy = energy * 5; // Start with 5 turns worth of resources
    target_zone.antibodies = antibodies * 5;
    target_zone.stem_cells = stem_cells * 5;
    target_zone.nutrients = nutrients * 5;

    // Update game and player state
    game.total_zones += 1;
    player.controlled_zones += 1;

    Ok(())
}

fn conquer_zone(
    game: &mut Game,
    player: &mut Player,
    source_zone: &Zone,
    target_zone: &mut Zone,
) -> Result<()> {
    // Check if source zone is controlled by player
    require!(source_zone.owner == player.player_key, ExpandZoneError::NotInGame);

    // Check if target zone is controlled by enemy
    require!(
        target_zone.owner != Pubkey::default() && target_zone.owner != player.player_key,
        ExpandZoneError::ZoneAlreadyControlled
    );

    // Check if zones are adjacent
    require!(
        is_adjacent_zone(source_zone, target_zone),
        ExpandZoneError::ZoneNotAdjacent
    );

    // Check conquest cost
    let conquest_cost = calculate_conquest_cost(source_zone, target_zone);
    require!(
        player.can_afford(conquest_cost.0, conquest_cost.1, conquest_cost.2, conquest_cost.3),
        ExpandZoneError::InsufficientResources
    );

    // Deduct resources
    player.spend_resources(conquest_cost.0, conquest_cost.1, conquest_cost.2, conquest_cost.3);

    // Conquer the zone
    let old_owner = target_zone.owner;
    target_zone.owner = player.player_key;
    target_zone.is_controlled = true;

    // Update player counts
    player.controlled_zones += 1;

    // Reduce resources in conquered zone (battle damage)
    target_zone.energy = target_zone.energy / 2;
    target_zone.nutrients = target_zone.nutrients / 2;
    target_zone.unit_count = target_zone.unit_count / 2; // Some units lost in battle

    // Update infection/immune levels based on conquest
    match player.faction {
        Faction::Pathogen => game.update_infection_level(3),
        Faction::ImmuneSystem => game.update_immune_response_level(3),
    }

    Ok(())
}

fn is_adjacent_zone(zone1: &Zone, zone2: &Zone) -> bool {
    let dx = (zone1.x as i16 - zone2.x as i16).abs();
    let dy = (zone1.y as i16 - zone2.y as i16).abs();
    (dx == 1 && dy == 0) || (dx == 0 && dy == 1)
}

fn calculate_infection_spread_cost(source: &Zone, target: &Zone) -> (u64, u64, u64, u64) {
    let base_cost = 100u64;
    let zone_resistance = match target.zone_type {
        ZoneType::Barrier => 3,
        ZoneType::Lymphatic => 2,
        _ => 1,
    };
    
    let adjusted_cost = base_cost * zone_resistance;
    (adjusted_cost * 2, 0, 0, adjusted_cost) // High energy and nutrient cost
}

fn calculate_immune_response_cost(source: &Zone, target: &Zone) -> (u64, u64, u64, u64) {
    let base_cost = 80u64;
    let zone_difficulty = match target.zone_type {
        ZoneType::Tissue => 2, // Harder to establish in infected tissue
        ZoneType::Organ => 3,  // Very difficult in organs
        _ => 1,
    };
    
    let adjusted_cost = base_cost * zone_difficulty;
    (adjusted_cost, adjusted_cost * 2, adjusted_cost / 4, adjusted_cost / 2)
}

fn calculate_zone_creation_cost(zone_type: &ZoneType, faction: Faction) -> (u64, u64, u64, u64) {
    let base_cost = match zone_type {
        ZoneType::Circulatory => 200,
        ZoneType::Tissue => 150,
        ZoneType::Lymphatic => 300,
        ZoneType::Barrier => 400,
        ZoneType::Organ => 500,
    };

    let faction_modifier = match faction {
        Faction::ImmuneSystem => 1.0,
        Faction::Pathogen => 1.2, // Slightly more expensive for pathogens
    };

    let adjusted_cost = (base_cost as f64 * faction_modifier) as u64;
    (adjusted_cost, adjusted_cost / 2, adjusted_cost / 10, adjusted_cost / 3)
}

fn calculate_conquest_cost(source: &Zone, target: &Zone) -> (u64, u64, u64, u64) {
    let base_cost = 250u64;
    let defense_multiplier = match target.zone_type {
        ZoneType::Barrier => 2,
        ZoneType::Organ => 3,
        ZoneType::Lymphatic => 2,
        _ => 1,
    };
    
    let adjusted_cost = base_cost * defense_multiplier;
    (adjusted_cost * 3, adjusted_cost, adjusted_cost / 5, adjusted_cost * 2)
}
