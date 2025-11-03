import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swPath = resolve(__dirname, '../sw.js');

const swSource = await readFile(swPath, 'utf-8');

const listeners = new Map();
const getListeners = (event) => {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  return listeners.get(event);
};

const cacheStores = new Map();
const failUrls = new Set();

const cacheLogs = {
  local: new Set(),
  external: new Set(),
  warnings: []
};

const toKey = (request) => {
  if (!request) return '';
  if (typeof request === 'string') return request;
  if (request.url) return request.url;
  return String(request);
};

class Response {
  constructor(body = '', init = {}) {
    this._body = body;
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? 'OK';
    this.headers = init.headers ?? {};
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  clone() {
    return new Response(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: { ...this.headers }
    });
  }

  async text() {
    return this._body;
  }
}

const testState = {
  networkShouldFail: false
};

const context = {
  console: {
    log: (...args) => void 0,
    warn: (...args) => cacheLogs.warnings.push(args.join(' ')),
    error: console.error
  },
  self: {
    registration: {
      showNotification: async () => {}
    },
    addEventListener: (type, handler) => {
      getListeners(type).push(handler);
    }
  },
  clients: {
    openWindow: async (url) => url
  },
  caches: {
    async open(name) {
      if (!cacheStores.has(name)) {
        cacheStores.set(name, new Map());
      }
      const store = cacheStores.get(name);
      return {
        async addAll(urls) {
          for (const url of urls) {
            await this.add(url);
          }
        },
        async add(request) {
          const key = toKey(request);
          if (failUrls.has(key)) {
            throw new Error(`Mocked failure for ${key}`);
          }
          const isExternal = /^https?:\/\//.test(key);
          store.set(key, `cached:${key}`);
          if (isExternal) {
            cacheLogs.external.add(key);
          } else {
            cacheLogs.local.add(key);
          }
        },
        async match(request) {
          const key = toKey(request);
          if (store.has(key)) {
            return new Response(store.get(key));
          }
          return undefined;
        },
        async put(request, response) {
          const key = toKey(request);
          const body = await response.text();
          store.set(key, body);
        }
      };
    },
    async match(request) {
      const key = toKey(request);
      for (const store of cacheStores.values()) {
        if (store.has(key)) {
          return new Response(store.get(key));
        }
      }
      return undefined;
    }
  },
  fetch: async (request) => {
    if (testState.networkShouldFail) {
      throw new Error('Network unavailable');
    }
    const key = toKey(request);
    return new Response(`network:${key}`);
  },
  Response,
  Request: class Request {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.mode = options.mode || 'cors';
    }
  },
  setTimeout,
  clearTimeout
};

context.globalThis = context.self;
context.Response = Response;
context.__testState = testState;

vm.runInNewContext(swSource, context);

const cacheNameMatch = swSource.match(/const CACHE_NAME\s*=\s*'([^']+)'/);
const cacheName = cacheNameMatch ? cacheNameMatch[1] : 'amex-store-v4';

const runInstall = async () => {
  const handlers = getListeners('install');
  if (!handlers.length) {
    throw new Error('Nenhum handler de install registrado.');
  }
  const event = {
    waitUntil(promise) {
      this.promises.push(promise);
    },
    promises: []
  };
  handlers.forEach((handler) => handler(event));
  await Promise.all(event.promises);
};

const runFetch = async (request) => {
  const handlers = getListeners('fetch');
  if (!handlers.length) {
    throw new Error('Nenhum handler de fetch registrado.');
  }
  const event = {
    request,
    respondWith(promise) {
      this.responsePromise = promise;
    }
  };
  handlers.forEach((handler) => handler(event));
  return event.responsePromise ? event.responsePromise : undefined;
};

try {
  await runInstall();

  if (!cacheStores.has(cacheName)) {
    throw new Error('Cache principal não foi criado durante o install.');
  }

  const mainCache = cacheStores.get(cacheName);
  if (cacheLogs.local.size === 0) {
    throw new Error('Nenhum ativo local foi armazenado durante o install.');
  }

  testState.networkShouldFail = false;
  const successRequest = { url: 'https://example.com/api/data', method: 'GET', mode: 'cors' };
  const successResponse = await runFetch(successRequest);
  const successBody = successResponse ? await successResponse.text() : null;

  if (!successBody?.startsWith('network:')) {
    throw new Error('Resposta de rede não foi retornada no modo online.');
  }

  if (!mainCache.has(successRequest.url)) {
    throw new Error('Resposta de rede não foi armazenada em cache.');
  }

  testState.networkShouldFail = true;
  const offlineRequest = { url: 'https://example.com/offline', method: 'GET', mode: 'navigate' };
  const offlinePromise = await runFetch(offlineRequest);
  const offlineResponse = offlinePromise ? await offlinePromise : undefined;
  const offlineBody = offlineResponse ? await offlineResponse.text() : null;

  if (!offlineBody || !offlineBody.startsWith('cached:./')) {
    throw new Error('Fallback offline não retornou o shell principal.');
  }

  console.log('✅ Service worker testado com sucesso.');
  console.log(`   → ${cacheLogs.local.size} ativos locais armazenados; ${cacheLogs.external.size} externos.`);
  console.log(`   → Avisos capturados para falhas externas: ${cacheLogs.warnings.length}.`);
} catch (error) {
  console.error('❌ Falha ao testar o service worker:', error);
  process.exitCode = 1;
}
