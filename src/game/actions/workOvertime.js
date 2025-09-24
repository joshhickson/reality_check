function handleWorkOvertime(player) {
  const cost = 2;
  if (player.stats.actionPoints >= cost) {
    player.stats.actionPoints -= cost;
    player.applyEffects({ money: 500, mentalHealth: -1, sin: 1, narrativeMomentum: 1 });
    return true;
  }
  return false;
}

module.exports = { handleWorkOvertime };
