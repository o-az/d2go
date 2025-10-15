import { defineConfig } from 'wxt'

export default defineConfig({
  imports: false,
  manifest: {
    name: 'DevTool2Go',
    permissions: ['activeTab', 'storage'],
    author: { email: 'devtool2go@async.email' },
    description: 'Mobile-friendly developer console powered by Eruda',
    browser_specific_settings: {
      gecko: {
        id: 'devtool2go@o-az.dev',
        strict_min_version: '109.0',
      },
    },
    web_accessible_resources: [
      {
        matches: ['*://*/*'],
        resources: ['../node_modules/eruda/eruda.js'],
      },
    ],
  },
})
