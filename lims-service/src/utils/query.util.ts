import { Request } from "express";
import { Model, ModelStatic } from "sequelize";

export interface ListQueryParams {
  skip: number;
  limit: number;
  includeRemoved: boolean;
  sortBy: string;
  sortDir: "ASC" | "DESC";
  filters: Record<string, any>;
}

export const parseListQuery = (req: Request): ListQueryParams => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const includeRemoved = req.query.includeRemoved === "true";

  let sortBy = "createdAt";
  if (typeof req.query.sortBy === "string" && req.query.sortBy.trim() !== "") {
    sortBy = req.query.sortBy.trim();
  }

  let sortDir: "ASC" | "DESC" = "DESC";
  if (typeof req.query.sortDir === "string") {
    const dir = req.query.sortDir.toUpperCase();
    if (dir === "ASC" || dir === "DESC") {
      sortDir = dir;
    }
  }

  // Parse filters from ?filter[status]=active
  const filters: Record<string, any> = {};
  if (req.query.filter && typeof req.query.filter === "object") {
    for (const [key, value] of Object.entries(req.query.filter)) {
      if (typeof value === "string") {
        filters[key] = value;
      }
    }
  }

  return { skip, limit, includeRemoved, sortBy, sortDir, filters };
};

export const getSafeFilters = (model: ModelStatic<Model>, filters: any) => {
  const safeFilters: any = {};
  try {
    const validAttributes = Object.keys(model.rawAttributes || {});
    for (const key of Object.keys(filters)) {
      if (validAttributes.includes(key)) {
        safeFilters[key] = filters[key];
      }
    }
  } catch (e) {
    // fallback if rawAttributes fails
  }
  return safeFilters;
};
