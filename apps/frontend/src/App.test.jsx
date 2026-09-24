import { describe, expect, it } from "vitest";

import { getHashTargetScrollTop } from "./App";

describe("getHashTargetScrollTop", () => {
  it("places a tall section below the sticky header instead of hiding its heading", () => {
    expect(
      getHashTargetScrollTop({
        scrollY: 1000,
        elementTop: 500,
        elementHeight: 1065,
        viewportHeight: 812,
        headerHeight: 81
      })
    ).toBe(1403);
  });

  it("centers a section when it fits in the available viewport", () => {
    expect(
      getHashTargetScrollTop({
        scrollY: 2000,
        elementTop: 500,
        elementHeight: 475,
        viewportHeight: 900,
        headerHeight: 89
      })
    ).toBe(2243);
  });
});
