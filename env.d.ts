interface EnvironmentVariables {
  readonly PORT: string
  readonly NODE_ENV: 'development' | 'production'
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
