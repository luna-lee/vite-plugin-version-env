import path from "path";
import fs from "fs-extra";
import type { IndexHtmlTransformHook, UserConfig } from "vite";
const absolutePath = (...args: any) => path.resolve(process.cwd(), ...args);

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
export default ({
  CustomEnv,
  command,
  cleanDir = true,
  GLOBAL_CONFIG_FILE_NAME = "app.config.js",
  GLOBAL_CONFIG_KEY = "__GLOBAL_CONFIG__",
  GLOBAL_CONFIG_NAME = "GLOBAL_CONFIG",
}: {
  CustomEnv: VersionEnvSpace.EnvConfig;
  command: "build" | "serve";
  cleanDir?: boolean;
  GLOBAL_CONFIG_FILE_NAME?: string;
  GLOBAL_CONFIG_KEY?: string;
  GLOBAL_CONFIG_NAME?: string;
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

  return {
    name: "vite-plugin-version",
    config(config: UserConfig) {
      config.define = config.define || {};
      config.define[GLOBAL_CONFIG_NAME] = `window.${GLOBAL_CONFIG_KEY}`;
      if (isBuild) {
        config.build = config.build || {};
        const outDir = config.build.outDir || "dist";
        config.build.outDir = outDir + "/" + version;
        if (cleanDir) {
          const destDir = absolutePath(outDir);
          if (fs.existsSync(destDir)) {
            fs.removeSync(destDir);
          }
        }
      } else {
        // 开发环境将配置文件拷贝到public目录
        creatAppConfigFile(absolutePath("public", GLOBAL_CONFIG_FILE_NAME));
      }
    },
    transformIndexHtml: {
      handler(html) {
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
    writeBundle(outputOptions: any) {
      if (outputOptions.dir.endsWith(version)) {
        // 拷贝static
        const outputDir = outputOptions.dir || path.resolve(__dirname, "dist");
        const srcDir = path.join(outputDir, "index.html");
        const destDir = path.join(outputDir, "..", "index.html");

        // 移除public中的app.config.js文件
        const fileToRemove = path.join(outputDir, GLOBAL_CONFIG_FILE_NAME);
        if (fs.existsSync(fileToRemove)) {
          fs.removeSync(fileToRemove);
        }
        creatAppConfigFile(path.join(outputDir, "..", GLOBAL_CONFIG_FILE_NAME));
        // 构造目标文件路径
        fs.move(srcDir, destDir, { overwrite: true });
      }
    },
  };
};
