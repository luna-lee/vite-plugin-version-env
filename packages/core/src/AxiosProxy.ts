import { InternalAxiosRequestConfig } from "axios";

function normalizeUrl(url: string) {
  if (/^(https?:\/\/)/.test(url)) return url.replace(/([^:]\/)\/+/g, "$1");
  else return url.replace(/\/+/g, "/");
}

export const AxiosProxy = (
  AxiosConfig: InternalAxiosRequestConfig<any>,
  GlobalConfig: VersionEnvSpace.GlobalConfig = GLOBAL_CONFIG
) => {
  try {
    AxiosConfig.baseURL = GlobalConfig.api_base;
    // 匹配校验当前url是否需要走代理。
    if (AxiosConfig.url) {
      // 规范化url
      AxiosConfig.url = normalizeUrl(AxiosConfig.url);
      if (
        import.meta.env.DEV &&
        GlobalConfig?.DEV?.proxy &&
        Array.isArray(GlobalConfig.DEV.proxy_list)
      ) {
        GlobalConfig.DEV.proxy_list.forEach((proxy) => {
          // 若没有设置则全部匹配
          const includeRegx = new RegExp(proxy.include || "(?:)");
          // 若没有设置则全部不匹配
          const excludeRegx = new RegExp(proxy.exclude || "(?!)");
          if (
            AxiosConfig.url &&
            includeRegx.test(AxiosConfig.url) &&
            !excludeRegx.test(AxiosConfig.url)
          )
            AxiosConfig.baseURL = proxy.name;
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
};
