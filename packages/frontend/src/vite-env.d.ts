/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_ID?: string;
  readonly VITE_WALLETCONNECT_ID?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GOVERNOR_ADDRESS?: string;
  readonly VITE_TOKEN_ADDRESS?: string;
  readonly VITE_VAULT_ADDRESS?: string;
  readonly VITE_TIMELOCK_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
