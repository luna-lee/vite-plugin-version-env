import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  entries: ["./src/SetDevProxy","./src/index"],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
