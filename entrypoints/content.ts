import './style.css'
import { defineContentScript } from '#imports'

const ERUDA_ROOT_ID = 'devtool2go-eruda-root'

declare global {
  interface Window {
    __DEVTOOL2GO_ERUDA_LOADED?: boolean
  }
}

let erudaLoader: Promise<typeof import('eruda')['default']> | null = null
let initializingEruda: Promise<void> | null = null

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

async function ensureBody(): Promise<HTMLElement> {
  if (document.body) return document.body

  await new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect()
        resolve()
      }
    })

    observer.observe(document.documentElement ?? document, { childList: true })
  })

  return document.body as HTMLElement
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
      const eruda = await loadEruda()
      eruda.init({
        container: ensureContainer(),
      })
      window.__DEVTOOL2GO_ERUDA_LOADED = true
    })()
  }

  try {
    await initializingEruda
  } finally {
    if (!window.__DEVTOOL2GO_ERUDA_LOADED) {
      initializingEruda = null
    }
  }
}

export default defineContentScript({
  world: 'MAIN',
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',

  async main() {
    await initErudaOnce()
  },
})
