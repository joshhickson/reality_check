# Reality Check Game - Development Environment Setup

## Project Overview

Reality Check is a multiplayer web-based game of modern survival, sin, and satire. This repository contains:
- A Node.js game server with Socket.IO for real-time multiplayer functionality
- A web frontend for human players
- A bot simulation system for automated testing
- PostgreSQL database integration for game state persistence

## Architecture

- **Game Server**: `game-server.js` - Main server handling Socket.IO connections and game logic
- **Frontend**: `public/` directory - Static web files for browser-based gameplay
- **Game Engine**: `src/engine/` - State machine and scheduling logic
- **Game Logic**: `src/game/` - Player and Game classes
- **Bot Simulator**: `bot-client.js` - Automated bot players for testing

## Environment Setup

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **PostgreSQL Database** (optional for basic testing)
   - The game supports PostgreSQL but can run without it for simulation testing
   - Database URL should be set in `DATABASE_URL` environment variable

### Installation Steps

1. **Clone/Download the repository**
   ```bash
   # If you have the code locally, navigate to the project directory
   cd reality-check-game
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   
   This installs all required packages:
   - `express` - Web server framework
   - `socket.io` - Real-time communication
   - `socket.io-client` - Client-side Socket.IO for bots
   - `cors` - Cross-origin resource sharing
   - `pg` - PostgreSQL client
   - `uuid` - Unique ID generation
   - `bcrypt` - Password hashing
   - `nodemon` - Development auto-reload

### Running the Game Server

#### Production Mode
```bash
npm start
# or directly:
node game-server.js
```

#### Development Mode (with auto-reload)
```bash
npm run dev
# or directly:
nodemon game-server.js
```

The server will start on **port 5000** and display:
```
🚀 Server listening on port 5000
Serving static files from: /home/runner/workspace/public
```

### Running the Bot Simulator

The bot simulator creates automated players that can play the game to completion.

1. **Ensure the game server is running** (see above)

2. **Run the bot simulation**:
   ```bash
   node bot-client.js
   ```

#### What the Bot Simulator Does

- Connects 2 automated bot players (Bot1 and Bot2)
- Bot1 creates a game called "Bot Game"
- Bot2 joins the game
- The game starts automatically
- Bots take turns:
  - **Roll State**: Automatically roll dice
  - **Decision State**: Automatically make card choices
  - **Turn Progression**: Switch between players
- Runs until turn limit (10 turns) or game completion
- Logs all game events and state changes

#### Expected Bot Output

```
Bot Bot1 connected with id [socket-id]
Bot Bot2 connected with id [socket-id]
Game created with ID: [game-id]
Starting game...
It's Bot1's turn. State is Roll
Bot Bot1 is rolling the dice.
It's Bot1's turn. State is Decision
Bot Bot1 is making a choice.
[continues with turn progression...]
```

#### Expected Server Output

```
🔌 New connection: [Bot1-socket-id]
🔌 New connection: [Bot2-socket-id]
[EVENT] create_game from [socket-id]
[GAME] Game [game-id] created
[EVENT] start_game from [socket-id]
🔄 State transition: Idle → Roll
[EVENT] roll_dice from [socket-id]
🔄 State transition: Roll → Tile → Card → Decision
[EVENT] card_choice from [socket-id]
[GAME] Player Bot1 chose an option. New stats: {...}
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module 'socket.io-client'"
**Solution**: Run `npm install` to install all dependencies.

#### 2. Bot simulation times out without progression
**Symptoms**: Bots connect but game doesn't progress, server shows "Auto-transitioning from Roll to Tile (timeout)"

**Root Cause**: State machine transition issues in the game server.

**Solution**: Ensure the `roll_dice` event handler in `game-server.js` properly sets up `pendingDecision` context:
```javascript
socket.on('roll_dice', ({ gameId, playerId }) => {
  // ... existing code ...
  game.stateMachine.updateContext({
    pendingDecision: {
      playerId: playerId,
      cardId: 'simulation_card',
      options: ['Option 1', 'Option 2']
    }
  });
  game.stateMachine.transition('Decision');
  // ... rest of handler ...
});
```

#### 3. "Invalid transition from Card to Decision"
**Root Cause**: The state machine requires `pendingDecision` context to transition from Card to Decision state.

**Solution**: This should be fixed in the current codebase. If you see this error, ensure the `roll_dice` handler sets up the required context as shown above.

#### 4. Port 5000 already in use
**Solution**: 
- Kill existing processes: `pkill -f "node.*game-server"`
- Or use a different port by modifying `game-server.js`

#### 5. No automatic Creator player issue
**Background**: When a game is created, an automatic "Creator" player is generated. The bot simulation handles this by having Bot1 control the Creator player through the same socket that created the game.

## Development Notes

### Key Files Modified for Bot Simulation

1. **`game-server.js`**: 
   - Fixed `roll_dice` event handler to properly set `pendingDecision` context
   - Enables smooth state transitions from Roll → Tile → Card → Decision

2. **`bot-client.js`**:
   - Handles automatic Creator player control
   - Implements turn-based decision making
   - Includes debugging logs for troubleshooting

### State Machine Flow

The game follows this state progression:
1. **Idle**: Waiting for players
2. **Roll**: Player rolls dice  
3. **Tile**: Process tile effects
4. **Card**: Draw/process cards
5. **Decision**: Player makes choices
6. **EndTurn**: Clean up and switch players

### Testing Strategy

- **Manual Testing**: Run the web interface at `http://localhost:5000`
- **Automated Testing**: Use `node bot-client.js` for full game simulation
- **Debug Testing**: Check server logs for event processing and state transitions

## Platform-Specific Notes

### Replit Environment
- Dependencies auto-install when the workspace starts
- PostgreSQL database is available via environment variables
- Server automatically binds to 0.0.0.0:5000

### Local Development
- Ensure PostgreSQL is running if database features are needed
- Install Node.js and npm manually
- Dependencies must be installed via `npm install`

### Other Cloud Platforms
- Ensure Node.js runtime is available
- Set environment variables for database connection
- Bind server to appropriate host/port for the platform

## Bot Simulation Technical Details

### Connection Flow
1. Bot1 connects and creates game (this auto-generates a "Creator" player)
2. Bot1 joins as "Bot1" player
3. Bot2 connects and joins as "Bot2" player
4. Bot1 starts the game
5. Game begins with Creator player's turn (controlled by Bot1)

### Event Handling
- Bots respond to `game_state_update` events
- Automatically emit `roll_dice` events when in Roll state
- Automatically emit `card_choice` events when in Decision state
- Include proper gameId and playerId in all events

### Turn Limit
- Simulation stops after 10 turns to prevent infinite loops
- Can be modified in `bot-client.js` by changing the `turnLimit` variable

## Next Steps for Other Agents

1. **Setup**: Follow installation steps above
2. **Test**: Run `node bot-client.js` to verify everything works
3. **Develop**: Modify bot logic in `bot-client.js` for different scenarios
4. **Debug**: Check server logs for any state machine or event handling issues

The bot simulation system provides a robust foundation for testing game mechanics, balance, and multiplayer functionality without requiring human players.