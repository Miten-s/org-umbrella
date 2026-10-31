/** What an Entity Template can query: each table and the only fields its rules may use. A query
 * names these keys, never columns, so nothing outside this list can reach the database. */
export type EntityFieldType = "ref" | "text" | "number" | "date";

export type FieldSource = { phrase: string } | { table: string };

export interface EntityField {
  label: string;
  type: EntityFieldType;
  column: string;
  /** A ref's values come from a pick list or another table. */
  source?: FieldSource;
  /** The field sits on this parent relation; `column` is then the database column name. */
  via?: string;
}

export interface EntityTable {
  label: string;
  /** Columns the picker searches and shows. */
  nameColumns: string[];
  fields: Record<string, EntityField>;
}

const ref = (
  label: string,
  column: string,
  source: FieldSource,
  via?: string
): EntityField => ({ label, type: "ref", column, source, via });
const text = (label: string, column: string): EntityField => ({
  label,
  type: "text",
  column
});
const date = (label: string, column: string): EntityField => ({
  label,
  type: "date",
  column
});
const number = (label: string, column: string): EntityField => ({
  label,
  type: "number",
  column
});

const group = ref("Lab Group", "groupId", { table: "GROUP" });
const location = (column = "locationId") =>
  ref("Location", column, { table: "LOCATION" });
const supplier = (column = "supplierId") =>
  ref("Supplier", column, { table: "SUPPLIER" });

export const ENTITY_TABLES: Record<string, EntityTable> = {
  INSTRUMENT: {
    label: "Instrument",
    nameColumns: ["name", "instrumentId"],
    fields: {
      name: text("Name", "name"),
      typeId: ref("Type", "typeId", { phrase: "INSTRUMENT_TYPE" }),
      measurementTypeId: ref("Measurement type", "measurementTypeId", {
        phrase: "MEASUREMENT_TYPE"
      }),
      statusId: ref("Status", "statusId", { phrase: "INSTRUMENT_STATUS" }),
      locationId: location(),
      supplierId: supplier(),
      manufacturer: text("Manufacturer", "manufacturer"),
      serialNumber: text("Serial number", "serialNumber"),
      dateInstalled: date("Date installed", "dateInstalled"),
      groupId: group
    }
  },
  STOCK: {
    label: "Stock Item",
    nameColumns: ["stockName", "stockId"],
    fields: {
      stockName: text("Name", "stockName"),
      stockTypeId: ref("Stock type", "stockTypeId", { phrase: "STOCK_TYPE" }),
      defaultLocationId: location("defaultLocationId"),
      preferredSupplierId: supplier("preferredSupplierId"),
      unit: text("Unit", "unit"),
      targetAmount: number("Target amount", "targetAmount"),
      groupId: group
    }
  },
  STOCK_BATCH: {
    label: "Stock Batch",
    nameColumns: ["stockBatchId", "internalBatchId"],
    fields: {
      statusId: ref("Status", "statusId", { phrase: "STOCK_BATCH_STATUS" }),
      stockId: ref("Stock Item", "stockId", { table: "STOCK" }),
      stockTypeId: ref(
        "Stock type",
        "stock_type_id",
        { phrase: "STOCK_TYPE" },
        "stock"
      ),
      locationId: location(),
      supplierId: supplier(),
      projectId: ref("Project", "projectId", { table: "PROJECT" }),
      expiryDate: date("Expiry date", "expiryDate"),
      manufacturingDate: date("Manufacturing date", "manufacturingDate"),
      currentAmount: number("Current amount", "currentAmount"),
      unit: text("Unit", "unit"),
      groupId: group
    }
  },
  LIMS_USER: {
    label: "Lab User",
    nameColumns: ["userName"],
    fields: {
      userName: text("Name", "userName"),
      groupId: group,
      locationId: location()
    }
  },
  LOCATION: {
    label: "Storage Location",
    nameColumns: ["locationName", "locationId"],
    fields: {
      locationName: text("Name", "locationName"),
      locationTypeId: ref("Location type", "locationTypeId", {
        phrase: "LOCATION_TYPE"
      }),
      parentLocationId: ref("Parent location", "parentLocationId", {
        table: "LOCATION"
      }),
      groupId: group
    }
  },
  SUPPLIER: {
    label: "Supplier",
    nameColumns: ["supplierName", "supplierId"],
    fields: {
      supplierName: text("Name", "supplierName"),
      ratingId: ref("Rating", "ratingId", { phrase: "RATING" }),
      contactName: text("Contact name", "contactName"),
      groupId: group
    }
  },
  CUSTOMER: {
    label: "Customer",
    nameColumns: ["customerName", "customerId"],
    fields: {
      customerName: text("Name", "customerName"),
      ratingId: ref("Rating", "ratingId", { phrase: "RATING" }),
      contactName: text("Contact name", "contactName"),
      groupId: group
    }
  },
  LOT: {
    label: "Lot",
    nameColumns: ["lotName", "lotId"],
    fields: {
      lotName: text("Name", "lotName"),
      batchId: ref("Batch", "batchId", { table: "BATCH" }),
      status: text("Status", "status"),
      groupId: group
    }
  },
  BATCH: {
    label: "Batch",
    nameColumns: ["batchName", "batchId"],
    fields: {
      batchName: text("Name", "batchName"),
      status: text("Status", "status"),
      groupId: group
    }
  }
};

export const OPERATORS: Record<EntityFieldType, string[]> = {
  ref: ["=", "!="],
  text: ["=", "!=", "contains"],
  number: ["=", "!=", ">", ">=", "<", "<="],
  date: ["=", "!=", "before", "after"]
};

export const MAX_QUERY_DEPTH = 3;
