let callHandler = null;

export function setMeteorCallHandler(handler) {
  callHandler = handler;
}

export const Meteor = {
  call(methodName, ...args) {
    if (typeof callHandler === "function") {
      return callHandler(methodName, ...args);
    }
    return null;
  }
};
