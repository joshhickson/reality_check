class HustlerStrategy {
    chooseAction(me) {
        const possibleActions = [];

        // Evaluate all possible actions
        if (me.stats.actionPoints >= 2) {
            possibleActions.push({ type: 'WORK_OVERTIME', score: 5 }); // Reliable money
        }
        if (me.stats.actionPoints >= 1 && me.hand.length < 5 && !me.isBurnedOut) {
            possibleActions.push({ type: 'DRAW_CARD', deck: 'SIN', score: 2 }); // Sin cards are good for hustler
            possibleActions.push({ type: 'DRAW_CARD', deck: 'VIRTUE', score: 1 });
        }
        if (me.stats.actionPoints >= 1 && me.hand.length > 0) {
            me.hand.forEach(card => {
                const moneyScore = (parseInt(card.money) || 0) / 1000;
                const sinScore = (parseInt(card.sin) || 0);
                const score = moneyScore + sinScore;
                possibleActions.push({ type: 'PLAY_CARD', cardId: card.id, score });
            });
        }
        if (me.stats.narrativeMomentum >= 5) {
            possibleActions.push({ type: 'SPEND_MOMENTUM', score: 4 }); // Life happens can be profitable
        }
        if (me.stats.narrativeMomentum > 15) {
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
