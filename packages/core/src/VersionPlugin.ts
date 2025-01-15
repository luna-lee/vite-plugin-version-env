import path from "path";
import fs from "fs-extra";
import type { IndexHtmlTransformHook, UserConfig } from "vite";

/**
 * 从当前工作目录解析绝对路径
 * @param {...any} args - 路径片段参数
 * @returns {string} 解析后的绝对路径
 */
const absolutePath = (...args: any) => path.resolve(process.cwd(), ...args);

/**
 * 生成版本号
 * 格式: YYMMDDHHMMSS (年月日时分秒)
 * 例如: 240315143022 表示 2024年03月15日14时30分22秒
 * @returns {string} 版本号字符串
 */
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

/**
 * Vite 版本控制插件
 * 用于处理版本控制和全局配置管理的 Vite 插件
 *
 * 功能：
 * 1. 生成基于时间戳的版本号
 * 2. 管理全局配置文件
 * 3. 处理构建输出目录
 * 4. 注入版本信息到 HTML
 *
 * @param {Object} options 插件配置选项
 * @param {VersionEnvSpace.EnvConfig} options.CustomEnv - 环境配置对象
 * @param {'build' | 'serve'} options.command - Vite 命令模式
 * @param {boolean} [options.cleanDir=true] - 是否在构建前清理输出目录
 * @param {string} [options.webTitle] - 网页标题
 * @param {string} [options.GLOBAL_CONFIG_FILE_NAME='app.config.js'] - 全局配置文件名
 * @param {string} [options.GLOBAL_CONFIG_KEY='__GLOBAL_CONFIG__'] - 全局配置在 window 对象中的键名
 * @param {string} [options.GLOBAL_CONFIG_NAME='GLOBAL_CONFIG'] - 全局配置变量名
 * @returns {Object} Vite 插件对象
 */
export default ({
  command,
  CustomEnv,
  cleanDir = true,
  webTitle,
  GLOBAL_CONFIG_FILE_NAME = "app.config.js",
  GLOBAL_CONFIG_KEY = "__GLOBAL_CONFIG__",
  GLOBAL_CONFIG_NAME = "GLOBAL_CONFIG",
}: {
  command: "build" | "serve";
  CustomEnv?: VersionEnvSpace.EnvConfig;
  cleanDir?: boolean;
  webTitle?: string;
  GLOBAL_CONFIG_FILE_NAME?: string;
  GLOBAL_CONFIG_KEY?: string;
  GLOBAL_CONFIG_NAME?: string;
}) => {
  const version = generatorVersionCode();
  const isBuild = command === "build";

  /**
   * 创建全局配置文件
   * 将环境配置写入指定文件，并设置为只读属性
   * @param {string} filePath - 配置文件创建路径
   */
  function creatAppConfigFile(filePath: string) {
    // 如果环境配置不存在，则不创建全局配置文件
    if (!CustomEnv) return;
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

    /**
     * Vite 配置钩子
     * 设置构建配置并处理目录清理
     *
     * 功能：
     * 1. 定义全局变量
     * 2. 设置构建输出目录
     * 3. 清理历史构建文件
     * 4. 处理开发环境配置文件
     *
     * @param {UserConfig} config - Vite 配置对象
     */
    config(config: UserConfig) {
      // 定义全局变量
      config.define = config.define || {};
      // 如果存在环境配置，则定义全局配置变量
      if (CustomEnv) {
        config.define[GLOBAL_CONFIG_NAME] = `window.${GLOBAL_CONFIG_KEY}`;
      }
      config.define.GLOBAL_VERSION_CODE = version;

      if (isBuild) {
        // 构建模式配置
        config.build = config.build || {};
        const outDir = config.build.outDir || "dist";
        config.build.outDir = outDir + "/" + version;

        // 如果启用了清理选项，清理目标目录
        if (cleanDir) {
          const destDir = absolutePath(outDir);
          if (fs.existsSync(destDir)) {
            fs.removeSync(destDir);
          }
        }
      } else {
        // 开发模式：在 public 目录创建配置文件
        creatAppConfigFile(absolutePath("public", GLOBAL_CONFIG_FILE_NAME));
      }
    },

    /**
     * 转换 index.html 钩子
     * 注入版本信息和全局配置到 HTML 中
     *
     * 功能：
     * 1. 替换网页标题
     * 2. 更新资源路径，添加版本号
     * 3. 注入全局配置脚本
     *
     * @param {string} html - 原始 HTML 内容
     * @returns {Object} 转换后的配置对象
     */
    transformIndexHtml: {
      handler(html) {
        // 替换网页标题
        html = html.replace(
          /<title>(.*?)<\/title>/,
          `<title>${webTitle || ""}</title>`
        );
        const config: any = {
          html: html.replace(/\.\//g, `./${version}/`),
          tags: [],
        };
        // 如果存在环境配置，则添加全局配置文件
        if (CustomEnv) {
          config.tags = [
            {
              tag: "script",
              attrs: {
                src: `./${GLOBAL_CONFIG_FILE_NAME}?v=${version}`,
              },
              injectTo: "head-prepend",
            },
          ];
        }
        return config;
      },
    } as
      | IndexHtmlTransformHook
      | { order?: "pre" | "post"; handler: IndexHtmlTransformHook },

    /**
     * 写入打包文件钩子
     * 处理构建后的文件操作
     *
     * 功能：
     * 1. 移除构建目录中的配置文件
     * 2. 在正确位置创建新的配置文件
     * 3. 移动 index.html 到父目录
     *
     * @param {Object} outputOptions - 构建输出选项
     * @param {string} outputOptions.dir - 输出目录路径
     */
    writeBundle(outputOptions: any) {
      if (outputOptions.dir.endsWith(version)) {
        const outputDir = outputOptions.dir || path.resolve(__dirname, "dist");
        const srcDir = path.join(outputDir, "index.html");
        const destDir = path.join(outputDir, "..", "index.html");

        // 从构建目录中移除配置文件
        const fileToRemove = path.join(outputDir, GLOBAL_CONFIG_FILE_NAME);
        if (fs.existsSync(fileToRemove)) {
          fs.removeSync(fileToRemove);
        }

        // 在父目录创建新的配置文件
        creatAppConfigFile(path.join(outputDir, "..", GLOBAL_CONFIG_FILE_NAME));

        // 将 index.html 移动到父目录
        fs.move(srcDir, destDir, { overwrite: true });
      }
    },
  };
};
