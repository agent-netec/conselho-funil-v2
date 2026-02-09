import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'
import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web'
import { webcrypto } from 'node:crypto'

global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream
global.WritableStream = WritableStream

// === S35-GOV-03: MessageChannel mock leve (DT-03) ===
const mockMessagePorts = []
if (typeof globalThis.MessageChannel === 'undefined') {
  class MockMessagePort {
    constructor() {
      this.onmessage = null
      this._paired = null
      this._closed = false
    }

    postMessage(data) {
      if (this._closed || !this._paired || this._paired._closed) return
      queueMicrotask(() => {
        if (this._paired && typeof this._paired.onmessage === 'function') {
          this._paired.onmessage({ data })
        }
      })
    }

    close() {
      this._closed = true
      this.onmessage = null
      this._paired = null
    }
  }

  global.MessageChannel = class MockMessageChannel {
    constructor() {
      this.port1 = new MockMessagePort()
      this.port2 = new MockMessagePort()
      this.port1._paired = this.port2
      this.port2._paired = this.port1
      mockMessagePorts.push(this.port1, this.port2)
    }
  }
}

// Polyfill crypto.subtle for jsdom (needed by generateLocalEmbedding in rag.ts)
// jsdom provides crypto.getRandomValues but NOT crypto.subtle
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: webcrypto.subtle,
    configurable: true,
    enumerable: true,
  })
}

// Mock global Request/Response/Headers if not present
if (!global.Request) {
  global.Request = class {}
}
if (!global.Response) {
  global.Response = class {}
}
if (!global.Headers) {
  global.Headers = class {}
}

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockImplementation(() => ({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked AI Response',
        },
      }),
      embedContent: jest.fn().mockResolvedValue({
        embedding: { values: new Array(768).fill(0.1) },
      }),
      batchEmbedContents: jest.fn().mockResolvedValue({
        embeddings: [{ values: new Array(768).fill(0.1) }],
      }),
    })),
  })),
}))

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [{ name: 'mock-app' }]),
  getApp: jest.fn(),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn((query, callback) => {
    return jest.fn(); // unsubscribe
  }),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now(), toDate: () => new Date() })),
    fromDate: jest.fn(),
  },
  collectionGroup: jest.fn(),
  writeBatch: jest.fn(() => ({
    update: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}))

// === S33-GOV-02: Timer leak cleanup (DT-01) ===
afterAll(() => {
  jest.useRealTimers();
  jest.clearAllTimers();
  jest.restoreAllMocks();
  mockMessagePorts.forEach((port) => {
    if (typeof port.close === 'function') {
      port.close();
    }
  });
  mockMessagePorts.length = 0;
});

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}))
