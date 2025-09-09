# Research Prompt 2: GDD & Player Manual Discrepancy Analysis

## 1. Objective

To identify, analyze, and provide actionable recommendations for resolving the discrepancies between the "Reality Check" Game Design Document (GDD) and the official Player Manual. The goal is to ensure that the game's vision, mechanics, and rules are communicated consistently to both the development team and the players.

## 2. Context

The GDD serves as the technical blueprint for the development team, detailing the game's vision and specific rules. The Player Manual is the primary document for teaching the game to new players. Significant differences between these two documents can lead to confusion for players, misinterpretation by developers, and a disconnect between the intended and actual player experience.

## 3. Provided Documents

### Document A: Game Design Document (GDD)
```markdown
# Reality Check: Game Design Document (GDD)
*Version 0.2 - Balanced Systems*

## 1. Core Game Loop & Vision

**Vision:** To create a satirical, narrative-driven board game that mirrors the complexities of modern adult life. The game should encourage social interaction, moral ambiguity, and strategic thinking beyond simple resource accumulation. The primary goal is not just to "win," but to generate memorable stories and conversations.

... [GDD content as provided in the previous prompt] ...

### 4.1. The Exile Protocol (Replaces Red Line Protocol)

**Concept:** A player-driven catch-up mechanism that addresses a runaway leader without resorting to player elimination. It transforms a dominant player into a new kind of disruptive force, keeping all players engaged.

**Rules:**
*   **Trigger Condition:** The Exile Protocol can be initiated at the start of any player's turn if one player's **Money** is more than double the combined total of the two players with the least Money.
*   **The Vote:** The player whose turn it is may propose a vote to "Exile" the wealthy player. The vote requires a simple majority to pass. The wealthy player does not get a vote.
*   **Consequences of Exile:**
    *   The Exiled player immediately loses 50% of their Money, which is redistributed equally among all other players.
    *   The Exiled player receives a new secret objective card (e.g., "Cause two other players to fall below 3 Mental Health," or "Ensure the player with the highest Virtue does not win.").
    *   The Exiled player no longer pursues the standard victory conditions. They can only win by achieving their new secret objective. They are still part of the game, but their goals are now fundamentally different and often disruptive.

... [Rest of GDD content] ...
```

### Document B: Player Manual
```markdown
# Reality Check: The Official Player Manual

## 1. Introduction: Welcome to Babel

> "We have to laugh at life in order to see it as it truly is."

Welcome to **Reality Check**, the game of modern survival, sin, and satire. Set in the fictional, hyper-modern city of Babel, you will navigate the beautiful chaos of adult life. From the soul-crushing demands of your career to the fleeting joys of a viral social media post, this game mirrors the absurdities and anxieties of our time.

... [Player Manual content as provided in the previous analysis step] ...

## 2. The Objective: What is "Winning"?

In Reality Check, "winning" is as complicated as it is in real life. There is no single path to victory. At the end of the game, all players face **Judgment Day**, a final reckoning of the life they've lived.

You can win by:

*   **Achieving the Highest Score:** A raw calculation of your life's successes and failures.
*   **Becoming The Saint:** Ending the game with the highest Virtue and lowest Sin.
*   **Becoming The Hustler:** Amassing the most Money without completely selling your soul.
*   **Becoming The Survivor:** Finishing with the highest Mental Health, proving your resilience against the chaos.
*   **Becoming The Builder:** Having the most positive impact on the lives of the other players.

... [Rest of Player Manual content] ...
```
*(Note: Full text of both documents should be included in the final prompt submission to the AI model.)*

## 4. Research Questions

Please provide a detailed analysis answering the following questions:

1.  **Discrepancy Identification:**
    *   Please create a comprehensive list of all major and minor discrepancies between the GDD and the Player Manual. For each discrepancy, identify the specific mechanic or rule and briefly describe the difference. (e.g., "Exile Protocol: Present in GDD, absent in Manual.")

2.  **Impact Analysis:**
    *   For the three most significant discrepancies you identified, analyze the potential impact on both the player experience and the development process.
    *   How might these inconsistencies affect a new player's understanding and enjoyment of the game?
    *   How might they create confusion or implementation errors for the development team?

3.  **Root Cause Hypothesis:**
    *   Given that GDDs are often "living documents," what are the most likely reasons for these discrepancies? (e.g., The manual is out of date, a mechanic was removed but the GDD wasn't updated, the manual intentionally simplifies complex rules, etc.).

4.  **Actionable Recommendations:**
    *   Propose a clear, step-by-step process for reconciling the GDD and the Player Manual.
    *   For each major discrepancy, recommend a specific course of action. Should the mechanic be added to the manual? Should it be removed from the GDD? Should the manual be updated to reflect a simplified version of the rule? Please justify your recommendations.
    *   Suggest a documentation workflow or best practice the team could adopt to prevent such discrepancies in the future (e.g., a "single source of truth" policy, regular sync meetings between writers and designers).
