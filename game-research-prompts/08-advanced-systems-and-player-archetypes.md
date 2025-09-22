# Research Prompt 8: Advanced Systems and Player Archetype Analysis

## 1. Objective

To analyze the strategic impact of Reality Check's advanced game systems and to brainstorm a diverse set of potential player archetypes. The core economic loop of the game has been balanced, but the influence of major narrative events and catch-up mechanics remains unevaluated. This research should explore how these systems deepen the game and what kinds of player behaviors they might encourage.

## 2. Context & Provided Documents

The game now exists in a state where multiple basic strategies (e.g., focusing on money vs. focusing on virtue) appear to be viable paths to victory. However, these baseline strategies are still simplistic. We need to understand how the more complex, narrative-driven systems affect long-term strategy and player experience.

You will be provided with the following documents for your analysis. You will not have access to the game's source code.

*   **Document A: `game-design-document.md` (GDD):** The primary source of truth for the game's rules, including the core loop, the "Judgment Day" scoring, the "Burnout" mechanic, and advanced systems like the "Exile Protocol."
*   **Document B: `stats-system.md`:** A supplementary document that provides more flavor on the game's stats and describes several *unimplemented* alternative victory conditions that reveal the design intent for strategic diversity.
*   **Document C: `cards/new_card_deck.json`:** A JSON file containing all the "Sin," "Virtue," and "Life Happens" cards, including the text and statistical outcomes of their choices.

## 3. Research Questions

Please provide a detailed analysis answering the following questions:

### Part 1: Advanced System Analysis

1.  **"Life Happens" Events:**
    *   Review the "Life Happens" cards in the provided JSON data. Identify the 3 most and 3 least impactful event cards in terms of their potential to alter a player's score and strategy. Justify your selections with specific examples.
    *   Based on the GDD, the `SPEND_MOMENTUM` action is the only way to trigger these events. Does this feel like a rewarding and well-paced mechanic? Suggest one potential refinement to how players interact with the "Life Happens" deck.

2.  **The "Exile Protocol":**
    *   Analyze the "Exile Protocol" as described in the GDD. Is it an effective and engaging catch-up mechanic, or is it overly punitive?
    *   Propose one specific, alternative secret objective that an "Exiled" player could receive that might create more interesting and disruptive gameplay.

### Part 2: Player Archetype Evaluation

1.  **Current Archetype Assessment:**
    *   Evaluate the three existing bot strategies as proxies for player archetypes:
        *   **The Random:** A baseline, unpredictable player.
        *   **The Hustler:** A money-focused player.
        *   **The Zen:** A virtue and mental-health-focused player.
    *   Based on the provided documents, what are the primary strengths and weaknesses of each of these archetypes? Which game systems does each archetype engage with most, and which do they ignore?

2.  **New Player Archetype Brainstorming:**
    *   The goal is to envision how different *human* players might approach the game. Based on the full ruleset (including Social Capital, Community Impact, etc.), propose **three new, distinct player archetypes.**
    *   For each new archetype, provide:
        *   A descriptive name (e.g., "The Socialite," "The Manipulator," "The Gambler").
        *   A core motivation or victory philosophy.
        *   The primary game mechanics and stats they would focus on.
        *   A key strategic choice they might make that would differ from other archetypes.
    *   Example:
        *   **Name:** The Socialite
        *   **Motivation:** To win by being the most liked and influential player, regardless of personal wealth or traditional morality.
        *   **Focus:** Maximizing `Kudos` and `Social Capital`. They would aim for a high `Community Impact` score to win the "Builder Bonus."
        *   **Strategic Choice:** They might spend their own resources to help another player (Direct Aid) solely to gain Social Capital, even if it puts them at a temporary disadvantage.

## 4. Conclusion

This analysis will help guide the next phase of development, which will involve creating more sophisticated AI opponents and ensuring that the game's advanced systems are as balanced and engaging as its core economy.
