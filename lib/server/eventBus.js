import { EventEmitter } from "events";

const runEventBus = new EventEmitter();
runEventBus.setMaxListeners(0);

export { runEventBus };
