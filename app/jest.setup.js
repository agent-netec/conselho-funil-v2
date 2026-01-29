import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'
import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web'
import { MessageChannel } from 'node:worker_threads'

global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream
global.WritableStream = WritableStream
global.MessageChannel = MessageChannel

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
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: jest.fn(),
  },
  collectionGroup: jest.fn(),
}))

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}))
