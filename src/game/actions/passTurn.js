function handlePassTurn(player) {
  player.stats.actionPoints = 0;
  return true;
}

module.exports = { handlePassTurn };
