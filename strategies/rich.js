const { RandomStrategy } = require('./random.js');

// This strategy is identical to the RandomStrategy, but it will be used
// to identify the bot that should start with extra money in the test scenario.
class RichStrategy extends RandomStrategy {}

module.exports = { RichStrategy };