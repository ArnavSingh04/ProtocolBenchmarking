// Global test setup. jsdom-environment test files also pull in jest-dom
// matchers; guarded so node-environment tests don't fail on the import.
import { expect } from "vitest";

try {
  const matchers = await import("@testing-library/jest-dom/matchers");
  expect.extend(matchers.default || matchers);
} catch {
  // jest-dom only applies to component tests; ignore in node environment.
}
