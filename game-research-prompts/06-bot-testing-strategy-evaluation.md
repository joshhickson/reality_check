# Research Prompt 6: Bot Testing Strategy Evaluation

## 1. Objective

To evaluate the effectiveness of the current bot simulation (`bot-client.js`) as a testing tool for the "Reality Check" game. The analysis should identify gaps in testing coverage and propose a comprehensive, tiered strategy for expanding the bot's capabilities to ensure all game mechanics, especially the advanced systems, are thoroughly tested.

## 2. Context

The "Reality Check" game features several complex, interacting systems (e.g., Exile Protocol, Social Capital, Crossroads Interrupts) that are difficult to balance and debug through manual playtesting alone. The current bot simulator successfully tests the basic game loop (drawing and playing cards) but does not engage with any of the advanced mechanics. This creates a significant risk that these complex systems could be unbalanced, buggy, or unfun. A robust automated testing strategy is crucial for the long-term health and success of the project.

## 3. Provided Documents & Code

### Document A: Game Design Document (GDD)
```markdown
# Reality Check: Game Design Document (GDD)
*Version 0.2 - Balanced Systems*

... [Full GDD content as provided in previous prompts, including all Core and Advanced Mechanics] ...
```

### Code B: Bot Simulator Client (`bot-client.js`)
```javascript
const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const TURN_LIMIT = 10;

class Bot {
    constructor(name, personality = 'Random') {
        this.name = name;
        this.personality = personality;
        // ...
    }
    // ...
    makeDecision(gameState) {
        const { currentState, currentPlayerId } = gameState;

        if (currentState === 'Roll') {
            console.log(`[${this.name}] Rolling the dice.`);
            this.socket.emit('roll_dice', {
                gameId: this.gameId,
                playerId: currentPlayerId
            });
        } else if (currentState === 'Decision') {
            const choiceIndex = this.chooseOption(gameState);
            console.log(`[${this.name}] Making a choice (option ${choiceIndex}).`);
            this.socket.emit('card_choice', {
                gameId: this.gameId,
                playerId: currentPlayerId,
                cardId: 'dummy_card', // This will need to be dynamic in the future
                choiceIndex: choiceIndex
            });
        }
    }

    chooseOption(gameState) {
        // ...
        switch (this.personality) {
            case 'Aggressive':
                // Chooses option with the most 'sin'
                // ...
            case 'Virtuous':
                // Chooses option with the most 'virtue'
                // ...
            case 'Random':
            default:
                // Chooses a random option
                // ...
        }
    }
    // ...
}

async function runSimulation() {
    const bot1 = new Bot("Bot1", "Aggressive");
    const bot2 = new Bot("Bot2", "Virtuous");
    // ...
}

runSimulation();
```
*(Note: Full text of both the GDD and the bot client code should be included in the final prompt submission to the AI model.)*

## 4. Research Questions

Please provide a detailed analysis answering the following questions:

1.  **Testing Gap Analysis:**
    *   Based on a comparison of the GDD and the bot's code, create a comprehensive list of all game mechanics and systems that are **not** currently being tested by the bot simulation.
    *   For each untested mechanic, explain the specific risk of not having it covered by automated tests (e.g., "Risk of an infinite loop in the Exile Protocol vote," "Risk of Social Capital being an unbalanced resource").

2.  **Bot Personality & AI Enhancement:**
    *   The current bot personalities ("Aggressive," "Virtuous") are very simplistic. Propose **three new, more sophisticated bot personalities** that would be more effective for testing. (e.g., "The Hoarder" who tries to accumulate a specific resource, "The People-Pleaser" who tries to maximize Kudos, "The Chaos Agent" who tries to trigger disruptive events).
    *   For each new personality, describe the decision-making logic it would use.

3.  **A Tiered Testing Strategy:**
    *   Propose a **three-tiered testing strategy** for expanding the bot's capabilities. This should be a roadmap for development.
        *   **Tier 1 (Basic Interaction):** What is the next logical mechanic the bots should learn to interact with? (e.g., Using Social Capital). Describe the simplest possible implementation.
        *   **Tier 2 (Complex Scenarios):** What more complex scenarios should the bots be able to test? (e.g., Triggering and voting on the Exile Protocol). Describe the logic required.
        *   **Tier 3 (Full Simulation):** What would a "fully intelligent" bot, capable of testing almost all game systems, look like? What would be its ultimate goal?

4.  **Metrics and Validation:**
    *   Beyond just running without crashing, what specific data points or **metrics** should a more advanced bot simulation log to a file? (e.g., "Number of times Exile Protocol was triggered," "Average Social Capital spent per game," "Final score distribution across different bot personalities").
    *   How could these metrics be used to automatically identify potential balance issues or bugs?
