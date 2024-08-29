# vite打包静态资源版本控制
# 不同环境的全局参数配置。
# 增强代理配置功能，可实现不同接口走不同的代理，也可过滤指定接口。





## 安装

​	`npm i vite-plugin-version-env -S`

## 配置

##  环境参数配置

```
build/config
	development.ts
	production.ts
	test.ts
	
//配置信息 development.ts
export default {
  //    全局配置项，打包后会存入 app.config.js文件中。
  GLOBAL_CONFIG: {
    web_tilte: '开发环境',
    cache_store: ['oauth', 'global'],
    api_base: 'http://fyeb.cnsaas.com/support-gateway/',
    api_idaas: '/idaas/',
    api_file: '/file-service/',
    api_security: '/fy-security/',
    api_gis: '/',
  },
  DEV: {
    port: 8080,
    proxy: true,
    proxy_list: [
      {
        name: '/_api/',
        include: '^/gisLayerGroup',
        target: 'http://172.16.105.9:30006',
      },
    ],
  },
} as VersionEnvSpace.EnvConfig;



```

配置项类型 ：VersionEnvSpace

```
declare namespace VersionEnvSpace {
  interface GlobalConfig {
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

```

扩展配置项类型

```
global.d.ts

namespace VersionEnvSpace {
    interface GlobalConfig {
      web_tilte?: string;
      cache_store: string[];
      api_base: string;
      api_idaas: string;
      api_file: string;
      api_security: string;
      api_gis: string;
    }
  }
```



## 构建配置

​	

```
vite.config.ts


import { ServerPlugin, VersionPlugin } from 'vite-plugin-version-env';

export default defineConfig(async ({ mode, command }: ConfigEnv): Promise<UserConfig> => {
  const CustomEnv = (await import(`./build/config/${mode}.ts`)).default as VersionEnvSpace.EnvConfig;
   return {
    plugins: [ VersionPlugin({ CustomEnv, command, '__GLOBAL_CONFIG__', 'app.config.js' }),],
    server: {  
       cors: true,
      open: true,
      host: '0.0.0.0',
      ...ServerPlugin(CustomEnv)
      }
   }
```

#### VersionPluginType

```
({ CustomEnv, command, cleanDir, GLOBAL_CONFIG_FILE_NAME, GLOBAL_CONFIG_KEY, GLOBAL_CONFIG_NAME, }: {
    CustomEnv: VersionEnvSpace.EnvConfig;
    command: 'build' | 'serve';
    cleanDir?: boolean;
    GLOBAL_CONFIG_FILE_NAME?: string;
    GLOBAL_CONFIG_KEY?: string;
    GLOBAL_CONFIG_NAME?: string;
}) 
```
| 属性                        | 类型      | 描述                           | 默认值           |
|---------------------------|---------|-------------------------------|-----------------|
| `CustomEnv`               | Object  | 配置对象                       | -               |
| `command`                 | 'build' \|'serve' |                    | -               |
| `cleanDir`                | Boolean | 是否清空输出目录               | `true`     |
| `GLOBAL_CONFIG_FILE_NAME` | String  | 存放全局配置的文件名           | app.config.js |
| `GLOBAL_CONFIG_KEY`       | String  | 挂载到 `window` 对象上的属性名 | `\__GLOBAL_CONFIG__` |
| `GLOBAL_CONFIG_NAME`      | String  | 代码可用的全局对象名           | `GLOBAL_CONFIG` |

#### Axios配置

```
import { AxiosProxy } from 'vite-plugin-version-env/AxiosProxy';
http.interceptors.request.use(async (config) => {
  AxiosProxy(config);
   return config;
  }
```

#### AxiosProxyType

```
(AxiosConfig: InternalAxiosRequestConfig<any>, GlobalConfig?: VersionEnvSpace.GlobalConfig) => void
```

若GLOBAL_CONFIG_NAME没有自定义，则可以不用传，若自定义则必须传入自定义的

并且需要在类型文件中声明其类型

```
global.d.ts

declare const CUSTON_GLOBAL_CONFIG: VersionEnvSpace.GlobalConfig;
```



#### TS 配置

```
"types": [ 

​      "vite-plugin-version-env/client", 

​    ],
```

