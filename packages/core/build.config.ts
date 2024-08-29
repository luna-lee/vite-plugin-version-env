import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  entries: ["./src/SetAxiosProxy","./src/VersionPlugin"],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
