import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FleetSection from "./FleetSection";

afterEach(cleanup);

describe("FleetSection", () => {
  it("opens an exterior-only gallery while leaving interior images for vehicle details", () => {
    const handleOpenGallery = vi.fn();
    const vehicleCategories = [
      {
        id: "category-1",
        name: "Xe 16 chỗ",
        description: "Xe phục vụ đoàn vừa.",
        vehicles: [
          {
            id: "vehicle-1",
            name: "Hyundai Solati",
            images: [
              {
                id: "outside",
                imageUrl: "/image/vehicles/solati-ben-hong.webp",
                altText: "Hyundai Solati bên hông"
              },
              {
                id: "inside",
                imageUrl: "/image/vehicles/noi-that-solati.webp",
                altText: "Nội thất Hyundai Solati"
              }
            ]
          }
        ]
      }
    ];

    render(
      <FleetSection
        vehicleCategories={vehicleCategories}
        resolveAssetUrl={(value) => value}
        onOpenGallery={handleOpenGallery}
      />
    );

    expect(screen.getByText("1 ảnh")).toBeTruthy();
    expect(screen.queryByAltText("Nội thất Hyundai Solati")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mở bộ ảnh Xe 16 chỗ" }));

    expect(handleOpenGallery).toHaveBeenCalledWith(
      "Xe 16 chỗ",
      [
        {
          id: "outside",
          fullUrl: "/image/vehicles/solati-ben-hong.webp",
          altText: "Hyundai Solati bên hông"
        }
      ],
      0
    );
  });
});
