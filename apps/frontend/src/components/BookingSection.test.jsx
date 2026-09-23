import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookingSection from "./BookingSection";

afterEach(cleanup);

const formData = {
  customerName: "",
  phoneNumber: "",
  tripDate: "",
  passengerCount: "",
  pickupLocation: "",
  dropoffLocation: "",
  note: "",
  website: ""
};

function renderBookingSection(onBookingIntent) {
  render(
    <BookingSection
      sectionRef={null}
      onBookingIntent={onBookingIntent}
      hotline="0979860498"
      formData={formData}
      submitState={{ loading: false, message: "", error: "" }}
      captchaState={{
        initialized: false,
        loading: false,
        proofLoading: false,
        token: "",
        proofNonce: ""
      }}
      turnstileState={{ enabled: false, token: "" }}
      handleTurnstileTokenChange={vi.fn()}
      handleTurnstileError={vi.fn()}
      handleCaptchaRetry={vi.fn()}
      handleChange={vi.fn()}
      handleSubmit={vi.fn()}
    />
  );
}

describe("BookingSection", () => {
  it("prepares booking verification only after the visitor interacts with the form", () => {
    const onBookingIntent = vi.fn();
    renderBookingSection(onBookingIntent);

    const submitButton = screen.getByRole("button", { name: "Gửi lịch xe" });
    expect(submitButton.disabled).toBe(true);
    expect(onBookingIntent).not.toHaveBeenCalled();

    fireEvent.focus(screen.getByRole("textbox", { name: "Họ và tên" }));

    expect(onBookingIntent).toHaveBeenCalledTimes(1);
  });

  it("limits public booking fields before they reach the API", () => {
    renderBookingSection(vi.fn());

    expect(screen.getByRole("textbox", { name: "Họ và tên" }).maxLength).toBe(100);
    expect(screen.getByRole("textbox", { name: "Số điện thoại" }).maxLength).toBe(20);
    expect(screen.getByRole("spinbutton", { name: "Số người" }).max).toBe("200");
    expect(screen.getByRole("textbox", { name: "Điểm đón" }).maxLength).toBe(200);
    expect(screen.getByRole("textbox", { name: "Điểm đến" }).maxLength).toBe(200);
    expect(screen.getByRole("textbox", { name: "Nhu cầu chi tiết" }).maxLength).toBe(2000);
  });
});
