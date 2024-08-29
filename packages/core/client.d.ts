declare namespace VersionEnvSpace {
  interface GlobalConfig {
    api_base: string;
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
declare const GLOBAL_CONFIG: VersionEnvSpace.GlobalConfig;
