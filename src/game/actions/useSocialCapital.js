function handleUseSocialCapital(player) {
  // For now, only implementing "Lean on Your Network"
  const sc_cost = 2;
  const ap_cost = 1;
  if (player.stats.socialCapital >= sc_cost && player.stats.actionPoints >= ap_cost) {
    player.stats.actionPoints -= ap_cost;
    player.applyEffects({ socialCapital: -sc_cost, mentalHealth: 2 });
    return true;
  }
  return false;
}

module.exports = { handleUseSocialCapital };
