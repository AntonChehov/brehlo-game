import { vi } from 'vitest'

// jsdom не реализует matchMedia и <dialog>.showModal и не знает виртуальный модуль vite-plugin-pwa.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false
}

vi.mock('virtual:pwa-register', () => ({ registerSW: () => async () => undefined }))
