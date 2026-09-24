import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ProcessSection from "./ProcessSection";

afterEach(cleanup);

describe("ProcessSection", () => {
  it("places the former FAQ guidance beside the matching booking steps", () => {
    render(<ProcessSection />);

    expect(screen.getByText(/đặt trước 3–7 ngày/i)).toBeTruthy();
    expect(screen.getByText(/sân bay, cưới hỏi, tour nhiều chặng/i)).toBeTruthy();
    expect(screen.getByText(/xác nhận thời gian, lộ trình, số chỗ và dòng xe/i)).toBeTruthy();
    expect(screen.getAllByText("Lưu ý:")).toHaveLength(3);
  });
});
