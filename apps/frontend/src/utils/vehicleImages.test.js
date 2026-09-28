import { describe, expect, it } from "vitest";

import {
  countVehicleImageTypes,
  getExteriorVehicleImages,
  isInteriorVehicleImage
} from "./vehicleImages";

const images = [
  {
    id: "outside",
    imageUrl: "/image/vehicles/solati-ben-hong.webp",
    altText: "Hyundai Solati bên hông"
  },
  {
    id: "inside-vietnamese",
    imageUrl: "/image/vehicles/solati-2.webp",
    altText: "Nội thất Hyundai Solati"
  },
  {
    id: "inside-file-name",
    imageUrl: "/image/vehicles/khoang-xe-solati.webp",
    altText: "Hyundai Solati"
  }
];

describe("vehicle image classification", () => {
  it("recognizes interior images from metadata and Vietnamese file names", () => {
    expect(isInteriorVehicleImage(images[0])).toBe(false);
    expect(isInteriorVehicleImage(images[1])).toBe(true);
    expect(isInteriorVehicleImage(images[2])).toBe(true);
    expect(isInteriorVehicleImage({ imageType: "interior" })).toBe(true);
    expect(
      isInteriorVehicleImage({
        imageType: "exterior",
        imageUrl: "/image/vehicles/noi-that-cu.webp"
      })
    ).toBe(false);
  });

  it("keeps only exterior images for the fleet section", () => {
    expect(getExteriorVehicleImages(images).map((image) => image.id)).toEqual(["outside"]);
  });

  it("counts exterior and interior images for detail galleries", () => {
    expect(countVehicleImageTypes(images)).toEqual({ exterior: 1, interior: 2 });
  });
});
