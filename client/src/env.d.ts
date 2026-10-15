/// <reference types="vite/client" />

/** Client environment variables (client/.env). All of them are public: they end up in the bundle. */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string
  readonly VITE_SITE_URL?: string
  /** "true" to include the /_ui component gallery in a production build (for screenshots). */
  readonly VITE_SHOW_UI_KIT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
