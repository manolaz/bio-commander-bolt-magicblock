# Bio Commander - Real Zone Implementation

## Overview

This document describes the implementation of real Zones in the Bio Commander game, which replaces the mock zone system with a fully functional blockchain-based zone management system.

## Architecture

### Components

1. **ZoneManager** - Main component for zone creation, expansion, and management
2. **ZoneGrid** - Visual grid representation of all zones
3. **SolanaService** - Blockchain interaction layer
4. **Zone Types** - Different zone categories with unique properties

### Zone Types

- **Circulatory** 🩸 - Blood vessels and circulation
- **Tissue** 🫁 - Body tissues and muscle
- **Lymphatic** 🦠 - Immune system nodes
- **Barrier** 🛡️ - Protective barriers (skin, membranes)
- **Organ** ❤️ - Major body organs

## Features

### Zone Creation
- Create new zones with specific types
- Resource cost calculation based on zone type and faction
- Coordinate-based placement system
- Automatic resource allocation

### Zone Expansion
- **Infection Spread** - Pathogen players can spread infection to adjacent zones
- **Immune Response** - Immune system players can establish defensive positions
- **Zone Conquest** - Take control of enemy-controlled zones
- **New Zone Creation** - Expand the game map with new zones

### Zone Management
- Real-time zone status updates
- Resource monitoring and management
- Unit deployment and control
- Adjacent zone connectivity

## Usage

### Creating a New Zone

1. Click the "➕ Create Zone" button in the ZoneManager
2. Select the zone type from the dropdown
3. Choose X and Y coordinates (0-7 range)
4. Review the resource cost
5. Click "Create Zone" to execute the transaction

### Expanding to Adjacent Zones

1. Select a source zone (your controlled zone)
2. Choose an expansion type:
   - **Infection Spread** (Pathogen only)
   - **Immune Response** (Immune System only)
   - **Conquer Zone** (Both factions)
3. Select the target zone
4. Execute the expansion transaction

### Zone Visualization

The ZoneGrid component provides:
- 8x8 grid layout showing all zones
- Color-coded ownership indicators
- Resource and unit information
- Adjacent zone highlighting
- Expansion possibility indicators

## Technical Implementation

### Solana Integration

```typescript
// Zone creation transaction
const transaction = await solanaService.expandZone(
  gameId,
  playerFaction,
  'CreateNewZone',
  zoneType
);

// Zone expansion transaction
const transaction = await solanaService.expandZone(
  gameId,
  playerFaction,
  expansionType,
  undefined,
  sourceZoneId,
  targetZoneId
);
```

### Zone Data Structure

```typescript
interface Zone {
  zoneId: number;
  zoneType: ZoneType;
  name: string;
  x: number;
  y: number;
  owner: string;
  grid: (Cell | null)[][];
  resources: ZoneResources;
  unitCount: number;
  isBorderZone: boolean;
  isControlled: boolean;
  connectedZones: (number | null)[];
}
```

### Resource Costs

Zone creation costs vary by type and faction:

| Zone Type | Base Energy | Base Antibodies | Base Stem Cells | Base Nutrients |
|------------|-------------|-----------------|-----------------|----------------|
| Circulatory | 200 | 100 | 20 | 150 |
| Tissue | 150 | 75 | 15 | 100 |
| Lymphatic | 300 | 150 | 30 | 200 |
| Barrier | 400 | 200 | 40 | 300 |
| Organ | 500 | 250 | 50 | 400 |

**Faction Modifiers:**
- Immune System: 1.0x (standard cost)
- Pathogen: 1.2x (20% more expensive)

## Game Mechanics

### Zone Control
- Zones can be controlled by either faction
- Uncontrolled zones are available for expansion
- Border zones provide strategic advantages

### Resource Generation
Each zone type generates resources per turn:
- **Circulatory**: 10 energy, 5 antibodies, 2 stem cells, 8 nutrients
- **Tissue**: 5 energy, 15 antibodies, 1 stem cell, 10 nutrients
- **Lymphatic**: 8 energy, 20 antibodies, 5 stem cells, 5 nutrients
- **Barrier**: 3 energy, 25 antibodies, 1 stem cell, 3 nutrients
- **Organ**: 15 energy, 10 antibodies, 3 stem cells, 15 nutrients

### Strategic Considerations
- **Positioning**: Zones adjacent to controlled zones are easier to expand to
- **Resource Balance**: Different zone types provide different resource mixes
- **Defense**: Barrier zones provide defensive bonuses
- **Connectivity**: Connected zones enable faster unit movement

## Error Handling

### Common Issues
1. **Insufficient Resources**: Check your resource balance before creating/expanding zones
2. **Invalid Coordinates**: Ensure coordinates are within the 0-7 range
3. **Non-Adjacent Expansion**: Can only expand to zones adjacent to controlled zones
4. **Transaction Failures**: Network issues or insufficient SOL for transaction fees

### Error Messages
- "Failed to create zone. Please check your resources and try again."
- "Failed to expand zone. Please check your resources and try again."
- "Please select a source zone first"
- "Zone not adjacent"

## Development

### Adding New Zone Types
1. Update the `ZoneType` enum in `bioCommander.ts`
2. Add zone data to the Solana program
3. Update the UI components to handle the new type
4. Add appropriate icons and styling

### Customizing Zone Properties
- Modify resource generation rates in the Solana program
- Adjust movement costs and defense bonuses
- Update expansion costs and requirements

### Testing
- Use Solana devnet for testing
- Verify zone creation and expansion transactions
- Test resource generation and consumption
- Validate zone connectivity and adjacency rules

## Future Enhancements

### Planned Features
- **Zone Specialization**: Unique abilities for each zone type
- **Zone Evolution**: Zones that change type over time
- **Resource Trading**: Exchange resources between zones
- **Zone Alliances**: Cooperative zone management
- **Dynamic Map**: Procedurally generated zone layouts

### Performance Optimizations
- Zone data caching and synchronization
- Batch transaction processing
- Real-time zone updates via WebSocket
- Zone state compression for large maps

## Troubleshooting

### Zone Not Appearing
1. Check transaction confirmation status
2. Verify zone coordinates are within bounds
3. Ensure sufficient resources for zone creation
4. Check Solana network connection

### Expansion Failing
1. Verify source zone is controlled by your faction
2. Check target zone adjacency
3. Ensure sufficient resources for expansion
4. Verify game state is active

### Resource Issues
1. Check zone resource generation rates
2. Verify resource consumption calculations
3. Ensure zones are properly connected
4. Check for resource drain effects

## Support

For technical support or questions about the Zone system:
1. Check the console for error messages
2. Verify Solana wallet connection
3. Ensure sufficient SOL for transaction fees
4. Check network connectivity and Solana RPC status

## Conclusion

The real Zone system provides a robust foundation for strategic gameplay in Bio Commander. By leveraging Solana blockchain technology, players can create, expand, and manage zones in a decentralized and transparent manner. The system supports complex strategic decisions while maintaining game balance and fairness.
