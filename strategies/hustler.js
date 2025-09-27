class HustlerStrategy {
    chooseAction(me) {
        const { actionPoints, mentalHealth, narrativeMomentum, isBurnedOut } = me.stats;
        const hand = me.hand || [];
        const possibleActions = [];

        // Evaluate all possible actions
        if (actionPoints >= 2) {
            // Score is high when MH is high, drops off sharply.
            const workScore = Math.max(0, mentalHealth - 2);
            possibleActions.push({ type: 'WORK_OVERTIME', score: workScore });
        }

        if (actionPoints >= 1 && hand.length < 5 && !isBurnedOut) {
            // Drawing a Sin card is a priority, especially with an empty hand.
            const drawScore = hand.length === 0 ? 4 : 3;
            possibleActions.push({ type: 'DRAW_CARD', deck: 'SIN', score: drawScore });
            possibleActions.push({ type: 'DRAW_CARD', deck: 'VIRTUE', score: 0 }); // Never voluntarily draw Virtue
        }

        if (actionPoints >= 1 && hand.length > 0) {
            hand.forEach(card => {
                if (!card) return;
                // Score cards based on immediate financial gain and sin.
                const moneyScore = (parseInt(card.money) || 0) / 500; // Normalized
                const sinScore = (parseInt(card.sin) || 0) * 1.5;     // Sin is valuable
                const score = moneyScore + sinScore;
                possibleActions.push({ type: 'PLAY_CARD', cardId: card.id, score });
            });
        }

        if (narrativeMomentum >= 5) {
            // Spending momentum for a Crossroads event is a high-value, high-risk move.
            possibleActions.push({ type: 'SPEND_MOMENTUM', score: 5 });
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
        let maxMoney = -Infinity;

        const options = pendingDecision.type === 'crossroads' ? pendingDecision.card.choices : pendingDecision.options;

        options.forEach((option, index) => {
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

    handleReactiveEffect(pendingEffect, me) {
        // Hustler strategy doesn't use reactive effects, it wants to save SC
        return { type: pendingEffect.type, payload: { use_effect: false } };
    }
}

module.exports = { HustlerStrategy };
