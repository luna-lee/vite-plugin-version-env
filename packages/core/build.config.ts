import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  entries: ["./src/ConfigBaseUrl","./src/index"],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
