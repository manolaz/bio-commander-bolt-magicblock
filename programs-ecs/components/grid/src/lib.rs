use bolt_lang::*;

declare_id!("9EoKMqQqrgRAxVED34q17e466RKme5sTUkuCqUGH4bij");

#[component]
pub struct Zone {
    pub zone_id: u32,
    pub zone_type: ZoneType,
    pub x: u8,
    pub y: u8,
    pub owner: Pubkey,
    pub grid: [[Option<CellContent>; 16]; 16],
    pub energy: u32,
    pub antibodies: u32,
    pub stem_cells: u32,
    pub nutrients: u32,
    pub unit_count: u16,
    pub is_border_zone: bool,
    pub is_controlled: bool,
    pub connected_zones: [Option<u32>; 4], // North, East, South, West
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum ZoneType {
    Circulatory,
    Tissue,
    Lymphatic,
    Barrier,
    Organ,
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum CellContent {
    ImmuneCell { unit_id: u32, health: u16 },
    Pathogen { unit_id: u32, health: u16 },
    Resource { resource_type: ResourceType, amount: u16 },
    Obstacle,
}

#[component_deserialize]
#[derive(PartialEq)]
pub enum ResourceType {
    Energy,
    Antibodies,
    StemCells,
    Nutrients,
}

impl ZoneType {
    pub fn get_movement_cost(&self) -> u8 {
        match self {
            ZoneType::Circulatory => 1,
            ZoneType::Tissue => 3,
            ZoneType::Lymphatic => 2,
            ZoneType::Barrier => 4,
            ZoneType::Organ => 2,
        }
    }

    pub fn get_resource_generation(&self) -> (u32, u32, u32, u32) {
        // Returns (energy, antibodies, stem_cells, nutrients) per turn
        match self {
            ZoneType::Circulatory => (10, 5, 2, 8),
            ZoneType::Tissue => (5, 15, 1, 10),
            ZoneType::Lymphatic => (8, 20, 5, 5),
            ZoneType::Barrier => (3, 25, 1, 3),
            ZoneType::Organ => (15, 10, 3, 15),
        }
    }

    pub fn get_defense_bonus(&self) -> u16 {
        match self {
            ZoneType::Circulatory => 0,
            ZoneType::Tissue => 2,
            ZoneType::Lymphatic => 3,
            ZoneType::Barrier => 5,
            ZoneType::Organ => 1,
        }
    }
}

impl Default for Zone {
    fn default() -> Self {
        Self::new(ZoneInit {
            zone_id: 0,
            zone_type: ZoneType::Tissue,
            x: 0,
            y: 0,
            owner: Pubkey::default(),
            grid: [[None; 16]; 16],
            energy: 100,
            antibodies: 50,
            stem_cells: 10,
            nutrients: 75,
            unit_count: 0,
            is_border_zone: false,
            is_controlled: false,
            connected_zones: [None; 4],
        })
    }
}
