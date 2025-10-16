interface EnvironmentVariables {
  readonly PORT: string
  readonly NODE_ENV: 'development' | 'production'

  readonly EDGE_BINARY_PATH: string
  readonly CHROME_BINARY_PATH: string
  readonly FIREFOX_BINARY_PATH: string
}

declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}

declare namespace Bun {
  interface Env extends EnvironmentVariables {}
}

interface ImportMetaEnv extends EnvironmentVariables {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
