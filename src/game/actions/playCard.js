function handlePlayCard(player, payload) {
  const cost = 1;
  if (player.stats.actionPoints >= cost) {
    const cardIndex = player.hand.findIndex(c => c.id === payload.cardId);
    if (cardIndex > -1) {
      player.stats.actionPoints -= cost;
      const cardToPlay = player.hand.splice(cardIndex, 1)[0];
      const effects = {
        money: parseInt(cardToPlay.money) || 0,
        mentalHealth: parseInt(cardToPlay.mental) || 0,
        sin: parseInt(cardToPlay.sin) || 0,
        virtue: parseInt(cardToPlay.virtue) || 0,
        socialCapital: parseInt(cardToPlay.socialCapital) || 0
      };
      player.applyEffects(effects);
      return true;
    }
  }
  return false;
}

module.exports = { handlePlayCard };
