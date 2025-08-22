use bolt_lang::*;

declare_id!("UNiT111111111111111111111111111111111111111");

#[component]
pub struct Unit {
    pub unit_id: u32,
    pub unit_type: UnitType,
    pub zone_id: u32,
    pub x: u8,
    pub y: u8,
    pub health: u16,
    pub max_health: u16,
    pub attack: u16,
    pub defense: u16,
    pub movement_range: u8,
    pub owner: Pubkey,
    pub special_abilities: [Option<SpecialAbility>; 3],
    pub is_active: bool,
    pub energy_cost: u16,
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum UnitType {
    // Immune Cells
    TCell,
    BCell,
    Macrophage,
    NeutrophilCell,
    DendriticCell,
    NaturalKillerCell,
    
    // Pathogens
    Virus,
    Bacteria,
    Fungus,
    Parasite,
    CancerCell,
    Toxin,
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum SpecialAbility {
    // Immune Cell Abilities
    AntibodyProduction,
    Phagocytosis,
    CytokineRelease,
    MemoryResponse,
    Infiltration,
    ZoneHealing,
    
    // Pathogen Abilities
    Replication,
    Mutation,
    ToxinRelease,
    ImmuneEvasion,
    Metastasis,
    ResourceDrain,
}

impl UnitType {
    pub fn get_base_stats(&self) -> (u16, u16, u16, u8, u16) {
        // Returns (health, attack, defense, movement_range, energy_cost)
        match self {
            // Immune Cells
            UnitType::TCell => (80, 15, 10, 3, 20),
            UnitType::BCell => (60, 8, 8, 2, 25),
            UnitType::Macrophage => (120, 20, 15, 2, 30),
            UnitType::NeutrophilCell => (70, 18, 8, 4, 15),
            UnitType::DendriticCell => (50, 5, 12, 3, 35),
            UnitType::NaturalKillerCell => (90, 25, 10, 3, 40),
            
            // Pathogens
            UnitType::Virus => (40, 12, 5, 4, 10),
            UnitType::Bacteria => (60, 15, 8, 2, 15),
            UnitType::Fungus => (80, 10, 12, 1, 20),
            UnitType::Parasite => (70, 18, 6, 3, 25),
            UnitType::CancerCell => (100, 20, 10, 2, 30),
            UnitType::Toxin => (30, 30, 2, 5, 5),
        }
    }

    pub fn get_default_abilities(&self) -> [Option<SpecialAbility>; 3] {
        match self {
            // Immune Cells
            UnitType::TCell => [Some(SpecialAbility::CytokineRelease), Some(SpecialAbility::MemoryResponse), None],
            UnitType::BCell => [Some(SpecialAbility::AntibodyProduction), Some(SpecialAbility::MemoryResponse), None],
            UnitType::Macrophage => [Some(SpecialAbility::Phagocytosis), Some(SpecialAbility::CytokineRelease), None],
            UnitType::NeutrophilCell => [Some(SpecialAbility::Phagocytosis), Some(SpecialAbility::Infiltration), None],
            UnitType::DendriticCell => [Some(SpecialAbility::CytokineRelease), Some(SpecialAbility::Infiltration), None],
            UnitType::NaturalKillerCell => [Some(SpecialAbility::CytokineRelease), Some(SpecialAbility::ZoneHealing), None],
            
            // Pathogens
            UnitType::Virus => [Some(SpecialAbility::Replication), Some(SpecialAbility::ImmuneEvasion), None],
            UnitType::Bacteria => [Some(SpecialAbility::Replication), Some(SpecialAbility::ToxinRelease), None],
            UnitType::Fungus => [Some(SpecialAbility::Replication), Some(SpecialAbility::ResourceDrain), None],
            UnitType::Parasite => [Some(SpecialAbility::ImmuneEvasion), Some(SpecialAbility::ResourceDrain), None],
            UnitType::CancerCell => [Some(SpecialAbility::Replication), Some(SpecialAbility::Metastasis), None],
            UnitType::Toxin => [Some(SpecialAbility::ToxinRelease), Some(SpecialAbility::ResourceDrain), None],
        }
    }

    pub fn is_immune_cell(&self) -> bool {
        matches!(self, 
            UnitType::TCell | UnitType::BCell | UnitType::Macrophage | 
            UnitType::NeutrophilCell | UnitType::DendriticCell | UnitType::NaturalKillerCell
        )
    }

    pub fn is_pathogen(&self) -> bool {
        !self.is_immune_cell()
    }
}

impl Default for Unit {
    fn default() -> Self {
        let unit_type = UnitType::TCell;
        let (health, attack, defense, movement_range, energy_cost) = unit_type.get_base_stats();
        let special_abilities = unit_type.get_default_abilities();
        
        Self::new(UnitInit {
            unit_id: 0,
            unit_type,
            zone_id: 0,
            x: 0,
            y: 0,
            health,
            max_health: health,
            attack,
            defense,
            movement_range,
            owner: Pubkey::default(),
            special_abilities,
            is_active: true,
            energy_cost,
        })
    }
}
