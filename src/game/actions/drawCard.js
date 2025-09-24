function handleDrawCard(player, game, payload) {
  const cost = player.isBurnedOut ? 2 : 1;

  if (player.hand.length >= game.maxHandSize) {
    // This should ideally emit an error back to the user
    console.error(`[ACTION_ERROR] Player ${player.name} hand is full.`);
    return false;
  }

  if (player.stats.actionPoints >= cost) {
    player.stats.actionPoints -= cost;
    let card;
    if (payload.deck === 'SIN') {
      card = game.sinDeck.draw();
    } else if (payload.deck === 'VIRTUE') {
      card = game.virtueDeck.draw();
    }
    if (card) {
      player.hand.push(card);
    }
    player.applyEffects({ narrativeMomentum: 1 });
    return true;
  }
  return false;
}

module.exports = { handleDrawCard };
