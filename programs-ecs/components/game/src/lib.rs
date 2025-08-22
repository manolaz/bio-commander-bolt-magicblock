use bolt_lang::*;

declare_id!("GAMe111111111111111111111111111111111111111");

#[component]
pub struct Game {
    pub game_id: u32,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub current_turn: u8, // 1 or 2
    pub turn_number: u32,
    pub map_width: u8,
    pub map_height: u8,
    pub total_zones: u32,
    pub game_state: GameState,
    pub winner: Pubkey,
    pub infection_level: u8, // 0-100, affects pathogen spawn rates
    pub immune_response_level: u8, // 0-100, affects immune cell effectiveness
    pub turn_time_limit: u64, // seconds
    pub last_turn_timestamp: i64,
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum GameState {
    WaitingForPlayers,
    Active,
    Paused,
    Finished { winner: GameWinner },
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum GameWinner {
    Player1,
    Player2,
    Draw,
    ImmuneSystem, // Special case where immune system wins
    Infection,    // Special case where infection wins
}

impl Game {
    pub fn is_player_turn(&self, player: &Pubkey) -> bool {
        match self.current_turn {
            1 => &self.player1 == player,
            2 => &self.player2 == player,
            _ => false,
        }
    }

    pub fn get_opponent(&self, player: &Pubkey) -> Option<Pubkey> {
        if &self.player1 == player {
            Some(self.player2)
        } else if &self.player2 == player {
            Some(self.player1)
        } else {
            None
        }
    }

    pub fn switch_turn(&mut self) {
        self.current_turn = if self.current_turn == 1 { 2 } else { 1 };
        self.turn_number += 1;
    }

    pub fn get_current_player(&self) -> Pubkey {
        if self.current_turn == 1 {
            self.player1
        } else {
            self.player2
        }
    }

    pub fn is_game_active(&self) -> bool {
        matches!(self.game_state, GameState::Active)
    }

    pub fn end_game(&mut self, winner: GameWinner) {
        let winner_pubkey = match winner {
            GameWinner::Player1 => self.player1,
            GameWinner::Player2 => self.player2,
            _ => Pubkey::default(),
        };
        self.game_state = GameState::Finished { winner };
        self.winner = winner_pubkey;
    }

    pub fn update_infection_level(&mut self, delta: i8) {
        let new_level = (self.infection_level as i16) + (delta as i16);
        self.infection_level = new_level.clamp(0, 100) as u8;
    }

    pub fn update_immune_response_level(&mut self, delta: i8) {
        let new_level = (self.immune_response_level as i16) + (delta as i16);
        self.immune_response_level = new_level.clamp(0, 100) as u8;
    }
}

impl Default for Game {
    fn default() -> Self {
        Self::new(GameInit {
            game_id: 0,
            player1: Pubkey::default(),
            player2: Pubkey::default(),
            current_turn: 1,
            turn_number: 0,
            map_width: 4, // Start with 4x4 zones (64x64 cells total)
            map_height: 4,
            total_zones: 16,
            game_state: GameState::WaitingForPlayers,
            winner: Pubkey::default(),
            infection_level: 20, // Start with moderate infection
            immune_response_level: 30, // Start with moderate immune response
            turn_time_limit: 300, // 5 minutes per turn
            last_turn_timestamp: 0,
        })
    }
}
