class AgitatorStrategy {

    getDisruptionScore(card) {
        let score = 0;
        if (!card.effects) return score;

        if (card.effects.money) score += Math.abs(card.effects.money) / 100;
        if (card.effects.mentalHealth) score += Math.abs(card.effects.mentalHealth) * 2;
        if (card.effects.socialCapital) score += Math.abs(card.effects.socialCapital) * 3;

        if (card.target === 'all_other_players') {
            score *= 1.5;
        }

        return score;
    }

    chooseAction(me, gameState) {
        if (!me.isExiled) {
            return this.randomAction(me);
        }

        const isBurnedOut = me.stats.mentalHealth <= 3;

        let bestPlayableSinCard = null;
        let maxDisruption = -1;

        const leader = gameState.players
            .filter(p => p.id !== me.id && !p.isExiled)
            .sort((a, b) => b.score - a.score)[0];

        for (const card of me.hand) {
            if (card.deck === 'SIN') {
                const disruptionScore = this.getDisruptionScore(card);
                const canAfford = !card.effects.mentalHealth || (me.stats.mentalHealth > Math.abs(card.effects.mentalHealth));
                if (disruptionScore > maxDisruption && canAfford) {
                    maxDisruption = disruptionScore;
                    bestPlayableSinCard = card;
                }
            }
        }

        const canPlayCard = me.stats.actionPoints >= 1 && bestPlayableSinCard;
        const canWork = me.stats.actionPoints >= 2;

        if (canPlayCard && maxDisruption > 5) {
             const action = { type: 'PLAY_CARD', payload: { cardId: bestPlayableSinCard.id } };
             if (bestPlayableSinCard.target === 'player' && leader) {
                action.payload.targetId = leader.id;
             }
             return action;
        }

        if (canWork) {
            return { type: 'WORK_OVERTIME' };
        }

        if (canPlayCard) {
            const action = { type: 'PLAY_CARD', payload: { cardId: bestPlayableSinCard.id } };
             if (bestPlayableSinCard.target === 'player' && leader) {
                action.payload.targetId = leader.id;
             }
             return action;
        }

        return this.randomAction(me);
    }

    randomAction(me) {
        const isBurnedOut = me.stats.mentalHealth <= 3;
        const possibleActions = [];
        if (me.stats.actionPoints >= 2) possibleActions.push({ type: 'WORK_OVERTIME' });
        if (me.stats.actionPoints >= 1 && me.hand.length < 5 && !isBurnedOut) possibleActions.push({ type: 'DRAW_CARD' });
        if (me.stats.actionPoints >= 1 && me.hand.length > 0) possibleActions.push({ type: 'PLAY_CARD' });
        if (me.stats.narrativeMomentum >= 5) possibleActions.push({ type: 'SPEND_MOMENTUM' });
        if (possibleActions.length === 0) return null;

        let action = possibleActions[Math.floor(Math.random() * possibleActions.length)];
        if (action.type === 'DRAW_CARD') action.payload = { deck: Math.random() > 0.5 ? 'SIN' : 'VIRTUE' };
        if (action.type === 'PLAY_CARD') action.payload = { cardId: me.hand[Math.floor(Math.random() * me.hand.length)].id };
        return action;
    }

    makeDecision(pendingDecision) {
        if (pendingDecision.type === 'PROPOSE_EXILE') {
            return 0;
        }
        if (pendingDecision.type === 'exile-vote') {
            return 0;
        }
        return Math.floor(Math.random() * pendingDecision.options.length);
    }

    giveTestimony(myPlayerId, players) {
        const otherPlayers = players.filter(p => p.id !== myPlayerId);
        if (otherPlayers.length === 0) return null;
        const kudosTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        const concernTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        return { kudosTargetId: kudosTarget.id, concernTargetId: concernTarget.id };
    }

    handleReactiveEffect(pendingEffect, me) {
        return { type: pendingEffect.type, payload: { use_effect: false } };
    }
}

module.exports = { AgitatorStrategy };