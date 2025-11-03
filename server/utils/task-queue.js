export class TaskQueue {
  #queue = [];
  #active = 0;
  #concurrency;
  #onError;

  constructor({ concurrency = 1, onError = () => {} } = {}) {
    this.#concurrency = Number.isFinite(concurrency) && concurrency > 0
      ? Math.floor(concurrency)
      : 1;
    this.#onError = typeof onError === 'function' ? onError : () => {};
  }

  add(task) {
    if (typeof task !== 'function') {
      throw new TypeError('Task must be a function');
    }

    return new Promise((resolve, reject) => {
      this.#queue.push({ task, resolve, reject });
      this.#run();
    });
  }

  get size() {
    return this.#queue.length;
  }

  get active() {
    return this.#active;
  }

  #run() {
    while (this.#active < this.#concurrency && this.#queue.length > 0) {
      const { task, resolve, reject } = this.#queue.shift();

      this.#active++;
      Promise.resolve()
        .then(task)
        .then(resolve)
        .catch((error) => {
          try {
            this.#onError(error);
          } catch {
            // ignore onError failures
          }
          reject(error);
        })
        .finally(() => {
          this.#active--;
          this.#run();
        });
    }
  }
}
