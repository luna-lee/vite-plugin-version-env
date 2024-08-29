declare namespace VersionEnvSpace {
  interface GlobalConfig {
    web_tilte?: string;
    cache_store: string[];
    api_base: string;
    api_idaas: string;
    api_file: string;
    api_security: string;
    api_gis: string;
    DEV?: DevConfig;
    [x: string]: any;
  }
  interface DevConfig {
    port?: number;
    proxy?: boolean;
    proxy_list?: {
      name: string;
      include?: string;
      exclude?: string;
      target: string;
    }[];
    [x: string]: any;
  }
  interface EnvConfig {
    GLOBAL_CONFIG: GlobalConfig;
    DEV?: DevConfig;
  }
}

declare type Recordable<T = any> = Record<string, T>;