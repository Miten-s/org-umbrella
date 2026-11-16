import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
      { label: "Text Type", value: "Text" }
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

const save = () =>
  fireEvent.click(screen.getByRole("button", { name: "save" }));

describe("SubFormGrid", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an empty table when there are no rows", () => {
    renderGrid([]);
    expect(screen.getByText("limsNoRows")).toBeInTheDocument();
  });

  it("adds the entry form's values as a new row on Save", () => {
    const onChange = renderGrid([{ name: "pH" }]);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Assay" }
    });
    fireEvent.change(screen.getByLabelText("Qty"), { target: { value: "42" } });
    save();

    expect(onChange).toHaveBeenCalledWith([
      { name: "pH" },
      { name: "Assay", qty: 42 }
    ]);
  });

  it("starts each entry from the newRow factory", () => {
    const onChange = renderGrid([], vi.fn(), {
      newRow: () => ({ type: "Numeric" })
    });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "x" } });
    save();

    expect(onChange).toHaveBeenCalledWith([{ type: "Numeric", name: "x" }]);
  });

  it("refuses an empty entry", () => {
    const onChange = renderGrid([]);
    save();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("subFormEntryEmpty")).toBeInTheDocument();
  });

  it("shows validateRow's message instead of adding", () => {
    const onChange = renderGrid([], vi.fn(), {
      validateRow: (row: Row) => (row.qty ? undefined : "Qty is required")
    });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "x" } });
    save();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Qty is required")).toBeInTheDocument();
  });

  it("lists saved rows in the table with option labels", () => {
    renderGrid([{ name: "pH", qty: 3, active: true, type: "Text" }]);
    const table = within(screen.getByRole("table"));
    expect(table.getByText("pH")).toBeInTheDocument();
    expect(table.getByText("3")).toBeInTheDocument();
    expect(table.getByText("yes")).toBeInTheDocument();
    expect(table.getByText("Text Type")).toBeInTheDocument();
  });

  it("edits a row in the entry form and writes it back in place", () => {
    const onChange = renderGrid([{ name: "pH" }, { name: "Assay" }]);

    fireEvent.click(screen.getByRole("button", { name: "edit Components 2" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Assay");
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Purity" }
    });
    save();

    expect(onChange).toHaveBeenCalledWith([{ name: "pH" }, { name: "Purity" }]);
  });

  it("views a row read-only", () => {
    renderGrid([{ name: "pH" }]);
    fireEvent.click(
      screen.getByRole("button", { name: "limsEntryView Components 1" })
    );
    expect(screen.getByLabelText("Name")).toHaveValue("pH");
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "save" })
    ).not.toBeInTheDocument();
  });

  it("removes the right row", () => {
    const onChange = renderGrid([{ name: "a" }, { name: "b" }, { name: "c" }]);
    fireEvent.click(
      screen.getByRole("button", { name: "delete Components 2" })
    );
    expect(onChange).toHaveBeenCalledWith([{ name: "a" }, { name: "c" }]);
  });

  it("is read-only when disabled — no entry form, edit or delete", () => {
    renderGrid([{ name: "pH" }], vi.fn(), { disabled: true });
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^edit/ })
    ).not.toBeInTheDocument();
  });

  it("can hide only the entry form, keeping rows removable", () => {
    renderGrid([{ name: "pH" }], vi.fn(), { allowAdd: false });
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "delete Components 1" })
    ).toBeInTheDocument();
  });

  it("pages the table past 20 rows", () => {
    renderGrid(Array.from({ length: 25 }, (_, i) => ({ name: `r${i + 1}` })));
    const table = within(screen.getByRole("table"));
    expect(table.getByText("r20")).toBeInTheDocument();
    expect(table.queryByText("r21")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "›" }));
    expect(
      within(screen.getByRole("table")).getByText("r21")
    ).toBeInTheDocument();
  });

  it("patches sibling cells via onChangeValue when a cell changes", () => {
    const onChange = vi.fn();
    render(
      <SubFormGrid<Row>
        label="Components"
        columns={[
          { key: "name", header: "Name" },
          {
            ...columns[3],
            onChangeValue: (_row: Row, value: unknown) =>
              value === "Text" ? { name: "" } : {}
          }
        ]}
        rows={[]}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "pH" }
    });
    fireEvent.click(screen.getByLabelText("Type"));
    fireEvent.click(screen.getByText("Text Type"));
    expect(screen.getByLabelText("Name")).toHaveValue("");
  });

  it("locks a cell via readOnly", () => {
    render(
      <SubFormGrid<Row>
        label="Components"
        columns={[{ ...columns[3], readOnly: () => true }]}
        rows={[]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Type")).toBeDisabled();
  });
});
