import { describe, expect, it } from "vitest";

import {
  getHashTargetScrollTop,
  getNavigationScrollDuration,
  getNavigationScrollProgress
} from "./App";

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

  it("keeps shortcut motion responsive for both short and long distances", () => {
    expect(getNavigationScrollDuration(100)).toBe(360);
    expect(getNavigationScrollDuration(2000)).toBe(360);
    expect(getNavigationScrollDuration(5000)).toBe(700);
  });

  it("uses an ease-out curve without overshooting the target", () => {
    expect(getNavigationScrollProgress(-1)).toBe(0);
    expect(getNavigationScrollProgress(0.5)).toBe(0.875);
    expect(getNavigationScrollProgress(2)).toBe(1);
  });
});
