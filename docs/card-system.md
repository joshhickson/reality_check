
# Reality Check - Card System

## Overview

The card system is the narrative engine of Reality Check, driving player choices and creating emergent storytelling through moral dilemmas, life events, and social interactions.

## Card Categories

### Sin Cards (Temptation Deck)
Cards that offer immediate benefits with moral or long-term costs.

**Design Philosophy:** Represent the everyday temptations that test moral boundaries - insider trading, relationship betrayals, tax evasion, exploiting others' trust.

**Mechanical Structure:**
- Immediate positive effects (money, connections, advantages)
- Hidden costs (sin points, future consequences, relationship damage)
- Optional "double-down" choices for greater risk/reward

### Virtue Cards (Sacrifice Deck)
Cards that require sacrifice but offer moral growth and long-term benefits.

**Design Philosophy:** Opportunities for altruism, forgiveness, and moral strength that often come at personal cost.

**Mechanical Structure:**
- Immediate costs (money, time, opportunity)
- Virtue points and mental health benefits
- Potential for inspiring others or creating positive ripple effects

### Chaos Cards (Life Events)
Random events that test adaptability and create narrative moments.

**Design Philosophy:** The uncontrollable aspects of life - accidents, windfalls, health crises, social changes.

**Mechanical Structure:**
- No moral component (neither sin nor virtue)
- Random positive or negative effects
- Often create new ongoing conditions or relationships

## Card Template Structure

### Standard Card Format
```json
{
  "id": "unique_identifier",
  "title": "Card Name",
  "category": "sin|virtue|chaos",
  "ring_type": "career|health|social|personal|babel",
  "description": "Narrative description of the situation",
  "image_url": "optional_illustration.jpg",
  "choices": [
    {
      "action": "Accept/Take Action",
      "effects": {
        "money": 0,
        "mental_health": 0,
        "sin": 0,
        "virtue": 0
      },
      "ongoing_effects": [],
      "flavor_text": "Immediate consequence description"
    },
    {
      "action": "Reject/Avoid",
      "effects": {},
      "flavor_text": "Alternative outcome"
    }
  ],
  "conditions": {
    "min_money": 0,
    "requires_trait": null,
    "excludes_condition": null
  },
  "rarity": "common|uncommon|rare",
  "expansion": "base|future_set_name"
}
```

### Advanced Card Features

#### Ongoing Effects
Some cards create persistent conditions:
```json
"ongoing_effects": [
  {
    "type": "monthly_payment",
    "amount": -500,
    "duration": 12,
    "description": "Student loan payments"
  },
  {
    "type": "stat_modifier",
    "stat": "mental_health",
    "modifier": -1,
    "condition": "when_stressed",
    "description": "Chronic anxiety"
  }
]
```

#### Conditional Triggers
Cards can have complex activation requirements:
```json
"conditions": {
  "min_money": 10000,
  "max_sin": 5,
  "requires_relationship": "romantic_partner",
  "excludes_condition": "investigation_active"
}
```

## Ring-Specific Card Design

### Career Ring Cards
**Themes:** Corporate politics, workplace ethics, financial opportunities
**Examples:**
- "Embezzlement Opportunity" (Sin)
- "Mentor an Intern" (Virtue)
- "Startup Acquisition Offer" (Chaos)

### Health Ring Cards
**Themes:** Medical decisions, mental health, lifestyle choices
**Examples:**
- "Ignore the Chest Pain" (Sin)
- "Therapy Breakthrough" (Virtue)
- "Mysterious Rash" (Chaos)

### Social Ring Cards
**Themes:** Relationships, family drama, community involvement
**Examples:**
- "Affair Opportunity" (Sin)
- "Forgive Ex-Partner" (Virtue)
- "Viral Social Media Post" (Chaos)

### Personal Growth Ring Cards
**Themes:** Self-improvement, hobbies, spirituality, side projects
**Examples:**
- "Addictive Mobile Game" (Sin)
- "Volunteer at Shelter" (Virtue)
- "Inheritance from Unknown Relative" (Chaos)

### Babel Events Ring Cards
**Themes:** Town-wide events affecting all players
**Examples:**
- "Hoarding During Crisis" (Sin)
- "Organize Community Aid" (Virtue)
- "Mandatory Evacuation" (Chaos)

## Deck Management System

### Dynamic Deck Building
Cards are selected based on:
- Current game state
- Player history and traits
- Ring-specific themes
- Global event context

### Rarity Distribution
- **Common (70%):** Basic life events that can happen to anyone
- **Uncommon (25%):** Significant events with moderate impact
- **Rare (5%):** Life-changing events with major consequences

### Card Cycling
- Used cards are not immediately reshuffled
- Creates evolving narrative as certain events become unavailable
- Some cards are "one per game" to maintain uniqueness

## Player Interaction Cards

### Targeted Cards
Some cards specifically involve other players:
```json
{
  "title": "Blackmail Discovery",
  "target_selection": "any_player_with_sin",
  "effects": {
    "self": {"money": 2000, "sin": 2},
    "target": {"mental_health": -2, "money": -2000}
  }
}
```

### Group Decision Cards
Cards that require group consensus or voting:
```json
{
  "title": "Neighborhood Watch Formation",
  "type": "group_vote",
  "effects_if_passed": {
    "all_players": {"virtue": 1, "money": -100}
  }
}
```

## Moral Complexity Design

### Gray Area Choices
Many cards avoid clear moral boundaries:
- Reporting tax evasion (virtue) vs. loyalty to friend (relationship cost)
- Taking a high-paying job at unethical company
- Accepting help when struggling vs. maintaining independence

### Contextual Morality
Card effects can vary based on player state:
- Stealing food when bankrupt vs. when wealthy
- Lying to protect someone vs. lying for personal gain

### Long-term Consequences
Some cards create delayed moral dilemmas:
- Today's virtue choice creates tomorrow's temptation
- Sin choices compound over time
- Past virtues can be tested by future circumstances

## Content Creation Guidelines

### Writing Tone
- **Satirical but not cynical:** Find humor without losing empathy
- **Relatable scenarios:** Draw from common life experiences
- **Authentic dialogue:** Reflect how people actually speak and think

### Balance Principles
- Every benefit should have a potential cost
- Virtue shouldn't always be the "optimal" choice
- Sin should be genuinely tempting, not obviously stupid
- Chaos should feel random but meaningful

### Cultural Sensitivity
- Address real issues without trivializing serious problems
- Include diverse perspectives and experiences
- Avoid stereotypes while acknowledging social realities

## Expansion System

### Modular Design
New card sets can be added without changing core mechanics:
- Theme-specific expansions (e.g., "College Years," "Midlife Crisis")
- Cultural variant sets for different regions
- Seasonal or event-based temporary additions

### Community Content
- Template system allows player-created cards
- Voting mechanism for community approval
- Integration tools for custom game modes

---

*The card system transforms abstract life choices into concrete game mechanics, creating moments of genuine moral reflection disguised as entertainment.*
