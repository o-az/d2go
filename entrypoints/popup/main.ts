import { browser } from '#imports'

const PREF_AUTO_HIDE = 'preference:auto-hide'
const PREF_AUTO_LOAD = 'preference:auto-load'

const app = document.querySelector('div#app')
if (!app) throw new Error('App root element not found')

app.innerHTML = /* html */ `
  <main style="padding: 12px; font-family: monospace; min-width: 320px;">
    <h1 style="margin-top: 0;">DevTool2Go</h1>
    <header data-role="status" style="margin-bottom: 8px;"></header>
    <p style="margin-top: 0;">Look for the floating Eruda icon on any webpage.</p>
    <fieldset style="border: 1px solid currentColor; padding: 12px;">
      <legend>Preferences</legend>
      <label style="display: flex; gap: 8px; align-items: center;">
        <input type="checkbox" data-for="auto-hide" />
        Auto hide when tapping outside
      </label>
      <label style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
        <input type="checkbox" data-for="auto-load" />
        Auto load on every page
      </label>
    </fieldset>
    <button type="button" data-action="open-eruda" style="margin-top: 12px; width: 100%;">
      Open Eruda on this tab
    </button>
  </main>
`

const statusElement = document.querySelector<HTMLElement>(
  '[data-role="status"]',
)
const autoHideElement = document.querySelector<HTMLInputElement>(
  'input[data-for="auto-hide"]',
)
const autoLoadElement = document.querySelector<HTMLInputElement>(
  'input[data-for="auto-load"]',
)
const openButton = document.querySelector<HTMLButtonElement>(
  'button[data-action="open-eruda"]',
)

if (!statusElement || !autoHideElement || !autoLoadElement || !openButton) {
  throw new Error('Popup UI failed to mount')
}

const statusLabel = statusElement
const autoHideCheckbox = autoHideElement
const autoLoadCheckbox = autoLoadElement
const openErudaButton = openButton

void restorePreferences()

autoHideCheckbox.addEventListener('change', async (event) => {
  event.preventDefault()
  event.stopPropagation()

  const nextValue = autoHideCheckbox.checked ? 'on' : 'off'
  await browser.storage.sync.set({ [PREF_AUTO_HIDE]: nextValue })
})

autoLoadCheckbox.addEventListener('change', async (event) => {
  event.preventDefault()
  event.stopPropagation()

  const nextValue = autoLoadCheckbox.checked ? 'on' : 'off'
  await browser.storage.sync.set({ [PREF_AUTO_LOAD]: nextValue })

  updateManualButtonState()

  if (nextValue === 'on') {
    await sendMessageToActiveTab({ type: 'devtool2go:init-eruda' })
  }

  updateStatusLabel()
})

openErudaButton.addEventListener('click', async (event) => {
  event.preventDefault()
  openErudaButton.disabled = true
  try {
    await sendMessageToActiveTab({ type: 'devtool2go:init-eruda' })
  } finally {
    updateManualButtonState()
  }
})

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return

  if (changes[PREF_AUTO_HIDE]) {
    const value = (changes[PREF_AUTO_HIDE].newValue ?? 'on') as string
    autoHideCheckbox.checked = value === 'on'
  }

  if (changes[PREF_AUTO_LOAD]) {
    const value = (changes[PREF_AUTO_LOAD].newValue ?? 'on') as string
    autoLoadCheckbox.checked = value === 'on'
    updateManualButtonState()
    updateStatusLabel()
  }
})

async function restorePreferences() {
  try {
    const stored = await browser.storage.sync.get([
      PREF_AUTO_HIDE,
      PREF_AUTO_LOAD,
    ])
    autoHideCheckbox.checked = (stored?.[PREF_AUTO_HIDE] ?? 'on') === 'on'
    autoLoadCheckbox.checked = (stored?.[PREF_AUTO_LOAD] ?? 'on') === 'on'
  } catch {
    autoHideCheckbox.checked = true
    autoLoadCheckbox.checked = true
  }

  updateManualButtonState()
  updateStatusLabel()
}

function updateStatusLabel() {
  statusLabel.textContent = autoLoadCheckbox.checked
    ? '✨ Eruda auto-loads on all pages.'
    : 'Manual mode: use the button below when needed.'
}

function updateManualButtonState() {
  openErudaButton.disabled = autoLoadCheckbox.checked
}

async function sendMessageToActiveTab(message: unknown) {
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    if (tab?.id !== undefined) {
      await browser.tabs.sendMessage(tab.id, message)
    }
  } catch (error) {
    console.warn('[DevTool2Go] Failed to contact active tab', error)
  }
}
