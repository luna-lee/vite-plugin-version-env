import path from "path";
import fs from "fs-extra";
import type { IndexHtmlTransformHook, ServerOptions } from "vite";
const absolutePath = (...args: any[]) => path.resolve(process.cwd(), ...args);

// 版本号生成器 - 年月日时分秒
function generatorVersionCode() {
  var d = new Date();
  var yy = d.getFullYear().toString().slice(2);
  var MM = d.getMonth() + 1 >= 10 ? d.getMonth() + 1 : "0" + (d.getMonth() + 1);
  var DD = d.getDate() >= 10 ? d.getDate() : "0" + d.getDate();
  var h = d.getHours() >= 10 ? d.getHours() : "0" + d.getHours();
  var mm = d.getMinutes() >= 10 ? d.getMinutes() : "0" + d.getMinutes();
  var ss = d.getSeconds() >= 10 ? d.getSeconds() : "0" + d.getSeconds();
  return yy + MM + DD + h + mm + ss;
}
// 对原有对象筛选后重新获取新的对象
function omit(obj: Recordable, omitKeys: string[]) {
  if (Array.isArray(omitKeys)) {
    return Object.keys(obj).reduce((o, k) => {
      if (!omitKeys.includes(k)) o[k] = obj[k];
      return o;
    }, {} as Recordable);
  }
  return obj;
}
export default ({
  outDir,
  CustomEnv,
  command,
  cleanDir = true,
  GLOBAL_CONFIG_FILE_NAME,
  GLOBAL_CONFIG_KEY,
}: {
  outDir: string;
  CustomEnv: VersionEnvSpace.EnvConfig;
  mode: string;
  command: "build" | "serve";
  cleanDir?: boolean;
  GLOBAL_CONFIG_FILE_NAME: string;
  GLOBAL_CONFIG_KEY: string;
}) => {
  const version = generatorVersionCode();
  const isBuild = command === "build";

  function creatAppConfigFile(filePath: string) {
    const _CustomEnv: VersionEnvSpace.EnvConfig = JSON.parse(
      JSON.stringify(CustomEnv)
    );
    if (!isBuild) _CustomEnv.GLOBAL_CONFIG.DEV = CustomEnv.DEV;
    const context = `
    window.${GLOBAL_CONFIG_KEY}= ${JSON.stringify(_CustomEnv.GLOBAL_CONFIG)}  
    Object.freeze(window.${GLOBAL_CONFIG_KEY}); 
    Object.defineProperty(window, "${GLOBAL_CONFIG_KEY}", { configurable: false, writable: false, });
                `;
    fs.outputFile(filePath, context);
  }
  const serverConfig: ServerOptions = {};
  if (CustomEnv.DEV) {
    if (CustomEnv.DEV.port) serverConfig.port = CustomEnv.DEV.port;
    if (CustomEnv.DEV.proxy && Array.isArray(CustomEnv.DEV.proxy_list)) {
      serverConfig.proxy = {};
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
      }, serverConfig.proxy);
    }
  }

  return {
    outDirVersion: outDir + "/" + version,
    version,
    plugin: {
      name: "vite-plugin-version",
      transformIndexHtml: {
        handler(html) {
          if (!isBuild) {
            creatAppConfigFile(absolutePath("public", GLOBAL_CONFIG_FILE_NAME));
          }
          // title
          html = html.replace(
            /<title>(.*?)<\/title>/,
            `<title>${CustomEnv.GLOBAL_CONFIG.web_tilte || ""}</title>`
          );
          return {
            html: html.replace(/\.\//g, `./${version}/`),
            tags: [
              {
                tag: "script",
                attrs: {
                  src: `./${GLOBAL_CONFIG_FILE_NAME}?v=${version}`,
                },
                injectTo: "head-prepend",
              },
            ],
          };
        },
      } as
        | IndexHtmlTransformHook
        | { order?: "pre" | "post"; handler: IndexHtmlTransformHook },
      buildStart() {
        // 打包时清空dist
        if (command == "build" && cleanDir) {
          const destDir = absolutePath(outDir);
          if (fs.existsSync(destDir)) {
            fs.removeSync(destDir);
          }
        }
      },
      writeBundle(outputOptions: any) {
        if (outputOptions.dir.endsWith(version)) {
          // 拷贝static
          const outputDir =
            outputOptions.dir || path.resolve(__dirname, "dist");
          const srcDir = path.join(outputDir, "index.html");
          const destDir = path.join(outputDir, "..", "index.html");

          // 移除public中的app.config.js文件
          const fileToRemove = path.join(outputDir, GLOBAL_CONFIG_FILE_NAME);
          if (fs.existsSync(fileToRemove)) {
            fs.removeSync(fileToRemove);
          }
          creatAppConfigFile(
            path.join(outputDir, "..", GLOBAL_CONFIG_FILE_NAME)
          );
          // 构造目标文件路径
          fs.move(srcDir, destDir, { overwrite: true });
        }
      },
    },
    serverConfig,
  };
};
