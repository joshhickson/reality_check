# Research Prompt 3: Core Loop and Economy Balance Analysis

## 1. Objective

To analyze the economic balance of the "Reality Check" game, focusing on the interplay between the four core stats (Money, Mental Health, Sin, Virtue) and the actions that modify them. The goal is to assess the viability of different playstyles and identify potential balance issues that could harm the player experience.

## 2. Context

The game's economy is founded on the principle of **"inefficient conversion,"** meaning that converting one resource to another should be difficult and result in a net loss of value. This is intended to make choices meaningful. The primary way players interact with this economy is by drawing and playing "Sin" and "Virtue" cards, which present choices with different statistical outcomes. A well-balanced economy is crucial for ensuring that no single strategy (e.g., "all-in on Sin") is dominant and that players have a variety of viable paths to victory.

## 3. Provided Documents & Data

### Document A: GDD Excerpts (Core Economy Sections)
```markdown
## 2. The Four Pillars: Core Stats & Economy

The game's economy is based on the four core stats, or "Pillars of Life." The fundamental design principle is **inefficient conversion**: converting one resource into another should always result in a net loss of value, making choices impactful and difficult toreverse.

*   **💰 Money:** Your financial health.
*   **🧠 Mental Health:** Your psychological wellbeing.
*   **☠️ Sin:** A measure of your moral corruption.
*   **✝️ Virtue:** A measure of your moral strength and altruism.

## 3.3. Card & Action Economy

**Concept:** Defines the flow of cards and actions to ensure a balanced and well-paced game.

**Rules:**
*   **Action Points (AP):** Each player starts their turn with **2 Action Points**.
*   **Action Menu:**
    *   **Draw a Card:** Costs 1 AP.
    *   **Play a Card:** Costs 1 AP.
    *   **Work Overtime:** Costs 2 AP. Gain $500 Money but lose 1 Mental Health.
*   **Hand Size:** Players have a maximum hand size of **5 cards**.
```

### Data B: Sin Card Data (`sin.csv`)
```csv
id,deck,type,text,money,mental,sin,virtue,delay
sin_01,sin,immediate,"You embezzle $5000 from your company's petty cash fund",-5000,2,3,-2,0
sin_02,sin,immediate,"You ghost your therapist after they called you out on your bullshit",0,-3,2,-1,0
... [Full sin.csv content] ...
```

### Data C: Virtue Card Data (`virtue.csv`)
```csv
id,deck,type,text,money,mental,sin,virtue,delay
virtue_01,virtue,immediate,"You donate plasma to help pay for someone's medical bills",200,3,-1,3,0
virtue_02,virtue,immediate,"You finally call your grandmother back",0,2,-1,2,0
... [Full virtue.csv content] ...
```
*(Note: Full text of all documents and data should be included in the final prompt submission to the AI model.)*

## 4. Research Questions

Please provide a detailed analysis answering the following questions:

1.  **Economy Balance Assessment:**
    *   Based on the card data, does the game successfully achieve its design goal of "inefficient conversion"? Provide specific card examples to support your analysis.
    *   Is there a clear mathematical relationship or trade-off between the four pillars? For example, what is the approximate "cost" of 1 Virtue point in terms of Money or Mental Health?
    *   Analyze the "Work Overtime" action. Based on the card data, is it a balanced choice, or is it too strong or too weak compared to playing a card?

2.  **Playstyle Viability Analysis:**
    *   Imagine two players: one pursuing a "Pure Sin" strategy (always choosing the most sinful options) and one pursuing a "Pure Virtue" strategy. Based on the card data, model out a hypothetical 5-turn game for each player. Which player appears to be in a stronger position, and why?
    *   Are there enough cards and mechanics to support a "balanced" playstyle, or does the game push players to specialize in either Sin or Virtue?
    *   Identify the most powerful and weakest cards in each deck and explain your reasoning.

3.  **Recommendations for Improvement:**
    *   Suggest at least two specific adjustments to the card data (e.g., changing the stat values on a specific card) to improve the game's overall balance. Justify your suggestions.
    *   Propose a new card idea (either Sin or Virtue) that would fill a gap in the current card pool or introduce a new and interesting strategic choice.
    *   What metrics should the development team focus on during playtesting to validate the game's economic balance? (e.g., "Average final score of Virtue-focused players vs. Sin-focused players.")
