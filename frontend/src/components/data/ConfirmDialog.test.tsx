import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", roles: [] }, isAuthenticated: true, isLoading: false })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } })
}));

const { default: ConfirmDialog } = await import("./ConfirmDialog");

const confirmButton = () => screen.getByRole("button", { name: "confirm" });
const reasonBox = () => screen.getByRole("textbox");

describe("ConfirmDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("default behaviour (unchanged for GXP callers)", () => {
    it("confirms immediately with no reason argument", async () => {
      const onConfirm = vi.fn();
      render(
        <ConfirmDialog isOpen onClose={vi.fn()} onConfirm={onConfirm} description="Delete it?" />
      );

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      fireEvent.click(confirmButton());

      await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
      expect(onConfirm).toHaveBeenCalledWith(undefined);
    });

    it("lists the affected items", () => {
      render(
        <ConfirmDialog
          isOpen
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          items={["Cold Room A", "Freezer B"]}
        />
      );

      expect(screen.getByText("Cold Room A")).toBeInTheDocument();
      expect(screen.getByText("Freezer B")).toBeInTheDocument();
    });
  });

  describe("requireReason (LIMS compliance)", () => {
    it("blocks confirmation until a reason is typed", async () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog isOpen requireReason onClose={vi.fn()} onConfirm={onConfirm} />);

      fireEvent.click(confirmButton());

      await waitFor(() => expect(screen.getByText("limsChangeReasonRequired")).toBeInTheDocument());
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("rejects whitespace as a reason", async () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog isOpen requireReason onClose={vi.fn()} onConfirm={onConfirm} />);

      fireEvent.change(reasonBox(), { target: { value: "   " } });
      fireEvent.click(confirmButton());

      await waitFor(() => expect(screen.getByText("limsChangeReasonRequired")).toBeInTheDocument());
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("passes the trimmed reason through to onConfirm", async () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog isOpen requireReason onClose={vi.fn()} onConfirm={onConfirm} />);

      fireEvent.change(reasonBox(), { target: { value: "  Relocated to Block C  " } });
      fireEvent.click(confirmButton());

      await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("Relocated to Block C"));
    });

    it("clears the validation error once the user starts typing", async () => {
      render(<ConfirmDialog isOpen requireReason onClose={vi.fn()} onConfirm={vi.fn()} />);

      fireEvent.click(confirmButton());
      await waitFor(() => expect(screen.getByText("limsChangeReasonRequired")).toBeInTheDocument());

      fireEvent.change(reasonBox(), { target: { value: "Typo fix" } });

      await waitFor(() =>
        expect(screen.queryByText("limsChangeReasonRequired")).not.toBeInTheDocument()
      );
    });

    it("does not carry a reason over to the next time it opens", () => {
      const { rerender } = render(
        <ConfirmDialog isOpen requireReason onClose={vi.fn()} onConfirm={vi.fn()} />
      );

      fireEvent.change(reasonBox(), { target: { value: "First reason" } });
      rerender(
        <ConfirmDialog isOpen={false} requireReason onClose={vi.fn()} onConfirm={vi.fn()} />
      );
      rerender(<ConfirmDialog isOpen requireReason onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(reasonBox()).toHaveValue("");
    });
  });
});
