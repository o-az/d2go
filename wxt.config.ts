import { defineConfig, type WebExtConfig } from 'wxt'

const binaries: WebExtConfig['binaries'] = {}

const edgePath = process.env.EDGE_BINARY_PATH
const chromePath = process.env.CHROME_BINARY_PATH
const firefoxPath = process.env.FIREFOX_BINARY_PATH

if (edgePath) binaries.edge = edgePath
if (chromePath) binaries.chrome = chromePath
if (firefoxPath) binaries.firefox = firefoxPath

export default defineConfig({
  imports: false,
  webExt: { binaries },
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    enabled: true,
    developmentIndicator: 'grayscale',
    baseIconPath: './assets/icon.png',
  },
  manifest: {
    name: 'D2Go',
    permissions: ['activeTab', 'tabs', 'storage'],
    optional_host_permissions: ['*://*/*'],
    browser_specific_settings: {
      gecko: {
        id: 'omaraziz.dev@gmail.com',
        strict_min_version: '109.0',
      },
    },
    web_accessible_resources: [
      {
        matches: ['*://*/*'],
        resources: ['../node_modules/eruda/eruda.js'],
      },
    ],
    author: { email: 'd2go@async.email' },
    description: 'Mobile-friendly developer console',
  },
})
