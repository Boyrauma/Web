import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AdaptiveVehicleImage from "./AdaptiveVehicleImage";

afterEach(cleanup);

function loadImage(image, width, height) {
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height }
  });
  fireEvent.load(image);
}

describe("AdaptiveVehicleImage", () => {
  it("shows a contained portrait image over a blurred backdrop", () => {
    const { container, getByAltText } = render(
      <AdaptiveVehicleImage src="/portrait.webp" alt="Xe dọc" />
    );

    loadImage(getByAltText("Xe dọc"), 960, 1280);

    expect(container.querySelector(".vehicle-stage-image-portrait")).not.toBeNull();
    expect(container.querySelector(".vehicle-stage-image-backdrop")).not.toBeNull();
  });

  it("keeps a landscape image in the existing cover layout", () => {
    const { container, getByAltText } = render(
      <AdaptiveVehicleImage src="/landscape.webp" alt="Xe ngang" />
    );

    loadImage(getByAltText("Xe ngang"), 1280, 960);

    expect(container.querySelector(".vehicle-stage-image-portrait")).toBeNull();
    expect(container.querySelector(".vehicle-stage-image-backdrop")).toBeNull();
  });
});
