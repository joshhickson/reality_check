function handleSpendMomentum(player, game) {
  const cost = 5;
  if (player.stats.narrativeMomentum >= cost) {
    player.stats.narrativeMomentum -= cost;
    const card = game.lifeHappensDeck.draw();
    if (card) {
      game.pendingDecision = {
        type: 'LIFE_HAPPENS',
        playerId: player.id,
        cardId: card.id,
        text: card.text,
        options: card.choices
      };
    }
    return true;
  }
  return false;
}

module.exports = { handleSpendMomentum };
