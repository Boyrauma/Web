import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import StickyContactBar from "./StickyContactBar";

afterEach(cleanup);

describe("StickyContactBar", () => {
  it("links the mobile booking action back to the homepage booking form", () => {
    render(
      <MemoryRouter initialEntries={["/xe/santafe"]}>
        <StickyContactBar hotline="0979860498" />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Đặt lịch" }).getAttribute("href")).toBe("/#booking");
  });
});
