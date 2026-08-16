import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", roles: [] }, isAuthenticated: true, isLoading: false })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } })
}));

const { default: SubFormGrid } = await import("./SubFormGrid");

interface Row extends Record<string, unknown> {
  name?: string;
  qty?: number;
  active?: boolean;
  type?: string;
}

const columns = [
  { key: "name" as const, header: "Name" },
  { key: "qty" as const, header: "Qty", type: "number" as const },
  { key: "active" as const, header: "Active", type: "checkbox" as const },
  {
    key: "type" as const,
    header: "Type",
    type: "select" as const,
    options: [
      { label: "Numeric", value: "Numeric" },
      { label: "Text", value: "Text" }
    ]
  }
];

const renderGrid = (rows: Row[], onChange = vi.fn(), extra = {}) => {
  render(
    <SubFormGrid<Row>
      label="Components"
      columns={columns}
      rows={rows}
      onChange={onChange}
      {...extra}
    />
  );
  return onChange;
};

describe("SubFormGrid", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an empty state when there are no rows", () => {
    renderGrid([]);
    expect(screen.getByText("limsNoRows")).toBeInTheDocument();
  });

  it("renders one input per column per row", () => {
    renderGrid([{ name: "pH", qty: 3, active: true, type: "Numeric" }]);

    expect(screen.getByLabelText("Name")).toHaveValue("pH");
    expect(screen.getByLabelText("Qty")).toHaveValue(3);
    expect(screen.getByLabelText("Active")).toBeChecked();
    // Select cells render the shared SelectDropdown, whose trigger is a button
    // showing the chosen option's label — not an <input> with a value.
    expect(screen.getByLabelText("Type")).toHaveTextContent("Numeric");
  });

  it("writes back the option picked from a select cell", () => {
    const onChange = renderGrid([{ name: "pH", type: "Numeric" }]);

    fireEvent.click(screen.getByLabelText("Type"));
    fireEvent.click(screen.getByText("Text"));

    expect(onChange).toHaveBeenCalledWith([{ name: "pH", type: "Text" }]);
  });

  it("appends a blank row via the add button", () => {
    const onChange = renderGrid([]);

    fireEvent.click(screen.getByRole("button", { name: "limsAddRow" }));

    expect(onChange).toHaveBeenCalledWith([{}]);
  });

  it("uses the newRow factory for defaults", () => {
    const onChange = vi.fn();
    renderGrid([], onChange, { newRow: () => ({ type: "Numeric" }) });

    fireEvent.click(screen.getByRole("button", { name: "limsAddRow" }));

    expect(onChange).toHaveBeenCalledWith([{ type: "Numeric" }]);
  });

  it("edits a cell without disturbing the other rows", () => {
    const onChange = renderGrid([{ name: "pH" }, { name: "Assay" }]);

    fireEvent.change(screen.getAllByLabelText("Name")[1], { target: { value: "Purity" } });

    expect(onChange).toHaveBeenCalledWith([{ name: "pH" }, { name: "Purity" }]);
  });

  it("coerces numeric cells to numbers, and blanks to empty", () => {
    const onChange = renderGrid([{ qty: 1 }]);
    const input = screen.getByLabelText("Qty");

    fireEvent.change(input, { target: { value: "42" } });
    expect(onChange).toHaveBeenLastCalledWith([{ qty: 42 }]);

    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith([{ qty: "" }]);
  });

  it("removes the right row", () => {
    const onChange = renderGrid([{ name: "a" }, { name: "b" }, { name: "c" }]);

    fireEvent.click(screen.getByRole("button", { name: "delete 2" }));

    expect(onChange).toHaveBeenCalledWith([{ name: "a" }, { name: "c" }]);
  });

  it("is read-only when disabled — no add, no remove, inputs locked", () => {
    renderGrid([{ name: "pH" }], vi.fn(), { disabled: true });

    expect(screen.queryByRole("button", { name: "limsAddRow" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeDisabled();
  });

  it("stacks into cards once there are too many columns for a row", () => {
    // Analysis Components has 13; a table row squeezes each input to a few
    // characters behind a horizontal scrollbar.
    const wide = Array.from({ length: 9 }, (_, i) => ({
      key: `f${i}` as const,
      header: `Field ${i}`
    }));

    const onChange = vi.fn();
    render(
      <SubFormGrid<Record<string, unknown>>
        label="Components"
        columns={wide}
        rows={[{ f0: "a" }]}
        onChange={onChange}
      />
    );

    // No header row — each field carries its own label instead.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Components 1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Field 3"), { target: { value: "x" } });
    expect(onChange).toHaveBeenCalledWith([{ f0: "a", f3: "x" }]);
  });

  it("keeps the table layout for narrow grids", () => {
    renderGrid([{ name: "pH" }]);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("can hide only the add button, keeping rows removable", () => {
    renderGrid([{ name: "pH" }], vi.fn(), { allowAdd: false });

    expect(screen.queryByRole("button", { name: "limsAddRow" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "delete 1" })).toBeInTheDocument();
  });
});
