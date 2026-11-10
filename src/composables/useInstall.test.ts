import { beforeEach, describe, expect, it, vi } from 'vitest'

// Модуль вешает слушатели при импорте, поэтому каждый раз импортируем его заново.
async function freshInstall() {
  vi.resetModules()
  const { useInstall } = await import('./useInstall')
  return useInstall()
}

describe('useInstall', () => {
  beforeEach(() => localStorage.clear())

  it('помнит установку после перезагрузки вкладки', async () => {
    const first = await freshInstall()
    expect(first.installed.value).toBe(false)

    window.dispatchEvent(new Event('appinstalled'))
    expect(first.installed.value).toBe(true)

    const afterReload = await freshInstall()
    expect(afterReload.installed.value).toBe(true)
  })

  it('не сбрасывает установку, когда Chrome снова присылает beforeinstallprompt', async () => {
    localStorage.setItem('brehlo:installed', '1')
    const install = await freshInstall()
    window.dispatchEvent(installPromptEvent('dismissed'))

    expect(install.installed.value).toBe(true)
    expect(localStorage.getItem('brehlo:installed')).toBe('1')
  })

  it('«Установить снова» возвращает кнопку установки', async () => {
    localStorage.setItem('brehlo:installed', '1')
    const install = await freshInstall()
    install.resetInstalled()

    expect(install.installed.value).toBe(false)
    expect(localStorage.getItem('brehlo:installed')).toBeNull()
  })

  it('принятая установка запоминается, даже если appinstalled не пришёл', async () => {
    const install = await freshInstall()
    window.dispatchEvent(installPromptEvent('accepted'))
    expect(install.platform.value).toBe('prompt')

    await install.promptInstall()
    expect(install.installed.value).toBe(true)
  })
})

function installPromptEvent(outcome: 'accepted' | 'dismissed') {
  return Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: async () => undefined,
    userChoice: Promise.resolve({ outcome }),
  })
}
