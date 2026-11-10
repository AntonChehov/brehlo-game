import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Состояние игры — синглтон модуля, поэтому каждый тест импортирует App заново.
async function mountApp() {
  vi.resetModules()
  const { default: App } = await import('./App.vue')
  return mount(App, { attachTo: document.body })
}

const button = (wrapper: VueWrapper, text: string) => {
  const found = wrapper.findAll('button').find((b) => b.text().includes(text))
  if (!found) throw new Error(`Кнопка «${text}» не найдена`)
  return found
}

const adultPack = (wrapper: VueWrapper) => button(wrapper, '18+')
const save = (state: object) => localStorage.setItem('brehlo:v1', JSON.stringify(state))

describe('полный раунд', () => {
  beforeEach(() => localStorage.clear())

  it('раздаёт карточки по кругу и доходит до результата', async () => {
    const wrapper = await mountApp()
    const inputs = wrapper.findAll('.players__input')
    for (const [i, name] of ['Аня', 'Боря', 'Вика'].entries()) await inputs[i]!.setValue(name)
    await wrapper.findAll('button[aria-label^="Удалить"]')[3]!.trigger('click')
    await button(wrapper, 'Дальше').trigger('click')
    await button(wrapper, 'Начать игру').trigger('click')

    const cards = new Map<string, string>()
    for (let i = 0; i < 3; i++) {
      const name = wrapper.find('.big-name').text()
      await button(wrapper, 'показать').trigger('click')
      const next = wrapper.findAll('.screen__actions button').at(-1)!
      expect(next.attributes('disabled')).toBeDefined()

      await wrapper.find('.secret').trigger('pointerdown')
      cards.set(name, wrapper.find('.secret').text())
      await wrapper.find('.secret').trigger('pointerup')
      expect(wrapper.find('.secret').text()).toContain('Нажмите и держите')

      await next.trigger('click')
    }

    const brehloCards = [...cards.values()].filter((c) => c.includes('БРЕХЛО'))
    // С сюрпризами возможны 0 или 3 брехла — в обычном раунде ровно одно.
    expect([0, 1, 3]).toContain(brehloCards.length)

    expect(wrapper.text()).toContain('Ассоциации начинает')

    // Напоминание показывает игроку ту же карточку, что и при раздаче.
    await button(wrapper, 'Напомнить слово').trigger('click')
    await button(wrapper, 'Боря').trigger('click')
    await button(wrapper, 'Я Боря, показать').trigger('click')
    await wrapper.find('.secret').trigger('pointerdown')
    expect(wrapper.find('.secret').text()).toBe(cards.get('Боря'))
    await wrapper.find('.secret').trigger('pointerup')
    await button(wrapper, 'Вспомнил').trigger('click')

    await button(wrapper, 'Голосуем').trigger('click')
    await wrapper.findAll('input[name="suspect"]')[0]!.setValue(true)
    await button(wrapper, 'Вскрываемся').trigger('click')
    await flushPromises()

    expect(wrapper.find('.title').exists()).toBe(true)
    wrapper.unmount()
  })

  it('не даёт начать без категорий', async () => {
    const wrapper = await mountApp()
    await button(wrapper, 'Дальше').trigger('click')
    for (const pack of wrapper.findAll('.pack--on')) await pack.trigger('click')
    expect(button(wrapper, 'Начать игру').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Выберите хотя бы одну категорию')

    await button(wrapper, 'Игроки').trigger('click')
    expect(wrapper.findAll('.players__input')).toHaveLength(4)
    wrapper.unmount()
  })
})

describe('категория 18+', () => {
  beforeEach(() => localStorage.clear())

  it('включается только после подтверждения возраста', async () => {
    const wrapper = await mountApp()
    await button(wrapper, 'Дальше').trigger('click')
    expect(adultPack(wrapper).attributes('aria-pressed')).toBe('false')

    await adultPack(wrapper).trigger('click')
    expect(wrapper.text()).toContain('Вам есть 18 лет?')
    await button(wrapper, 'Нет').trigger('click')
    expect(wrapper.text()).not.toContain('Вам есть 18 лет?')
    expect(adultPack(wrapper).attributes('aria-pressed')).toBe('false')

    await adultPack(wrapper).trigger('click')
    await button(wrapper, 'Да, мне есть 18').trigger('click')
    expect(adultPack(wrapper).attributes('aria-pressed')).toBe('true')

    // Подтверждение запоминается: повторно возраст не спрашиваем.
    await adultPack(wrapper).trigger('click')
    await adultPack(wrapper).trigger('click')
    expect(wrapper.text()).not.toContain('Вам есть 18 лет?')
    expect(adultPack(wrapper).attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })
})

describe('восстановление сохранённой игры', () => {
  beforeEach(() => localStorage.clear())

  it('не включает 18+ из сохранения без подтверждённого возраста', async () => {
    save({ settings: { packIds: ['animals', 'adult'] }, adultConfirmed: false })
    const wrapper = await mountApp()
    await button(wrapper, 'Дальше').trigger('click')

    expect(button(wrapper, '18+').attributes('aria-pressed')).toBe('false')
    expect(button(wrapper, 'Животные').attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('оставляет 18+, если возраст уже подтверждали', async () => {
    save({ settings: { packIds: ['adult'] }, adultConfirmed: true })
    const wrapper = await mountApp()
    await button(wrapper, 'Дальше').trigger('click')

    expect(button(wrapper, '18+').attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('отбрасывает неизвестные категории и открывает настройки, если раунда нет', async () => {
    save({ screen: 'vote', round: null, players: ['Аня', 'Боря', 'Вика'], settings: { packIds: ['removed-pack', 'memes'] } })
    const wrapper = await mountApp()

    expect(wrapper.findAll('.players__input').map((input) => (input.element as HTMLInputElement).value)).toEqual([
      'Аня',
      'Боря',
      'Вика',
    ])
    await button(wrapper, 'Дальше').trigger('click')
    expect(wrapper.findAll('.pack--on').map((pack) => pack.find('.pack__title').text())).toEqual(['Мемы'])
    wrapper.unmount()
  })

  it('продолжает начатый раунд после перезагрузки', async () => {
    const wrapper = await mountApp()
    await button(wrapper, 'Дальше').trigger('click')
    await button(wrapper, 'Начать игру').trigger('click')
    const firstPlayer = wrapper.find('.big-name').text()
    wrapper.unmount()

    const restored = await mountApp()
    expect(restored.find('.big-name').text()).toBe(firstPlayer)
    expect(restored.text()).toContain('карточка 1 из 4')
    restored.unmount()
  })
})
