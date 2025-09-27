class ZenStrategy {
    chooseAction(me) {
        const { actionPoints, mentalHealth, narrativeMomentum, isBurnedOut } = me.stats;
        const hand = me.hand || []; // Ensure hand is an array
        const handSize = hand.length;
        const possibleActions = [];

        // Evaluate all possible actions
        if (actionPoints >= 2) {
            possibleActions.push({ type: 'WORK_OVERTIME', score: -5 }); // Zen bot avoids this
        }
        if (actionPoints >= 1 && handSize < 5 && !isBurnedOut) {
            possibleActions.push({ type: 'DRAW_CARD', deck: 'VIRTUE', score: 5 });
            possibleActions.push({ type: 'DRAW_CARD', deck: 'SIN', score: -5 });
        }
        if (actionPoints >= 1 && handSize > 0) {
            hand.forEach(card => {
                if (!card) return; // Defensive check
                const virtueScore = (parseInt(card.virtue) || 0) * 2;
                const mentalScore = (parseInt(card.mental) || 0);
                const sinScore = (parseInt(card.sin) || 0) * 2;
                const score = virtueScore + mentalScore - sinScore;
                possibleActions.push({ type: 'PLAY_CARD', cardId: card.id, score });
            });
        }
        if (narrativeMomentum >= 5) {
            possibleActions.push({ type: 'SPEND_MOMENTUM', score: 4 });
        }
        if (narrativeMomentum > 15) {
            possibleActions.forEach(action => {
                if (action.type === 'DRAW_CARD') action.score += 5;
            });
        }

        if (possibleActions.length === 0) {
            return { type: 'PASS_TURN' };
        }

        possibleActions.sort((a, b) => b.score - a.score);
        const bestAction = possibleActions[0];

        const action = { type: bestAction.type };
        if (bestAction.type === 'DRAW_CARD') {
            action.payload = { deck: bestAction.deck };
        }
        if (bestAction.type === 'PLAY_CARD') {
            action.payload = { cardId: bestAction.cardId };
        }

        return action;
    }

    makeDecision(pendingDecision) {
        let bestOptionIndex = 0;
        let bestScore = -Infinity;

        const options = pendingDecision.type === 'crossroads' ? pendingDecision.card.choices : pendingDecision.options;

        options.forEach((option, index) => {
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
