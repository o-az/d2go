import { browser } from '#imports'

const PREF_AUTO_HIDE = 'preference:auto-hide'
const PREF_AUTO_LOAD = 'preference:auto-load'
const AUTO_LOAD_ORIGINS = ['*://*/*']

const applicationRootElement = document.querySelector('div#app')
if (!applicationRootElement) throw new Error('App root element not found')

applicationRootElement.innerHTML = /* html */ `
  <main style="font-family: monospace; min-width: 320px; min-height: 250px; display: flex; flex-direction: column; gap: 12px;">
    <header style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
      <h1 style="font-size: 1.5em; font-weight: bold; margin: 0;">D2Go</h1>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://github.com/o-az/d2go"
        style="font-size: 1.1em;"
      >
        sauce
      </a>
    </header>

    <p data-role="status" style="margin: 0;">Look for the floating Eruda icon on any webpage.</p>

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

    <footer style="margin-top: auto;">
      <button type="button" data-action="open-eruda" style="margin-top: 12px; width: 100%; padding: 12px;">
        Open Eruda on this tab
      </button>
    </footer>
  </main>
`

const statusLabelElement = document.querySelector('p[data-role="status"]')
const autoHideCheckboxElement = document.querySelector(
  'input[data-for="auto-hide"]',
)
const autoLoadCheckboxElement = document.querySelector(
  'input[data-for="auto-load"]',
)
const openErudaButtonElement = document.querySelector(
  'button[data-action="open-eruda"]',
)

if (
  !statusLabelElement ||
  !autoHideCheckboxElement ||
  !autoLoadCheckboxElement ||
  !openErudaButtonElement
) {
  throw new Error('Popup UI failed to mount')
}

let statusMessageOverride: string | null = null

void restorePreferences()

autoHideCheckboxElement.addEventListener('change', async event => {
  event.preventDefault()
  event.stopPropagation()

  const nextValue = autoHideCheckboxElement.checked ? 'on' : 'off'
  await browser.storage.sync.set({ [PREF_AUTO_HIDE]: nextValue })
})

autoLoadCheckboxElement.addEventListener('change', async event => {
  event.preventDefault()
  event.stopPropagation()

  if (autoLoadCheckboxElement.checked) {
    const granted = await requestAutoLoadPermission()
    if (!granted) {
      autoLoadCheckboxElement.checked = false
      await browser.storage.sync.set({ [PREF_AUTO_LOAD]: 'off' })
      updateManualButtonState()
      updateStatusLabel(
        'Grant site access to enable auto load, or keep manual mode.',
      )
      return
    }

    await browser.storage.sync.set({ [PREF_AUTO_LOAD]: 'on' })
    clearStatusOverride()
    updateManualButtonState()
    updateStatusLabel()
    await sendMessageToActiveTab({ type: 'devtool2go:init-eruda' })
  } else {
    await browser.storage.sync.set({ [PREF_AUTO_LOAD]: 'off' })
    await removeAutoLoadPermission()
    clearStatusOverride()
    updateManualButtonState()
    updateStatusLabel()
  }
})

openErudaButtonElement.addEventListener('click', async event => {
  event.preventDefault()
  openErudaButtonElement.disabled = true
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
    autoHideCheckboxElement.checked = value === 'on'
  }

  if (!changes[PREF_AUTO_LOAD]) return

  void (async () => {
    const value = (changes[PREF_AUTO_LOAD].newValue ?? 'on') as string
    const wantsAutoLoad = value === 'on'
    const hasAutoLoadPermissionGranted = await hasAutoLoadPermission()

    autoLoadCheckboxElement.checked =
      wantsAutoLoad && hasAutoLoadPermissionGranted

    if (wantsAutoLoad && !hasAutoLoadPermissionGranted) {
      updateStatusLabel(
        'Grant site access to enable auto load, or keep manual mode.',
      )
    } else {
      if (!wantsAutoLoad) await removeAutoLoadPermission()

      clearStatusOverride()
      updateStatusLabel()
    }

    updateManualButtonState()
  })()
})

async function restorePreferences() {
  try {
    const storedPreferences = await browser.storage.sync.get([
      PREF_AUTO_HIDE,
      PREF_AUTO_LOAD,
    ])
    if (!autoHideCheckboxElement) return
    autoHideCheckboxElement.checked =
      (storedPreferences?.[PREF_AUTO_HIDE] ?? 'on') === 'on'

    const storedAutoLoadEnabled =
      (storedPreferences?.[PREF_AUTO_LOAD] ?? 'on') === 'on'
    const hasAutoLoadPermissionGranted = await hasAutoLoadPermission()

    if (!autoLoadCheckboxElement) return
    autoLoadCheckboxElement.checked =
      storedAutoLoadEnabled && hasAutoLoadPermissionGranted

    if (storedAutoLoadEnabled && !hasAutoLoadPermissionGranted) {
      await browser.storage.sync.set({ [PREF_AUTO_LOAD]: 'off' })
      updateStatusLabel(
        'Grant site access to enable auto load, or keep manual mode.',
      )
    } else {
      clearStatusOverride()
      updateStatusLabel()
    }
  } catch (error) {
    console.warn('[DevTool2Go] Failed to restore preferences', error)
    if (!autoHideCheckboxElement) return
    autoHideCheckboxElement.checked = true
    if (!autoLoadCheckboxElement) return
    autoLoadCheckboxElement.checked = false
    clearStatusOverride()
    updateStatusLabel('Storage unavailable; staying in manual mode.')
  }

  updateManualButtonState()
  updateStatusLabel()
}

const updateManualButtonState = () =>
  (openErudaButtonElement.disabled = autoLoadCheckboxElement.checked)

function updateStatusLabel(override?: string) {
  if (override !== undefined) statusMessageOverride = override

  const message =
    statusMessageOverride ??
    (autoLoadCheckboxElement?.checked
      ? '✨ Eruda auto-loads on all pages.'
      : 'Manual mode: use the button below when needed.')

  if (statusLabelElement) statusLabelElement.textContent = message
}

function clearStatusOverride() {
  statusMessageOverride = null
}

async function sendMessageToActiveTab(message: unknown) {
  try {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    if (activeTab?.id !== undefined)
      await browser.tabs.sendMessage(activeTab.id, message)
  } catch (error) {
    console.warn('[DevTool2Go] Failed to contact active tab', error)
  }
}

async function hasAutoLoadPermission(): Promise<boolean> {
  try {
    return await browser.permissions.contains({ origins: AUTO_LOAD_ORIGINS })
  } catch (error) {
    console.warn('[DevTool2Go] Failed to check host permission', error)
    return false
  }
}

async function requestAutoLoadPermission(): Promise<boolean> {
  try {
    return await browser.permissions.request({ origins: AUTO_LOAD_ORIGINS })
  } catch (error) {
    console.warn('[DevTool2Go] Failed to request host permission', error)
    return false
  }
}

async function removeAutoLoadPermission(): Promise<boolean> {
  try {
    return await browser.permissions.remove({ origins: AUTO_LOAD_ORIGINS })
  } catch (error) {
    console.warn('[DevTool2Go] Failed to remove host permission', error)
    return false
  }
}
