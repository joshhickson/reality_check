
export interface RingEvent {
  id: string;
  ring: 'career' | 'health' | 'social' | 'personal' | 'babel';
  type: 'tile' | 'global';
  title: string;
  description: string;
  effects: {
    money?: number;
    mental?: number;
    sin?: number;
    virtue?: number;
  };
  triggerTurn: number;
}

export interface RingClock {
  ring: string;
  interval: number; // turns between events
  lastTrigger: number;
  nextTrigger: number;
}

export class RingScheduler {
  private clocks: Map<string, RingClock> = new Map();
  private eventQueue: RingEvent[] = [];
  private eventHistory: RingEvent[] = [];
  private currentTurn = 1;

  constructor() {
    this.initializeClocks();
    this.seedInitialEvents();
  }

  private initializeClocks(): void {
    const ringIntervals = {
      career: 4,
      health: 6,
      social: 8,
      personal: 10,
      babel: 12
    };

    Object.entries(ringIntervals).forEach(([ring, interval]) => {
      this.clocks.set(ring, {
        ring,
        interval,
        lastTrigger: 0,
        nextTrigger: interval
      });
    });
  }

  private seedInitialEvents(): void {
    // Career events
    this.scheduleEvent({
      id: 'career_1',
      ring: 'career',
      type: 'global',
      title: 'Company Restructuring',
      description: 'Your company announces layoffs. Everyone loses money but gains stress.',
      effects: { money: -1000, mental: -2 },
      triggerTurn: 4
    });

    // Health events
    this.scheduleEvent({
      id: 'health_1',
      ring: 'health',
      type: 'global',
      title: 'Flu Season',
      description: 'A nasty bug is going around. Mental health takes a hit.',
      effects: { mental: -3 },
      triggerTurn: 6
    });

    // Social events
    this.scheduleEvent({
      id: 'social_1',
      ring: 'social',
      type: 'global',
      title: 'Wedding Season',
      description: 'Everyone is getting married. Expensive gifts required.',
      effects: { money: -500, mental: 1 },
      triggerTurn: 8
    });

    // Personal events
    this.scheduleEvent({
      id: 'personal_1',
      ring: 'personal',
      type: 'global',
      title: 'New Year Resolutions',
      description: 'Time for self-improvement! Everyone gains virtue but loses money on gym memberships.',
      effects: { money: -200, virtue: 2 },
      triggerTurn: 10
    });

    // Babel events (global)
    this.scheduleEvent({
      id: 'babel_1',
      ring: 'babel',
      type: 'global',
      title: 'Social Media Drama',
      description: 'A celebrity scandal dominates the news cycle. Everyone picks sides.',
      effects: { sin: 1, mental: -1 },
      triggerTurn: 12
    });
  }

  scheduleEvent(event: RingEvent): void {
    this.eventQueue.push(event);
    this.eventQueue.sort((a, b) => a.triggerTurn - b.triggerTurn);
  }

  advanceTurn(): void {
    this.currentTurn++;
    this.updateClocks();
  }

  private updateClocks(): void {
    this.clocks.forEach((clock, ringName) => {
      if (this.currentTurn >= clock.nextTrigger) {
        // Generate a new event for this ring
        this.generateRingEvent(ringName as any);
        
        // Update clock
        clock.lastTrigger = this.currentTurn;
        clock.nextTrigger = this.currentTurn + clock.interval;
      }
    });
  }

  private generateRingEvent(ring: 'career' | 'health' | 'social' | 'personal' | 'babel'): void {
    const eventTemplates = {
      career: [
        { title: 'Performance Review', description: 'Your annual review is here. Results vary wildly.', effects: { money: Math.random() > 0.5 ? 2000 : -500 } },
        { title: 'Office Politics', description: 'Someone threw you under the bus in a meeting.', effects: { mental: -2, sin: 1 } },
        { title: 'Promotion Opportunity', description: 'A new position opened up. Competition is fierce.', effects: { mental: 1, virtue: -1 } }
      ],
      health: [
        { title: 'Doctor Visit', description: 'Routine checkup reveals you need to exercise more.', effects: { money: -300, mental: -1 } },
        { title: 'Gym Membership', description: 'You finally joined a gym. Motivation pending.', effects: { money: -50, virtue: 1 } },
        { title: 'Injury', description: 'You hurt yourself doing something stupid.', effects: { money: -800, mental: -2 } }
      ],
      social: [
        { title: 'Friend Drama', description: 'Someone in your friend group started beef.', effects: { mental: -2 } },
        { title: 'Networking Event', description: 'You went to a professional mixer and collected business cards.', effects: { money: 200, mental: 1 } },
        { title: 'Party Invitation', description: 'You have to choose between a fun party and responsibility.', effects: { mental: 2, virtue: -1 } }
      ],
      personal: [
        { title: 'Self-Help Phase', description: 'You bought seven self-help books. Read zero.', effects: { money: -150, virtue: 1 } },
        { title: 'Hobby Pursuit', description: 'You started learning something new and actually stuck with it.', effects: { mental: 3, virtue: 2 } },
        { title: 'Existential Crisis', description: 'You question all your life choices at 3 AM.', effects: { mental: -3, sin: 1 } }
      ],
      babel: [
        { title: 'Viral Meme', description: 'A new meme format has taken over social media.', effects: { mental: 1, sin: 1 } },
        { title: 'Economic News', description: 'The stock market did something unpredictable.', effects: { money: Math.random() > 0.5 ? 500 : -500 } },
        { title: 'Cultural Shift', description: 'Society collectively changed its mind about something.', effects: { virtue: Math.random() > 0.5 ? 2 : -2 } }
      ]
    };

    const templates = eventTemplates[ring];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const newEvent: RingEvent = {
      id: `${ring}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ring,
      type: 'global',
      title: template.title,
      description: template.description,
      effects: template.effects,
      triggerTurn: this.currentTurn
    };

    this.scheduleEvent(newEvent);
  }

  getActiveEvents(turnNumber: number = this.currentTurn): RingEvent[] {
    return this.eventQueue.filter(event => event.triggerTurn === turnNumber);
  }

  getUpcomingEvents(lookahead: number = 5): RingEvent[] {
    const maxTurn = this.currentTurn + lookahead;
    return this.eventQueue.filter(event => 
      event.triggerTurn > this.currentTurn && event.triggerTurn <= maxTurn
    );
  }

  processEvents(turnNumber: number = this.currentTurn): RingEvent[] {
    const activeEvents = this.getActiveEvents(turnNumber);
    
    // Move processed events to history
    activeEvents.forEach(event => {
      this.eventHistory.push(event);
      const index = this.eventQueue.indexOf(event);
      if (index > -1) {
        this.eventQueue.splice(index, 1);
      }
    });

    return activeEvents;
  }

  getCurrentTurn(): number {
    return this.currentTurn;
  }

  getClockStatus(): RingClock[] {
    return Array.from(this.clocks.values());
  }

  // Debug methods
  getTotalQueuedEvents(): number {
    return this.eventQueue.length;
  }

  getEventHistory(): RingEvent[] {
    return [...this.eventHistory];
  }
}
