class ZenStrategy {
    chooseAction(me) {
        if (me.stats.actionPoints <= 0) return null;

        const { actionPoints, mentalHealth, hand, narrativeMomentum, isBurnedOut } = me.stats;
        const handSize = me.hand.length;

        // Priority 1: If mental health is suffering, play a card to recover it.
        if (actionPoints >= 1 && mentalHealth <= 5 && handSize > 0) {
            const recoveryCards = me.hand.filter(card => card.mental && parseInt(card.mental) > 0);
            if (recoveryCards.length > 0) {
                recoveryCards.sort((a, b) => parseInt(b.mental) - parseInt(a.mental));
                return { type: 'PLAY_CARD', payload: { cardId: recoveryCards[0].id } };
            }
        }

        // Priority 2: Play cards that grant Virtue.
        if (actionPoints >= 1 && handSize > 0) {
            const virtueCards = me.hand.filter(card => card.virtue && parseInt(card.virtue) > 0);
            if (virtueCards.length > 0) {
                virtueCards.sort((a, b) => parseInt(b.virtue) - parseInt(a.virtue));
                return { type: 'PLAY_CARD', payload: { cardId: virtueCards[0].id } };
            }
        }

        // Priority 3: Draw from the Virtue deck.
        if (actionPoints >= 1 && handSize < 5 && !isBurnedOut) {
            return { type: 'DRAW_CARD', payload: { deck: 'VIRTUE' } };
        }

        // Priority 4: Spend narrative momentum for a life event.
        if (narrativeMomentum >= 5) {
            return { type: 'SPEND_MOMENTUM' };
        }

        // Last resort: Work overtime if absolutely no other choice.
        if (actionPoints >= 2) {
            return { type: 'WORK_OVERTIME' };
        }

        return null;
    }

    makeDecision(pendingDecision) {
        let bestOptionIndex = 0;
        let bestScore = -Infinity;

        pendingDecision.options.forEach((option, index) => {
            const effects = option.effects;
            const virtue = effects.virtue || 0;
            const mentalHealth = effects.mentalHealth || 0;
            const sin = effects.sin || 0;

            // Simple score: Virtue and MH are good, Sin is bad.
            const score = (virtue * 2) + mentalHealth - (sin * 2);

            if (score > bestScore) {
                bestScore = score;
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

        // Give Kudos to the most virtuous player
        const sortedByVirtue = [...otherPlayers].sort((a, b) => b.stats.virtue - a.stats.virtue);
        const kudosTarget = sortedByVirtue[0];

        // Give Concern to the most sinful player
        const sortedBySin = [...otherPlayers].sort((a, b) => b.stats.sin - a.stats.sin);
        const concernTarget = sortedBySin[0];

        return {
            kudosTargetId: kudosTarget.id,
            concernTargetId: concernTarget.id
        };
    }
}

module.exports = { ZenStrategy };
