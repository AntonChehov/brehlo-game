import { computed, ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/** Событие Chromium-браузеров; в стандартных типах DOM его нет. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'prompt' | 'ios' | 'manual' | 'insecure'

const INSTALLED_KEY = 'brehlo:installed'

function readInstalledFlag(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1'
  } catch {
    return false
  }
}

function writeInstalledFlag(value: boolean) {
  try {
    if (value) localStorage.setItem(INSTALLED_KEY, '1')
    else localStorage.removeItem(INSTALLED_KEY)
  } catch {
    // Без хранилища кнопка просто покажется снова — не критично.
  }
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

/**
 * Игра установлена на этом устройстве. Флаг ставится по appinstalled и намеренно не сбрасывается
 * по beforeinstallprompt: Chrome присылает его и после установки ярлыком (например, с локального
 * адреса), из-за чего кнопка возвращалась после перезагрузки. Удалившие игру жмут «Установить снова».
 */
const installed = ref(readInstalledFlag())

function markInstalled(value: boolean) {
  installed.value = value
  writeInstalledFlag(value)
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

// Слушатели вешаются при импорте модуля: beforeinstallprompt может прийти до монтирования компонентов.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredPrompt.value = event as BeforeInstallPromptEvent
})
window.addEventListener('appinstalled', () => {
  markInstalled(true)
  deferredPrompt.value = null
})

// autoUpdate: новая версия service worker сразу берёт управление и перезагружает страницу.
if (window.isSecureContext && 'serviceWorker' in navigator) registerSW({ immediate: true })

export function useInstall() {
  const platform = computed<InstallPlatform>(() => {
    if (deferredPrompt.value) return 'prompt'
    if (!window.isSecureContext) return 'insecure'
    return isIos() ? 'ios' : 'manual'
  })

  return {
    platform,
    /** Игра запущена как установленное приложение — блок установки не нужен вовсе. */
    isStandalone: isStandalone(),
    /** Игра установлена, но открыта во вкладке браузера. */
    installed,
    async promptInstall(): Promise<void> {
      const event = deferredPrompt.value
      if (!event) return
      await event.prompt()
      const { outcome } = await event.userChoice
      deferredPrompt.value = null
      if (outcome === 'accepted') markInstalled(true)
    },
    /** Пользователь говорит, что удалил игру, — снова показываем установку. */
    resetInstalled() {
      markInstalled(false)
    },
  }
}
