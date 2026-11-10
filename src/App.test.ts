import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

/** Все случайные числа — 0: первое слово, первый игрок начинает и он же брехло. */
const fixRandom = () =>
  vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
    if (array instanceof Uint32Array) array.fill(0)
    return array
  })

/** Раздаёт карточки всем игрокам и возвращает, что увидел каждый. */
async function dealAll(wrapper: VueWrapper, count: number) {
  const cards = new Map<string, string>()
  for (let i = 0; i < count; i++) {
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
  return cards
}

async function startRound() {
  save({ players: ['Аня', 'Боря', 'Вика'], settings: { packIds: ['animals'], surpriseRounds: false } })
  const wrapper = await mountApp()
  await button(wrapper, 'Дальше').trigger('click')
  await button(wrapper, 'Начать игру').trigger('click')
  return wrapper
}

async function accuse(wrapper: VueWrapper, name: string) {
  await button(wrapper, 'Голосуем').trigger('click')
  const option = wrapper.findAll('label.option').find((label) => label.text() === name)!
  await option.find('input').setValue(true)
  await button(wrapper, 'Вскрываемся').trigger('click')
}

describe('полный раунд', () => {
  beforeEach(() => {
    localStorage.clear()
    fixRandom()
  })
  afterEach(() => vi.restoreAllMocks())

  it('раздаёт карточки по кругу: у одного «БРЕХЛО», у остальных слово', async () => {
    const wrapper = await startRound()
    const cards = await dealAll(wrapper, 3)

    expect([...cards.keys()]).toEqual(['Аня', 'Боря', 'Вика'])
    expect(cards.get('Аня')).toContain('БРЕХЛО')
    expect(cards.get('Аня')).toContain('Категория: 🦊 Животные')
    expect(cards.get('Боря')).toBe(cards.get('Вика'))
    expect(cards.get('Боря')).not.toContain('БРЕХЛО')

    expect(wrapper.find('.big-name').text()).toBe('Аня')
    expect(wrapper.findAll('.order__item').map((item) => item.text())).toEqual(['Аня', 'Боря', 'Вика'])

    // Напоминание показывает игроку ту же карточку, что и при раздаче.
    await button(wrapper, 'Напомнить слово').trigger('click')
    await button(wrapper, 'Боря').trigger('click')
    await button(wrapper, 'Я Боря, показать').trigger('click')
    await wrapper.find('.secret').trigger('pointerdown')
    expect(wrapper.find('.secret').text()).toBe(cards.get('Боря'))
    await wrapper.find('.secret').trigger('pointerup')
    await button(wrapper, 'Вспомнил').trigger('click')
    expect(wrapper.text()).toContain('Ассоциации начинает')
    wrapper.unmount()
  })

  it('пойманное брехло угадывает слово и побеждает', async () => {
    const wrapper = await startRound()
    await dealAll(wrapper, 3)
    await accuse(wrapper, 'Аня')

    expect(wrapper.find('.title').text()).toBe('Аня — брехло!')
    await button(wrapper, 'показать слово').trigger('click')
    await button(wrapper, 'Угадал(а)').trigger('click')

    expect(wrapper.find('.title').text()).toBe('Брехло победило!')
    expect(wrapper.text()).toContain('Аня раскусили, но слово угадано.')
    wrapper.unmount()
  })

  it('пойманное брехло не угадывает слово — побеждают остальные', async () => {
    const wrapper = await startRound()
    await dealAll(wrapper, 3)
    await accuse(wrapper, 'Аня')
    await button(wrapper, 'показать слово').trigger('click')
    await button(wrapper, 'Не угадал(а)').trigger('click')

    expect(wrapper.find('.title').text()).toBe('Брехло разоблачено!')
    expect(wrapper.text()).toContain('Аня так и не угадал(а) слово.')
    wrapper.unmount()
  })

  it('обвинили невиновного — брехло побеждает сразу', async () => {
    const wrapper = await startRound()
    await dealAll(wrapper, 3)
    await accuse(wrapper, 'Вика')

    expect(wrapper.find('.title').text()).toBe('Брехло победило!')
    expect(wrapper.text()).toContain('Вика — не брехло. Настоящее брехло — Аня.')
    wrapper.unmount()
  })

  it('следующий раунд начинает следующий игрок по часовой стрелке', async () => {
    const wrapper = await startRound()
    await dealAll(wrapper, 3)
    await accuse(wrapper, 'Вика')
    await button(wrapper, 'Следующий раунд').trigger('click')

    expect(wrapper.text()).toContain('Раунд 2')
    expect(wrapper.find('.big-name').text()).toBe('Боря')
    wrapper.unmount()
  })
})

describe('настройка', () => {
  beforeEach(() => localStorage.clear())

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
