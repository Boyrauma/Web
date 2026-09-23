import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HomePage, { orderShowcaseVehicles } from "./HomePage";
import {
  fetchBookingCaptcha,
  fetchServices,
  fetchSiteSettings,
  fetchVehicleCategories
} from "../services/api";

vi.mock("../services/api", () => ({
  createBookingRequest: vi.fn(),
  fetchBookingCaptcha: vi.fn(),
  fetchServices: vi.fn(),
  fetchSiteSettings: vi.fn(),
  fetchVehicleCategories: vi.fn(),
  resolveAssetUrl: (path) => path ?? ""
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HomePage booking verification", () => {
  let intersectionCallback;

  beforeEach(() => {
    fetchSiteSettings.mockResolvedValue([]);
    fetchServices.mockResolvedValue([]);
    fetchVehicleCategories.mockResolvedValue([]);
    fetchBookingCaptcha.mockResolvedValue({
      prompt: "1 + 1",
      token: "token",
      proofOfWork: { challenge: "", difficulty: 0 },
      turnstile: { enabled: false, siteKey: "" }
    });

    window.IntersectionObserver = vi.fn(function IntersectionObserver(callback) {
      intersectionCallback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });
  });

  it("does not request captcha until the booking section approaches the viewport", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetchSiteSettings).toHaveBeenCalledTimes(1));
    expect(fetchServices).toHaveBeenCalledTimes(1);
    expect(fetchVehicleCategories).toHaveBeenCalledTimes(1);
    expect(fetchBookingCaptcha).not.toHaveBeenCalled();

    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => expect(fetchBookingCaptcha).toHaveBeenCalledTimes(1));
  });
});

describe("HomePage vehicle showcase", () => {
  it("shows VinFast first, Santa Fe second, and preserves the remaining order", () => {
    const vehicles = [
      { slug: "huyndai-county" },
      { slug: "santafe" },
      { slug: "huyndai-solati" },
      { slug: "vinfat-lux-a2-0" },
      { slug: "huyndai-universe" },
      { slug: "thaco-evergreen" }
    ];

    expect(orderShowcaseVehicles(vehicles).map((vehicle) => vehicle.slug)).toEqual([
      "vinfat-lux-a2-0",
      "santafe",
      "huyndai-county",
      "huyndai-solati",
      "thaco-evergreen",
      "huyndai-universe"
    ]);
  });
});
