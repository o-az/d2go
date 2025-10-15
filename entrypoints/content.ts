import { browser as injectedBrowser, defineContentScript } from '#imports'

const ERUDA_ROOT_ID = 'devtool2go-eruda-root'
const PREF_AUTO_LOAD = 'preference:auto-load'
const PREF_AUTO_HIDE = 'preference:auto-hide'

declare global {
  interface Window {
    __DEVTOOL2GO_ERUDA_LOADED?: boolean
  }
}

let erudaLoader: Promise<typeof import('eruda')['default']> | null = null
let initializingEruda: Promise<void> | null = null
let desiredAutoHide = true
let autoHideTeardown: (() => void) | null = null
let extensionApi: ReturnType<typeof ensureBrowserApi> | undefined

export default defineContentScript({
  world: 'ISOLATED',
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',

  async main() {
    extensionApi = ensureBrowserApi()
    const runtime = extensionApi?.runtime
    const storage = extensionApi?.storage

    if (!runtime || !storage) {
      console.warn(
        '[DevTool2Go] Extension runtime/storage APIs unavailable in content script context',
      )
      return
    }

    runtime.onMessage.addListener((message: unknown) => {
      if (isInitMessage(message)) {
        void showEruda()
      }

      return undefined
    })

    storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return

      const autoLoadChange = changes[PREF_AUTO_LOAD]
      if (autoLoadChange) {
        const enabled = (autoLoadChange.newValue ?? 'on') === 'on'
        if (enabled) void initErudaOnce()
      }

      const autoHideChange = changes[PREF_AUTO_HIDE]
      if (autoHideChange) {
        const enabled = (autoHideChange.newValue ?? 'on') === 'on'
        void setAutoHide(enabled)
      }
    })

    const preferences = await readPreferences()
    desiredAutoHide = preferences.autoHide

    if (preferences.autoLoad) {
      await initErudaOnce()
    }
  },
})

async function loadEruda() {
  if (!erudaLoader) {
    erudaLoader = import('eruda')
      .then((mod) => mod.default)
      .catch((error) => {
        erudaLoader = null
        throw error
      })
  }

  return erudaLoader
}

async function ensureDomReady() {
  if (
    document.readyState === 'interactive' ||
    document.readyState === 'complete'
  )
    return

  await new Promise<void>((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), {
      once: true,
    })
  })
}

async function ensureBody(): Promise<HTMLBodyElement> {
  let body = document.body
  if (body instanceof HTMLBodyElement) return body

  await new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect()
        resolve()
      }
    })

    observer.observe(document.documentElement ?? document, { childList: true })
  })

  body = document.body
  if (!(body instanceof HTMLBodyElement)) {
    throw new Error('Body not found')
  }

  return body
}

function ensureContainer(): HTMLElement {
  const existing = document.getElementById(ERUDA_ROOT_ID)
  if (existing) return existing

  const container = document.createElement('div')
  container.id = ERUDA_ROOT_ID
  ;(document.body ?? document.documentElement ?? document).appendChild(
    container,
  )
  return container
}

async function initErudaOnce() {
  if (window.__DEVTOOL2GO_ERUDA_LOADED) return

  if (!initializingEruda) {
    initializingEruda = (async () => {
      await ensureDomReady()
      await ensureBody()
      const container = ensureContainer()
      const eruda = await loadEruda()
      try {
        eruda.init({
          container,
        })
        window.__DEVTOOL2GO_ERUDA_LOADED = true
        await setAutoHide(desiredAutoHide, eruda)
      } catch (error) {
        window.__DEVTOOL2GO_ERUDA_LOADED = false
        throw error
      }
    })()
  }

  try {
    await initializingEruda
  } catch (error) {
    initializingEruda = null
    throw error
  }
}

async function readPreferences(): Promise<{
  autoLoad: boolean
  autoHide: boolean
}> {
  const storage = extensionApi?.storage
  if (!storage?.sync) return { autoLoad: true, autoHide: true }

  try {
    const result = await storage.sync.get([PREF_AUTO_LOAD, PREF_AUTO_HIDE])
    const autoLoad = (result?.[PREF_AUTO_LOAD] ?? 'on') === 'on'
    const autoHide = (result?.[PREF_AUTO_HIDE] ?? 'on') === 'on'
    return { autoLoad, autoHide }
  } catch (error) {
    console.warn(
      '[DevTool2Go] Failed to read preferences, defaulting to on',
      error,
    )
    return { autoLoad: true, autoHide: true }
  }
}

async function showEruda() {
  await initErudaOnce()
  const eruda = await loadEruda()
  eruda.show()
}

async function setAutoHide(
  enabled: boolean,
  erudaInstance?: typeof import('eruda')['default'],
) {
  desiredAutoHide = enabled

  if (autoHideTeardown) {
    autoHideTeardown()
    autoHideTeardown = null
  }

  if (!window.__DEVTOOL2GO_ERUDA_LOADED) return

  if (!enabled) return

  const eruda = erudaInstance ?? (await loadEruda())
  const handler = (event: Event) => {
    const target = event.target
    if (!(target instanceof Node)) return
    if (
      target instanceof HTMLElement &&
      eruda.util?.isErudaEl &&
      eruda.util.isErudaEl(target)
    )
      return

    const container = document.getElementById(ERUDA_ROOT_ID)
    if (container?.contains(target)) return

    const devtools = eruda.get()
    devtools?.hide()
  }

  document.addEventListener('pointerdown', handler, true)
  autoHideTeardown = () => {
    document.removeEventListener('pointerdown', handler, true)
  }
}

function ensureBrowserApi(): typeof injectedBrowser | undefined {
  if (typeof injectedBrowser !== 'undefined') return injectedBrowser
  if (typeof globalThis !== 'undefined' && 'browser' in globalThis) {
    const candidate = (
      globalThis as unknown as {
        browser?: typeof injectedBrowser
      }
    ).browser
    if (candidate) return candidate
  }
  if (typeof globalThis !== 'undefined' && 'chrome' in globalThis) {
    const candidate = (
      globalThis as unknown as {
        chrome?: typeof injectedBrowser
      }
    ).chrome
    if (candidate) return candidate
  }
  return undefined
}

function isInitMessage(value: unknown): value is {
  type: 'devtool2go:init-eruda'
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type?: unknown }).type === 'devtool2go:init-eruda'
  )
}
