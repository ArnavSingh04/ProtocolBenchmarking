import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

const localStoreDir = path.join(process.cwd(), ".local-data");
const localStorePath = path.join(localStoreDir, "protocol-comparison-store.json");
// Keep the test runner hermetic: use pure in-memory state, never touch disk.
const USE_FILE_STORE = process.env.NODE_ENV !== "test";

// The store and Mongo connection are hung off globalThis so they survive
// Next.js dev module re-evaluation. Without this, an in-flight benchmark's
// writes could land in a reset store, leaving the run stuck as "running".
const globalScope = globalThis;
if (!globalScope.__protocolStore) {
  globalScope.__protocolStore = {
    clientPromise: undefined,
    localStoreLoaded: false,
    data: { testRuns: [], testResults: [], testLogs: [], protocols: [] }
  };
}
const store$ = globalScope.__protocolStore;
const inMemoryState = store$.data;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureLocalStoreLoaded() {
  if (store$.localStoreLoaded) {
    return;
  }

  if (!USE_FILE_STORE) {
    store$.localStoreLoaded = true;
    return;
  }

  try {
    if (!fs.existsSync(localStorePath)) {
      store$.localStoreLoaded = true;
      return;
    }

    const content = fs.readFileSync(localStorePath, "utf8");
    if (!content) {
      store$.localStoreLoaded = true;
      return;
    }

    const parsed = JSON.parse(content);
    inMemoryState.testRuns = Array.isArray(parsed.testRuns) ? parsed.testRuns : [];
    inMemoryState.testResults = Array.isArray(parsed.testResults)
      ? parsed.testResults
      : [];
    inMemoryState.testLogs = Array.isArray(parsed.testLogs) ? parsed.testLogs : [];
    inMemoryState.protocols = Array.isArray(parsed.protocols) ? parsed.protocols : [];
  } catch (error) {
    console.error("Failed to read local fallback store:", error.message);
  } finally {
    store$.localStoreLoaded = true;
  }
}

function persistLocalStore() {
  if (!USE_FILE_STORE) return;
  try {
    if (!fs.existsSync(localStoreDir)) {
      fs.mkdirSync(localStoreDir, { recursive: true });
    }
    fs.writeFileSync(localStorePath, JSON.stringify(inMemoryState, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to persist local fallback store:", error.message);
  }
}

function matchesQuery(document, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    return document?.[key] === expected;
  });
}

function applySort(items, sort = {}) {
  const entries = Object.entries(sort);
  if (entries.length === 0) {
    return items;
  }

  return [...items].sort((a, b) => {
    for (const [field, direction] of entries) {
      const aValue = a?.[field];
      const bValue = b?.[field];

      if (aValue === bValue) {
        continue;
      }

      if (aValue === undefined || aValue === null) {
        return 1;
      }
      if (bValue === undefined || bValue === null) {
        return -1;
      }

      if (aValue > bValue) {
        return direction >= 0 ? 1 : -1;
      }
      if (aValue < bValue) {
        return direction >= 0 ? -1 : 1;
      }
    }
    return 0;
  });
}

function getMemoryCollection(name) {
  ensureLocalStoreLoaded();
  const store = inMemoryState[name];

  return {
    async createIndex() {
      return `${name}_noop_index`;
    },
    async countDocuments(query = {}) {
      return store.filter((document) => matchesQuery(document, query)).length;
    },
    async insertOne(document) {
      store.push(clone(document));
      persistLocalStore();
      return { acknowledged: true };
    },
    async insertMany(documents) {
      store.push(...documents.map(clone));
      persistLocalStore();
      return { acknowledged: true };
    },
    async updateOne(query, updates) {
      const index = store.findIndex((document) => matchesQuery(document, query));
      if (index === -1) {
        return { matchedCount: 0, modifiedCount: 0 };
      }

      if (updates?.$set && typeof updates.$set === "object") {
        store[index] = { ...store[index], ...clone(updates.$set) };
      }
      persistLocalStore();

      return { matchedCount: 1, modifiedCount: 1 };
    },
    async findOne(query) {
      const found = store.find((document) => matchesQuery(document, query));
      return found ? clone(found) : null;
    },
    find(query = {}, options = {}) {
      const filtered = store.filter((document) => matchesQuery(document, query));
      const sorted = applySort(filtered, options.sort);
      const limited =
        typeof options.limit === "number" ? sorted.slice(0, options.limit) : sorted;

      return {
        async toArray() {
          return clone(limited);
        }
      };
    }
  };
}

function getClientPromise() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    throw new Error("MONGO_URL is not set");
  }

  if (!store$.clientPromise) {
    const client = new MongoClient(uri);
    store$.clientPromise = client.connect();
  }
  return store$.clientPromise;
}

function inferDbName() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    return "meteor";
  }

  try {
    const parsed = new URL(uri);
    return parsed.pathname?.replace(/^\//, "") || "meteor";
  } catch {
    return "meteor";
  }
}

export async function getDb() {
  if (!process.env.MONGO_URL) {
    return {
      collection(name) {
        return getMemoryCollection(name);
      }
    };
  }

  const client = await getClientPromise();
  return client.db(process.env.MONGO_DB_NAME || inferDbName());
}

export async function getCollections() {
  const db = await getDb();
  return {
    testRuns: db.collection("testRuns"),
    testResults: db.collection("testResults"),
    testLogs: db.collection("testLogs"),
    protocols: db.collection("protocols")
  };
}
