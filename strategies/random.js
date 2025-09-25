class RandomStrategy {
    chooseAction(me) {
        const possibleActions = [];

        if (me.stats.actionPoints >= 2) {
            possibleActions.push({ type: 'WORK_OVERTIME' });
        }
        if (me.stats.actionPoints >= 1 && me.hand.length < 5 && !me.isBurnedOut) {
            possibleActions.push({ type: 'DRAW_CARD' });
        }
        if (me.stats.actionPoints >= 1 && me.hand.length > 0) {
            possibleActions.push({ type: 'PLAY_CARD' });
        }
        if (me.stats.narrativeMomentum >= 5) {
            possibleActions.push({ type: 'SPEND_MOMENTUM' });
        }

        if (possibleActions.length === 0) {
            return null;
        }

        let action = possibleActions[Math.floor(Math.random() * possibleActions.length)];

        if (action.type === 'DRAW_CARD') {
            action.payload = { deck: Math.random() > 0.5 ? 'SIN' : 'VIRTUE' };
        }
        if (action.type === 'PLAY_CARD') {
            const cardToPlay = me.hand[Math.floor(Math.random() * me.hand.length)];
            action.payload = { cardId: cardToPlay.id };
        }

        return action;
    }

    makeDecision(pendingDecision) {
        if (pendingDecision.type === 'foresight') {
            return pendingDecision.options[Math.floor(Math.random() * pendingDecision.options.length)];
        }
        if (pendingDecision.type === 'propose-exile') {
            return Math.random() > 0.5; // 50% chance to propose exile
        }
        if (pendingDecision.type === 'exile-vote') {
            return Math.random() > 0.5; // 50% chance to vote yes
        }
        return Math.floor(Math.random() * pendingDecision.options.length);
    }

    giveTestimony(myPlayerId, players) {
        const otherPlayers = players.filter(p => p.id !== myPlayerId);
        if (otherPlayers.length === 0) {
            return null;
        }

        const kudosTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        const concernTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

        return {
            kudosTargetId: kudosTarget.id,
            concernTargetId: concernTarget.id
        };
    }

    handleReactiveEffect(pendingEffect, me) {
        // Random strategy doesn't use reactive effects
        return { type: pendingEffect.type, payload: { use_effect: false } };
    }
}

module.exports = { RandomStrategy };
