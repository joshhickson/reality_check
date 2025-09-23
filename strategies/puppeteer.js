class PuppeteerStrategy {
    chooseAction(me, players) {
        // Priority 1: Play cards that give Social Capital
        if (me.stats.actionPoints >= 1 && me.hand.length > 0) {
            const scCards = me.hand.filter(card => card.socialCapital && parseInt(card.socialCapital) > 0);
            if (scCards.length > 0) {
                scCards.sort((a, b) => parseInt(b.socialCapital) - parseInt(a.socialCapital));
                return { type: 'PLAY_CARD', payload: { cardId: scCards[0].id } };
            }
        }

        // Priority 2: Spend momentum for a chance at a Life Happens card with SC
        if (me.stats.narrativeMomentum >= 5) {
            return { type: 'SPEND_MOMENTUM' };
        }

        // Priority 3: Draw from the Virtue deck
        if (me.stats.actionPoints >= 1 && me.hand.length < 5 && !me.isBurnedOut) {
            return { type: 'DRAW_CARD', payload: { deck: 'VIRTUE' } };
        }

        // Fallback: If no other options, work overtime
        if (me.stats.actionPoints >= 2) {
            return { type: 'WORK_OVERTIME' };
        }

        return null;
    }

    makeDecision(pendingDecision, me, players) {
        if (pendingDecision.type === 'exile-vote') {
            const targetPlayer = players.find(p => p.id === pendingDecision.targetId);
            if (me.stats.socialCapital >= 4) {
                // Use Community Organizer to add an extra vote
                // For now, just vote to exile rich players and save poor players
                if (targetPlayer.stats.money > 25000) {
                    return { vote: true, useEffect: 'COMMUNITY_ORGANIZER' };
                } else {
                    return { vote: false, useEffect: 'COMMUNITY_ORGANIZER' };
                }
            }
            return { vote: targetPlayer.stats.money > 25000 };
        }

        let bestOptionIndex = 0;
        let maxSC = -1;

        pendingDecision.options.forEach((option, index) => {
            const scEffect = option.effects.socialCapital || 0;
            if (scEffect > maxSC) {
                maxSC = scEffect;
                bestOptionIndex = index;
            }
        });

        return bestOptionIndex;
    }

    handleReactiveEffect(pendingEffect, me) {
        if (pendingEffect.type === 'LEAN_ON_NETWORK') {
            // Always use the ability if available
            return { type: 'LEAN_ON_NETWORK', payload: { use_effect: true } };
        }
        return null;
    }

    giveTestimony(myPlayerId, players) {
        // Give Kudos to the player with the most Social Capital (other than me)
        const otherPlayers = players.filter(p => p.id !== myPlayerId);
        if (otherPlayers.length === 0) {
            return null;
        }

        const sortedBySC = [...otherPlayers].sort((a, b) => b.stats.socialCapital - a.stats.socialCapital);
        const kudosTarget = sortedBySC[0];

        // Give Concern to the player with the least Social Capital
        const concernTarget = sortedBySC[sortedBySC.length - 1];

        return {
            kudosTargetId: kudosTarget.id,
            concernTargetId: concernTarget.id
        };
    }
}

module.exports = { PuppeteerStrategy };
