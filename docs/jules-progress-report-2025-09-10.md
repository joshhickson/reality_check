# Jules's Progress Report - 2025-09-10

## Objective
To continue development of the "Reality Check" simulation, focusing on implementing the un-actioned recommendations from the existing research reports.

## Development Plan

1.  **Reconcile GDD and Player Manual:**
    *   The Game Design Document (GDD) will be treated as the single source of truth.
    *   I will update the `docs/player-manual.md` to align with the mechanics defined in the GDD v0.3, specifically adding the "Exile Protocol" and clarifying the victory conditions. I will also add a note about the "Chaos Cards" and "Starting Characters" being future expansion ideas to resolve the discrepancy.

2.  **Balance the Game Economy:**
    *   Based on the analysis of Report 03, the "Work Overtime" action is currently too powerful. I will rebalance it by increasing its AP cost or reducing its reward.
    *   I will perform a light rebalance on a few key Sin/Virtue cards to make the trade-offs more meaningful.

3.  **Implement the Social Capital Mechanic:**
    *   I will add the `socialCapital` stat to `Player.js`.
    *   I will implement the server-side logic in `game-server.js` for gaining and spending Social Capital.

4.  **Enhance Bot Testing Capabilities:**
    *   I will update `bot-client.js` to move beyond its placeholder logic.
    *   The bot will be taught to randomly choose between the available actions (`WORK_OVERTIME`, `DRAW_CARD`, `PLAY_CARD`) instead of always picking one. This is the first step towards the tiered testing strategy from Report 06.
