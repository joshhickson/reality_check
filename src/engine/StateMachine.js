class StateMachine {
  #currentState = 'Idle';
  #context;
  #transitions = [];
  #stateEnterCallbacks = new Map();
  #stateExitCallbacks = new Map();
  #autoTransitionTimers = new Map();

  constructor(initialContext = {}) {
    this.#context = {
      currentPlayer: '',
      turnNumber: 1,
      timeRemaining: 30,
      ...initialContext
    };

    this.#setupDefaultTransitions();
  }

  #setupDefaultTransitions() {
    // Define the core game flow
    this.addTransition('Idle', 'Roll', () => true);
    this.addTransition('Roll', 'Tile', () => true);
    this.addTransition('Tile', 'Card', () => true);
    this.addTransition('Card', 'Decision', () => !!this.#context.pendingDecision);
    this.addTransition('Card', 'EndTurn', () => !this.#context.pendingDecision);
    this.addTransition('Decision', 'EndTurn', () => true);
    this.addTransition('EndTurn', 'Idle', () => true);

    // Auto-transitions on timer expiry
    this.onEnterState('Roll', () => {
      this.#setAutoTransition('Roll', 'Tile', 5000); // 5 seconds to roll
    });

    this.onEnterState('Decision', () => {
      this.#setAutoTransition('Decision', 'EndTurn', 30000); // 30 seconds to decide
    });
  }

  addTransition(from, to, condition, action) {
    this.#transitions.push({ from, to, condition, action });
  }

  onEnterState(state, callback) {
    if (!this.#stateEnterCallbacks.has(state)) {
      this.#stateEnterCallbacks.set(state, []);
    }
    this.#stateEnterCallbacks.get(state).push(callback);
  }

  onExitState(state, callback) {
    if (!this.#stateExitCallbacks.has(state)) {
      this.#stateExitCallbacks.set(state, []);
    }
    this.#stateExitCallbacks.get(state).push(callback);
  }

  #setAutoTransition(fromState, toState, delayMs) {
    // Clear existing timer for this state
    if (this.#autoTransitionTimers.has(fromState)) {
      clearTimeout(this.#autoTransitionTimers.get(fromState));
    }

    const timer = setTimeout(() => {
      if (this.#currentState === fromState) {
        console.log(`⏰ Auto-transitioning from ${fromState} to ${toState} (timeout)`);
        this.transition(toState);
      }
    }, delayMs);

    this.#autoTransitionTimers.set(fromState, timer);
  }

  #clearAutoTransition(state) {
    if (this.#autoTransitionTimers.has(state)) {
      clearTimeout(this.#autoTransitionTimers.get(state));
      this.#autoTransitionTimers.delete(state);
    }
  }

  transition(toState) {
    const validTransition = this.#transitions.find(t =>
      t.from === this.#currentState &&
      t.to === toState &&
      (!t.condition || t.condition())
    );

    if (!validTransition) {
      console.warn(`❌ Invalid transition from ${this.#currentState} to ${toState}`);
      return false;
    }

    // Execute exit callbacks for current state
    const exitCallbacks = this.#stateExitCallbacks.get(this.#currentState) || [];
    exitCallbacks.forEach(callback => callback());

    // Clear auto-transition timer for current state
    this.#clearAutoTransition(this.#currentState);

    const previousState = this.#currentState;
    this.#currentState = toState;

    console.log(`🔄 State transition: ${previousState} → ${toState}`);

    // Execute transition action
    if (validTransition.action) {
      validTransition.action();
    }

    // Execute enter callbacks for new state
    const enterCallbacks = this.#stateEnterCallbacks.get(toState) || [];
    enterCallbacks.forEach(callback => callback());

    return true;
  }

  getCurrentState() {
    return this.#currentState;
  }

  getContext() {
    return { ...this.#context };
  }

  updateContext(updates) {
    this.#context = { ...this.#context, ...updates };
  }

  canPlayerAct() {
    return ['Roll', 'Decision'].includes(this.#currentState);
  }

  isWaitingForInput() {
    return ['Roll', 'Decision'].includes(this.#currentState);
  }

  forceTransitionOnTimeout() {
    if (this.#currentState === 'Roll') {
      this.transition('Tile');
    } else if (this.#currentState === 'Decision') {
      // Auto-resolve with default choice
      this.updateContext({ pendingDecision: null });
      this.transition('EndTurn');
    }
  }

  reset() {
    // Clear all timers
    this.#autoTransitionTimers.forEach(timer => clearTimeout(timer));
    this.#autoTransitionTimers.clear();

    this.#currentState = 'Idle';
    this.#context = {
      currentPlayer: '',
      turnNumber: 1,
      timeRemaining: 30
    };
  }
}

module.exports = { StateMachine };
