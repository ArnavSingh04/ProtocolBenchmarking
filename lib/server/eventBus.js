import { EventEmitter } from "events";

// Hang the event bus off globalThis so it is a true singleton even when
// Next.js dev re-evaluates this module (HMR / on-demand route compilation).
// Otherwise an in-flight run's emitter and the SSE listeners could end up on
// different instances after a reload.
const globalScope = globalThis;

if (!globalScope.__protocolRunEventBus) {
  const bus = new EventEmitter();
  bus.setMaxListeners(0);
  globalScope.__protocolRunEventBus = bus;
}

export const runEventBus = globalScope.__protocolRunEventBus;
