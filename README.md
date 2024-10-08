# Vite打包版本控制以及全局环境参数配置



## 功能

1. ### 设置全局变量。

2. ### 构建时依据环境，设置当前环境对应的全局参数。

3. ### 开发环境下，增强代理配置功能。可实现不同接口走不同的代理，也可过滤指定接口。

4. ### 构建后所有的静态资源会被打包到一个以当前时间为名称的文件夹内





## 安装

​	`npm i vite-plugin-version-env -S`



## 配置

### TS类型配置

##### 	在tsconfig.ts文件中配置

```typescript
"types": [    "vite-plugin-version-env/client",]
```

##### 	类型详情

```typescript
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

```

##### 	扩展配置项类型，在d.ts文件中可扩展GlobalConfig类型

```
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



##  环境配置

##### 	建一个文件夹，在文件夹内建立一个以环境名命名的js/ts文件

```typescript
build/config
|- development.ts
|- production.ts
|- test.ts
```

##### 	配置信息，以development.ts为例

```
export default {
  //全局配置项，打包后会存入 app.config.js文件中。
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



## vite.config.ts配置

​	

```
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



#### 项目中的Axios配置，实现在开发环境下，设置了代理模式后，不同的接口走不通的代理。

```
import { ConfigBaseUrl } from 'vite-plugin-version-env/ConfigBaseUrl';
http.interceptors.request.use(async (config) => {
  ConfigBaseUrl(config);
   return config;
  }
```

#### ConfigBaseUrl

- 开发环境下，axios中无需配置baseUrl，自动依据代理配置，设置成代理字符。没有代理时使用GlobalConfig.api_base

- 生产环境，使用GlobalConfig.api_base

```
(AxiosConfig: InternalAxiosRequestConfig<any>, GlobalConfig?: VersionEnvSpace.GlobalConfig) => void
```

- 若GLOBAL_CONFIG_NAME没有自定义，则可以不用传，若自定义则必须传入自定义的

- 并且需要在类型文件中声明其类型


```
global.d.ts

declare const CUSTON_GLOBAL_CONFIG: VersionEnvSpace.GlobalConfig;
```


