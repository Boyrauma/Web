import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VehicleGalleryLightbox from "./VehicleGalleryLightbox";

const gallery = [
  { id: "one", fullUrl: "/one.webp", altText: "Ảnh xe phía trước" },
  { id: "two", fullUrl: "/two.webp", altText: "Ảnh xe bên hông" }
];

function LightboxHarness() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button type="button" autoFocus>
        Mở bộ ảnh
      </button>
      <main data-testid="page-content">Nội dung trang xe</main>
      {isOpen ? (
        <VehicleGalleryLightbox
          gallery={gallery}
          title="Hyundai Santa Fe"
          currentIndex={0}
          onClose={() => setIsOpen(false)}
          onPrev={vi.fn()}
          onNext={vi.fn()}
          onSelect={vi.fn()}
        />
      ) : null}
    </div>
  );
}

beforeEach(() => {
  vi.spyOn(window.HTMLElement.prototype, "getClientRects").mockReturnValue([
    {
      bottom: 1,
      height: 1,
      left: 0,
      right: 1,
      top: 0,
      width: 1,
      x: 0,
      y: 0,
      toJSON() {}
    }
  ]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("VehicleGalleryLightbox", () => {
  it("moves focus into the dialog and hides the background", () => {
    render(<LightboxHarness />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Đóng bộ ảnh" }));
    expect(screen.getByTestId("page-content").hasAttribute("inert")).toBe(true);
    expect(screen.getByTestId("page-content").getAttribute("aria-hidden")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("traps keyboard focus and restores it after Escape", () => {
    render(<LightboxHarness />);

    const closeButton = screen.getByRole("button", { name: "Đóng bộ ảnh" });
    const nextButtons = screen.getAllByRole("button", { name: "Ảnh tiếp theo" });
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(nextButtons[nextButtons.length - 1]);

    closeButton.focus();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Mở bộ ảnh" }));
    expect(screen.getByTestId("page-content").hasAttribute("inert")).toBe(false);
    expect(screen.getByTestId("page-content").getAttribute("aria-hidden")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});
