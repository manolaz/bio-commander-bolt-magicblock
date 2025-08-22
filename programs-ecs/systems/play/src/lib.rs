use bolt_lang::*;
use grid::{Zone, ZoneType, CellContent};
use players::{Player, Faction};
use game::{Game, GameState};
use unit::{Unit, UnitType, SpecialAbility};

declare_id!("EFLfG5icLgcUYwuSnuScoYptcrgh8WYLHx33M4wvTPFv");

#[error_code]
pub enum BioCommanderError {
    #[msg("Player is not in the game.")]
    NotInGame,
    #[msg("Game is not active.")]
    NotActive,
    #[msg("Position out of bounds.")]
    PositionOutOfBounds,
    #[msg("Position already occupied.")]
    PositionOccupied,
    #[msg("Not player's turn.")]
    NotPlayersTurn,
    #[msg("Insufficient resources.")]
    InsufficientResources,
    #[msg("Unit not found.")]
    UnitNotFound,
    #[msg("Invalid move.")]
    InvalidMove,
    #[msg("Unit type not unlocked.")]
    UnitTypeNotUnlocked,
    #[msg("Zone not controlled.")]
    ZoneNotControlled,
    #[msg("Invalid action.")]
    InvalidAction,
}

#[system]
pub mod play {

    pub fn execute(ctx: Context<Components>, args: Args) -> Result<Components> {
        let game = &mut ctx.accounts.game;
        let player = &mut ctx.accounts.player;
        let zone = &mut ctx.accounts.zone;
        let authority = *ctx.accounts.authority.key;

        // Validate player is in game and it's their turn
        require!(game.is_player_turn(&authority), BioCommanderError::NotPlayersTurn);
        require!(game.is_game_active(), BioCommanderError::NotActive);
        require!(player.player_key == authority, BioCommanderError::NotInGame);

        match args.action {
            ActionType::SpawnUnit => {
                spawn_unit(player, zone, args.unit_type, args.x, args.y)?;
            }
            ActionType::MoveUnit => {
                if let Some(unit) = &mut ctx.accounts.unit {
                    move_unit(unit, zone, args.x, args.y)?;
                }
            }
            ActionType::AttackPosition => {
                if let Some(unit) = &ctx.accounts.unit {
                    attack_position(unit, zone, args.x, args.y)?;
                }
            }
            ActionType::UseSpecialAbility => {
                if let Some(unit) = &mut ctx.accounts.unit {
                    use_special_ability(unit, player, zone, args.ability_index)?;
                }
            }
            ActionType::EndTurn => {
                end_turn(game, player, zone)?;
            }
        }

        // Check win conditions
        check_win_conditions(game, player)?;

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub game: Game,
        pub player: Player,
        pub zone: Zone,
        pub unit: Option<Unit>,
    }

