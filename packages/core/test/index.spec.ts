import { describe, test, expect } from "vitest";
import { treeDataFactory, arrayRemoveItem } from "../src/index";
import {
  sourceData,
  structureTreeData,
  objByIdTreeData,
  leavesTreeData,
  flatDataTreeData,
} from "./test-source/testTreeData";
import { source, target } from "./test-source/arrayRemoveItemData";
describe("plugin test.", () => {
  test("treeDataFactory", async () => {
    const { treeData, objById, leaves, flatData } = treeDataFactory({
      source: sourceData,
      pId: "parentId",
      id: "id",
    });
    expect(treeData).toStrictEqual(structureTreeData);
    expect(objById).toStrictEqual(objByIdTreeData);
    expect(leaves).toStrictEqual(leavesTreeData);
    expect(flatData).toStrictEqual(flatDataTreeData);
  });

  test("arrayRemoveItem", async () => {
    arrayRemoveItem(source, (item) => {
      return item.a > 1;
    });
    expect(source).toStrictEqual(target);
  });
});
