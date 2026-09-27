import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HelpTooltip from "./HelpTooltip";
import Label from "./form/Label";

describe("HelpTooltip", () => {
  it("shows its message only while hovered", () => {
    render(<HelpTooltip content="Only Approved templates" />);
    const trigger = screen.getByRole("button", { name: "More information" });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Only Approved templates"
    );
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("is rendered by Label only when a tooltip is passed", () => {
    const { rerender } = render(<Label>Unit</Label>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(<Label tooltip="Pick from the Units pick list">Unit</Label>);
    fireEvent.focus(screen.getByRole("button", { name: "More information" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Pick from the Units pick list"
    );
  });
});