    #[arguments]
    struct Args {
        action: ActionType,
        x: u8,
        y: u8,
        unit_type: u8,
        ability_index: u8,
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum ActionType {
    SpawnUnit,
    MoveUnit,
    AttackPosition,
    UseSpecialAbility,
    EndTurn,
}

fn spawn_unit(player: &mut Player, zone: &mut Zone, unit_type_index: u8, x: u8, y: u8) -> Result<()> {
    // Validate position
    require!(x < 16 && y < 16, BioCommanderError::PositionOutOfBounds);
    require!(zone.grid[x as usize][y as usize].is_none(), BioCommanderError::PositionOccupied);
    
    // Validate zone ownership
    require!(zone.owner == player.player_key, BioCommanderError::ZoneNotControlled);
    
    // Validate unit type is unlocked
    require!(player.is_unit_unlocked(unit_type_index as usize), BioCommanderError::UnitTypeNotUnlocked);
    
    // Get unit type and costs
    let unit_type = match unit_type_index {
        0 => UnitType::TCell,
        1 => UnitType::BCell,
        2 => UnitType::Macrophage,
        3 => UnitType::NeutrophilCell,
        4 => UnitType::DendriticCell,
        5 => UnitType::NaturalKillerCell,
        6 => UnitType::Virus,
        7 => UnitType::Bacteria,
        8 => UnitType::Fungus,
        9 => UnitType::Parasite,
        10 => UnitType::CancerCell,
        11 => UnitType::Toxin,
        _ => return Err(BioCommanderError::InvalidAction.into()),
    };
    
    let (health, attack, defense, movement_range, energy_cost) = unit_type.get_base_stats();
    let spawn_cost = calculate_spawn_cost(&unit_type, &zone.zone_type);
    
    // Check if player can afford the unit
    require!(
        player.can_afford(spawn_cost.0, spawn_cost.1, spawn_cost.2, spawn_cost.3),
        BioCommanderError::InsufficientResources
    );
    
    // Deduct resources
    player.spend_resources(spawn_cost.0, spawn_cost.1, spawn_cost.2, spawn_cost.3);
    
    // Create unit on the grid
    let unit_id = zone.unit_count as u32 + (zone.zone_id * 1000); // Simple ID generation
    zone.grid[x as usize][y as usize] = Some(match unit_type.is_immune_cell() {
        true => CellContent::ImmuneCell { unit_id, health },
        false => CellContent::Pathogen { unit_id, health },
    });
    
    zone.unit_count += 1;
    player.total_units += 1;
    
    Ok(())
}

fn move_unit(unit: &mut Unit, zone: &mut Zone, new_x: u8, new_y: u8) -> Result<()> {
    // Validate new position
    require!(new_x < 16 && new_y < 16, BioCommanderError::PositionOutOfBounds);
    require!(zone.grid[new_x as usize][new_y as usize].is_none(), BioCommanderError::PositionOccupied);
    
    // Calculate movement distance
    let distance = ((new_x as i16 - unit.x as i16).abs() + (new_y as i16 - unit.y as i16).abs()) as u8;
    require!(distance <= unit.movement_range, BioCommanderError::InvalidMove);
    
    // Clear old position
    zone.grid[unit.x as usize][unit.y as usize] = None;
    
    // Set new position
    let cell_content = match unit.unit_type.is_immune_cell() {
        true => CellContent::ImmuneCell { unit_id: unit.unit_id, health: unit.health },
        false => CellContent::Pathogen { unit_id: unit.unit_id, health: unit.health },
    };
    zone.grid[new_x as usize][new_y as usize] = Some(cell_content);
    
    // Update unit position
    unit.x = new_x;
    unit.y = new_y;
    
    Ok(())
}

fn attack_position(unit: &Unit, zone: &mut Zone, target_x: u8, target_y: u8) -> Result<()> {
    // Validate target position
    require!(target_x < 16 && target_y < 16, BioCommanderError::PositionOutOfBounds);
    
    // Check if there's a target at the position
    if let Some(target) = &mut zone.grid[target_x as usize][target_y as usize] {
        match target {
            CellContent::ImmuneCell { health, .. } | CellContent::Pathogen { health, .. } => {
                // Calculate damage (simplified combat)
                let damage = unit.attack.saturating_sub(zone.zone_type.get_defense_bonus());
                *health = health.saturating_sub(damage);
                
                // Remove unit if health reaches 0
                if *health == 0 {
                    zone.grid[target_x as usize][target_y as usize] = None;
                    zone.unit_count = zone.unit_count.saturating_sub(1);
                }
            }
            _ => return Err(BioCommanderError::InvalidAction.into()),
        }
    }
    
    Ok(())
}

fn use_special_ability(unit: &mut Unit, player: &mut Player, zone: &mut Zone, ability_index: u8) -> Result<()> {
    if let Some(ability) = unit.special_abilities.get(ability_index as usize).and_then(|a| *a) {
        match ability {
            SpecialAbility::AntibodyProduction => {
                player.add_resources(0, 50, 0, 0);
            }
            SpecialAbility::Phagocytosis => {
                // Heal unit and gain resources
                unit.health = (unit.health + 20).min(unit.max_health);
                player.add_resources(10, 0, 0, 5);
            }
            SpecialAbility::Replication => {
                // Spawn a new unit nearby (simplified)
                zone.unit_count += 1;
                player.total_units += 1;
            }
            SpecialAbility::ZoneHealing => {
                // Restore zone resources
                zone.energy = (zone.energy + 50).min(1000);
                zone.nutrients = (zone.nutrients + 30).min(1000);
            }
            _ => {} // Other abilities can be implemented later
        }
    }
    
    Ok(())
}

fn end_turn(game: &mut Game, player: &mut Player, zone: &mut Zone) -> Result<()> {
    // Generate resources for controlled zones
    let (energy_gen, antibody_gen, stem_gen, nutrient_gen) = zone.zone_type.get_resource_generation();
    
    if zone.owner == player.player_key {
        player.add_resources(
            energy_gen as u64,
            antibody_gen as u64,
            stem_gen as u64,
            nutrient_gen as u64,
        );
        
        // Update zone resources
        zone.energy = (zone.energy + energy_gen).min(1000);
        zone.antibodies = (zone.antibodies + antibody_gen).min(1000);
        zone.stem_cells = (zone.stem_cells + stem_gen).min(100);
        zone.nutrients = (zone.nutrients + nutrient_gen).min(1000);
    }
    
    // Switch to next player
    game.switch_turn();
    
    Ok(())
}

fn check_win_conditions(game: &mut Game, player: &Player) -> Result<()> {
    // Simple win condition: control 75% of zones or eliminate all enemy units
    if player.controlled_zones >= (game.total_zones * 3 / 4) as u16 {
        let winner = match player.player_id {
            1 => game::GameWinner::Player1,
            2 => game::GameWinner::Player2,
            _ => game::GameWinner::Draw,
        };
        game.end_game(winner);
    }
    
    Ok(())
}

fn calculate_spawn_cost(unit_type: &UnitType, zone_type: &ZoneType) -> (u64, u64, u64, u64) {
    let (_, _, _, _, base_cost) = unit_type.get_base_stats();
    let zone_multiplier = match zone_type {
        ZoneType::Lymphatic => 0.8, // Cheaper in lymphatic zones
        ZoneType::Barrier => 1.5,   // More expensive in barrier zones
        _ => 1.0,
    };
    
    let adjusted_cost = (base_cost as f64 * zone_multiplier) as u64;
    
    match unit_type.is_immune_cell() {
        true => (adjusted_cost, adjusted_cost / 2, adjusted_cost / 10, adjusted_cost / 3),
        false => (adjusted_cost * 2, 0, 0, adjusted_cost),
    }
}
