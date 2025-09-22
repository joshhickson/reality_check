class HustlerStrategy {
    chooseAction(me) {
        // Priority 1: WORK_OVERTIME, but only if not on the verge of a breakdown.
        if (me.stats.actionPoints >= 2 && me.stats.mentalHealth > 2) {
            return { type: 'WORK_OVERTIME' };
        }

        // Priority 2: Play cards from hand that give money.
        if (me.stats.actionPoints >= 1 && me.hand.length > 0) {
            const moneyCards = me.hand.filter(card => card.money && parseInt(card.money) > 0);
            if (moneyCards.length > 0) {
                // Find the card that gives the most money
                moneyCards.sort((a, b) => parseInt(b.money) - parseInt(a.money));
                return { type: 'PLAY_CARD', payload: { cardId: moneyCards[0].id } };
            }
        }

        // Priority 3: If no direct money actions, spend momentum for a chance at a big score.
        // This action costs 0 AP, so it can be a last resort.
        if (me.stats.narrativeMomentum >= 5) {
            return { type: 'SPEND_MOMENTUM' };
        }

        // Fallback: If no money-making options, just draw a card to get more options.
        if (me.stats.actionPoints >= 1 && me.hand.length < 5 && !me.isBurnedOut) {
            // Prefer Sin cards as they are more likely to have financial benefits.
            return { type: 'DRAW_CARD', payload: { deck: 'SIN' } };
        }

        // If all else fails, do nothing.
        return null;
    }

    makeDecision(pendingDecision) {
        let bestOptionIndex = 0;
        let maxMoney = -Infinity;

        pendingDecision.options.forEach((option, index) => {
            const moneyEffect = option.effects.money || 0;
            if (moneyEffect > maxMoney) {
                maxMoney = moneyEffect;
                bestOptionIndex = index;
            }
        });

        return bestOptionIndex;
    }

    giveTestimony(myPlayerId, players) {
        const otherPlayers = players.filter(p => p.id !== myPlayerId);
        if (otherPlayers.length === 0) {
            return null;
        }

        // Give Kudos to the richest player (other than me)
        const sortedByMoney = [...otherPlayers].sort((a, b) => b.stats.money - a.stats.money);
        const kudosTarget = sortedByMoney[0];

        // Give Concern to the poorest player
        const concernTarget = sortedByMoney[sortedByMoney.length - 1];

        return {
            kudosTargetId: kudosTarget.id,
            concernTargetId: concernTarget.id
        };
    }
}

module.exports = { HustlerStrategy };
