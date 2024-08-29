import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  entries: ["./src/AxiosProxy","./src/index"],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
