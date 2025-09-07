# Reality Check Game - Project Information

## Overview
Reality Check is a multiplayer web-based game of modern survival, sin, and satire. The project includes a Node.js game server, web frontend, and automated bot simulation system for testing.

## Recent Changes (September 2025)

### Bot Simulation System Fixed
- **Issue Resolved**: Bot simulation was failing due to state machine transition errors
- **Root Cause**: The `roll_dice` event handler wasn't properly setting up `pendingDecision` context
- **Solution Applied**: Updated `game-server.js` to include proper context setup before transitioning to Decision state
- **Result**: Bot simulation now runs successfully through multiple turns to completion

### Key Technical Fixes
1. **State Machine Fix**: Fixed "Invalid transition from Card to Decision" error
2. **Bot Logic**: Improved bot client to handle automatic Creator player
3. **Event Handling**: Resolved Socket.IO event processing issues
4. **Documentation**: Created comprehensive setup guide for other agents

## Project Architecture

### Core Components
- **Game Server**: `game-server.js` - Socket.IO-based multiplayer server
- **Bot Simulator**: `bot-client.js` - Automated players for testing
- **Game Engine**: `src/engine/` - State machine and turn management
- **Frontend**: `public/` - Web interface for human players

### Current Working State
- ✅ Game server runs on port 5000
- ✅ Bot simulation works end-to-end
- ✅ State machine transitions properly
- ✅ Multiple bots can play simultaneously
- ✅ Turn progression and game mechanics functional

## User Preferences
- Focus on debugging and fixing technical issues
- Prefer systematic problem-solving approach
- Value comprehensive documentation for handoffs
- Emphasize working code over theoretical solutions

## Dependencies
- Node.js runtime
- Socket.IO for real-time communication
- PostgreSQL database (optional for basic testing)
- Standard npm packages (see package.json)

## Development Workflow
1. Run game server: `npm start` or `npm run dev`
2. Test with bots: `node bot-client.js`
3. Debug via server logs and client output
4. Web interface available at http://localhost:5000

## Next Steps for Future Development
- Bot simulation system is stable and ready for enhanced testing scenarios
- Game mechanics can be tested automatically without human players
- State machine framework supports complex game flow requirements
- Ready for additional game features and balance testing