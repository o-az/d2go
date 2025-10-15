import { defineContentScript } from '#imports'

export default defineContentScript({
  world: 'MAIN',
  matches: ['*://*/*'],
  runAt: 'document_start',
  async main() {},
})
