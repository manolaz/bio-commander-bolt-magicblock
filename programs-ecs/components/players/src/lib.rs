use bolt_lang::*;

declare_id!("HLzXXTbMUjemRSQr5LHjtZgBvqyieuhY8wE29xYzhZSX");

#[component]
pub struct Player {
    pub player_id: u8, // 1 or 2
    pub player_key: Pubkey,
    pub energy_reserves: u64,
    pub antibody_reserves: u64,
    pub stem_cell_reserves: u64,
    pub nutrient_reserves: u64,
    pub controlled_zones: u16,
    pub total_units: u16,
    pub research_points: u32,
    pub faction: Faction,
    pub unlocked_units: [bool; 12], // Track which unit types are unlocked
    pub special_bonuses: [Option<SpecialBonus>; 3],
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum Faction {
    ImmuneSystem,
    Pathogen,
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum SpecialBonus {
    IncreasedProduction,
    FasterMovement,
    StrongerUnits,
    BetterDefense,
    ResourceEfficiency,
    ZoneControl,
}

impl Player {
    pub fn can_afford(&self, energy: u64, antibodies: u64, stem_cells: u64, nutrients: u64) -> bool {
        self.energy_reserves >= energy &&
        self.antibody_reserves >= antibodies &&
        self.stem_cell_reserves >= stem_cells &&
        self.nutrient_reserves >= nutrients
    }

    pub fn spend_resources(&mut self, energy: u64, antibodies: u64, stem_cells: u64, nutrients: u64) -> bool {
        if self.can_afford(energy, antibodies, stem_cells, nutrients) {
            self.energy_reserves -= energy;
            self.antibody_reserves -= antibodies;
            self.stem_cell_reserves -= stem_cells;
            self.nutrient_reserves -= nutrients;
            true
        } else {
            false
        }
    }

    pub fn add_resources(&mut self, energy: u64, antibodies: u64, stem_cells: u64, nutrients: u64) {
        self.energy_reserves = self.energy_reserves.saturating_add(energy);
        self.antibody_reserves = self.antibody_reserves.saturating_add(antibodies);
        self.stem_cell_reserves = self.stem_cell_reserves.saturating_add(stem_cells);
        self.nutrient_reserves = self.nutrient_reserves.saturating_add(nutrients);
    }

    pub fn get_faction_bonus(&self) -> (u16, u16, u16) {
        // Returns (attack_bonus, defense_bonus, movement_bonus)
        match self.faction {
            Faction::ImmuneSystem => (2, 3, 0),
            Faction::Pathogen => (3, 0, 1),
        }
    }

    pub fn is_unit_unlocked(&self, unit_type_index: usize) -> bool {
        if unit_type_index < self.unlocked_units.len() {
            self.unlocked_units[unit_type_index]
        } else {
            false
        }
    }

    pub fn unlock_unit(&mut self, unit_type_index: usize) {
        if unit_type_index < self.unlocked_units.len() {
            self.unlocked_units[unit_type_index] = true;
        }
    }
}

impl Default for Player {
    fn default() -> Self {
        let mut unlocked_units = [false; 12];
        // Unlock basic units by default
        unlocked_units[0] = true; // TCell
        unlocked_units[6] = true; // Virus
        
        Self::new(PlayerInit {
            player_id: 1,
            player_key: Pubkey::default(),
            energy_reserves: 1000,
            antibody_reserves: 500,
            stem_cell_reserves: 100,
            nutrient_reserves: 750,
            controlled_zones: 0,
            total_units: 0,
            research_points: 0,
            faction: Faction::ImmuneSystem,
            unlocked_units,
            special_bonuses: [None; 3],
        })
    }
}
