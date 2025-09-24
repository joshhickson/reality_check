const { Player } = require('../src/game/Player.js');

describe('Player', () => {
  let player;

  beforeEach(() => {
    // The Player constructor expects a socket object, but for these tests,
    // we only need a mock object with an 'id' property.
    const mockSocket = { id: 'mock-socket-id' };
    player = new Player('Test Player', mockSocket);
  });

  describe('getCommunityImpactBonus', () => {
    it('should return 0 if virtue is 0', () => {
      player.stats.virtue = 0;
      expect(player.getCommunityImpactBonus()).toBe(0);
    });

    it('should return 1 for virtue between 1 and 4', () => {
      player.stats.virtue = 1;
      expect(player.getCommunityImpactBonus()).toBe(1);
      player.stats.virtue = 4;
      expect(player.getCommunityImpactBonus()).toBe(1);
    });

    it('should return 2 for virtue between 5 and 9', () => {
      player.stats.virtue = 5;
      expect(player.getCommunityImpactBonus()).toBe(2);
      player.stats.virtue = 9;
      expect(player.getCommunityImpactBonus()).toBe(2);
    });

    it('should return 3 for virtue of 10 or more', () => {
      player.stats.virtue = 10;
      expect(player.getCommunityImpactBonus()).toBe(3);
      player.stats.virtue = 15;
      expect(player.getCommunityImpactBonus()).toBe(3);
    });
  });
});
