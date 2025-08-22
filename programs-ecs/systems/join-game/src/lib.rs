use bolt_lang::*;
use players::{Player, Faction};
use game::{Game, GameState};
use grid::Zone;

declare_id!("7TsTc97MB21EKbh2RetcWsGWRJ4xuMkPKKD4DcMJ2Sms");

#[error_code]
pub enum JoinGameError {
    #[msg("Game is full.")]
    GameFull,
    #[msg("Player already in game.")]
    PlayerAlreadyInGame,
    #[msg("Game already started.")]
    GameAlreadyStarted,
    #[msg("Invalid faction choice.")]
    InvalidFaction,
}

#[system]
pub mod join_game {

    pub fn execute(ctx: Context<Components>, args: Args) -> Result<Components> {
        let game = &mut ctx.accounts.game;
        let player = &mut ctx.accounts.player;
        let authority = *ctx.accounts.authority.key;

        // Check if game is in waiting state
        require!(
            matches!(game.game_state, GameState::WaitingForPlayers),
            JoinGameError::GameAlreadyStarted
        );

        // Check if player already in game
        require!(
            game.player1 != authority && game.player2 != authority,
            JoinGameError::PlayerAlreadyInGame
        );

        // Assign player to game
        let player_id = if game.player1 == Pubkey::default() {
            game.player1 = authority;
            1
        } else if game.player2 == Pubkey::default() {
            game.player2 = authority;
            2
        } else {
            return Err(JoinGameError::GameFull.into());
        };

        // Initialize player with selected faction
        let faction = match args.faction {
            0 => Faction::ImmuneSystem,
            1 => Faction::Pathogen,
            _ => return Err(JoinGameError::InvalidFaction.into()),
        };

        // Set up player data
        player.player_id = player_id;
        player.player_key = authority;
        player.faction = faction;
        
        // Set faction-specific starting resources
        match faction {
            Faction::ImmuneSystem => {
                player.energy_reserves = 1200;
                player.antibody_reserves = 800;
                player.stem_cell_reserves = 150;
                player.nutrient_reserves = 900;
            }
            Faction::Pathogen => {
                player.energy_reserves = 1500;
                player.antibody_reserves = 200;
                player.stem_cell_reserves = 50;
                player.nutrient_reserves = 1200;
            }
        }

        // Unlock starting units based on faction
        match faction {
            Faction::ImmuneSystem => {
                player.unlock_unit(0); // TCell
                player.unlock_unit(1); // BCell
                player.unlock_unit(2); // Macrophage
            }
            Faction::Pathogen => {
                player.unlock_unit(6); // Virus
                player.unlock_unit(7); // Bacteria
                player.unlock_unit(8); // Fungus
            }
        }

        // If both players joined, start the game
        if game.player1 != Pubkey::default() && game.player2 != Pubkey::default() {
            game.game_state = GameState::Active;
            game.current_turn = 1; // Player 1 starts
            
            // Initialize starting zones
            if let Some(zone) = &mut ctx.accounts.starting_zone {
                zone.zone_id = 0;
                zone.x = 2; // Center of 4x4 map
                zone.y = 2;
                zone.owner = authority;
                zone.is_controlled = true;
                zone.zone_type = match faction {
                    Faction::ImmuneSystem => grid::ZoneType::Lymphatic,
                    Faction::Pathogen => grid::ZoneType::Tissue,
                };
                
                // Give player control of this zone
                player.controlled_zones = 1;
            }
        }

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub game: Game,
        pub player: Player,
        pub starting_zone: Option<Zone>,
    }

    #[arguments]
    struct Args {
        faction: u8, // 0 = ImmuneSystem, 1 = Pathogen
    }
}
