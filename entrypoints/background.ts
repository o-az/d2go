import { browser, defineBackground } from '#imports'

export default defineBackground({
  type: 'module',
  main() {
    console.log(
      'background:loaded',
      JSON.stringify({ id: browser.runtime.id }, undefined, 2),
    )
  },
})
