import { browser, defineBackground } from '#imports'

export default defineBackground({
  type: 'module',
  main() {
    console.log(
      'Hello background!',
      JSON.stringify({ id: browser.runtime.id }, undefined, 2),
    )
  },
})
