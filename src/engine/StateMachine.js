class StateMachine {
  #currentState = 'Waiting';
  #context;
  #transitions = [];

  constructor(initialContext = {}) {
    this.#context = { ...initialContext };
    this.#setupDefaultTransitions();
  }

  #setupDefaultTransitions() {
    this.addTransition('Waiting', 'InProgress');
    this.addTransition('InProgress', 'JudgmentDay');
    this.addTransition('JudgmentDay', 'Finished');
  }

  addTransition(from, to) {
    this.#transitions.push({ from, to });
  }

  transition(toState) {
    const validTransition = this.#transitions.find(
      t => t.from === this.#currentState && t.to === toState
    );

    if (!validTransition) {
      console.warn(`❌ Invalid transition from ${this.#currentState} to ${toState}`);
      return false;
    }

    const previousState = this.#currentState;
    this.#currentState = toState;
    console.log(`🔄 Game Phase transition: ${previousState} → ${toState}`);
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

  reset() {
    this.#currentState = 'Waiting';
    this.#context = {};
  }
}

module.exports = { StateMachine };
