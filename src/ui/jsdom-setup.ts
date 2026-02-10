// Vitest jsdom setup file
// Fixes localStorage override issue on Node.js v25+ where the built-in
// localStorage (without standard Web Storage API methods) takes precedence
// over jsdom's localStorage in vitest's populateGlobal.

declare const jsdom: { window: Window & typeof globalThis } | undefined;

if (typeof jsdom !== 'undefined') {
  const win = jsdom.window;
  if (win.localStorage && typeof win.localStorage.clear === 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: win.localStorage,
      configurable: true,
      writable: true,
    });
  }
}
