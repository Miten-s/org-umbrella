import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", roles: [] },
    isAuthenticated: true,
    isLoading: false
  })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } })
}));

const { default: FormulaBuilder } = await import("./FormulaBuilder");

const rows = [
  { componentId: "TITRE", name: "Titre", description: "d", type: "VALUE" },
  { componentId: "WEIGHT", name: "Weight", description: "d", type: "VALUE" },
  { componentId: "NOTE", name: "Note", description: "d", type: "TEXT" },
  {
    componentId: "ASSAY",
    name: "Assay",
    description: "d",
    type: "CALCULATION"
  }
];

const renderBuilder = (formula = "") => {
  const onApply = vi.fn();
  const onClose = vi.fn();
  render(
    <FormulaBuilder
      formula={formula}
      selfId="ASSAY"
      selfName="Assay"
      rows={rows}
      onApply={onApply}
      onClose={onClose}
    />
  );
  return { onApply, onClose };
};

describe("FormulaBuilder", () => {
  it("offers only the template's other Value/Calculation components", () => {
    renderBuilder();
    expect(screen.getByRole("button", { name: /Titre/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Weight/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Note/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Assay/ })).toBeNull();
  });

  it("builds a formula from clicks and applies it", () => {
    const { onApply } = renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: /Titre/ }));
    fireEvent.click(screen.getByRole("button", { name: "/" }));
    fireEvent.click(screen.getByRole("button", { name: /Weight/ }));
    fireEvent.click(screen.getByRole("button", { name: "*" }));
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "limsFormulaApply" }));
    expect(onApply).toHaveBeenCalledWith("{TITRE} / {WEIGHT} * 100");
  });

  it("blocks Apply while the formula is invalid", () => {
    const { onApply } = renderBuilder("{ASSAY} + 1");
    fireEvent.click(screen.getByRole("button", { name: "limsFormulaApply" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText(/can't refer to itself/)).toBeTruthy();
  });

  it("deletes a whole component reference with backspace", () => {
    renderBuilder("{TITRE} * {WEIGHT}");
    fireEvent.click(
      screen.getByRole("button", { name: "limsFormulaBackspace" })
    );
    expect(
      (screen.getByRole("textbox", { name: "limsFormula" }) as HTMLInputElement)
        .value
    ).toBe("{TITRE} *");
  });

  it("closes on Escape without the form underneath seeing it", () => {
    const formEscape = vi.fn();
    document.addEventListener("keydown", formEscape);
    const { onClose } = renderBuilder();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    expect(formEscape).not.toHaveBeenCalled();
    document.removeEventListener("keydown", formEscape);
  });
});
