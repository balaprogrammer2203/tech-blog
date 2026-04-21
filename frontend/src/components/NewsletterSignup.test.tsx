import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterSignup } from "./NewsletterSignup";
import { renderWithProviders } from "@/test/testUtils";

describe("NewsletterSignup", () => {
  it("renders heading and form", () => {
    renderWithProviders(<NewsletterSignup />);
    expect(screen.getByRole("heading", { name: /newsletter/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@company/i)).toBeInTheDocument();
  });

  it("shows confirmation after submit with valid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewsletterSignup />);
    await user.type(screen.getByPlaceholderText(/you@company/i), "reader@example.com");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/on the list/i);
  });
});
