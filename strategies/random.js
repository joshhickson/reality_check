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
}

module.exports = { RandomStrategy };
