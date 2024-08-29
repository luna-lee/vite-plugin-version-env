import type { ServerOptions } from "vite";
type Recordable<T = any> = Record<string, T>;
// 对原有对象筛选后重新获取新的对象
function omit(obj: Recordable, omitKeys: string[]) {
  if (Array.isArray(omitKeys)) {
    return Object.keys(obj).reduce((o: Recordable, k) => {
      if (!omitKeys.includes(k)) o[k] = obj[k];
      return o;
    }, {});
  }
  return obj;
}
export default (CustomEnv: VersionEnvSpace.EnvConfig): ServerOptions => {
  // 开发环境依据配置的内容设置代理服务对象
  const ServerConfig: ServerOptions = {};
  if (CustomEnv.DEV) {
    if (CustomEnv.DEV.port) ServerConfig.port = CustomEnv.DEV.port;
    if (CustomEnv.DEV.proxy && Array.isArray(CustomEnv.DEV.proxy_list)) {
      ServerConfig.proxy = {};
      CustomEnv.DEV.proxy_list.reduce((obj, proxy) => {
        obj[proxy.name] = {
          target: proxy.target,
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(new RegExp(`^${proxy.name}`), "");
          },
          ...omit(proxy, ["target", "include", "exclude", "name"]),
        };
        return obj;
      }, ServerConfig.proxy);
    }
  }
  return ServerConfig;
};
