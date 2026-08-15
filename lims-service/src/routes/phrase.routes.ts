import { Router, Request, Response } from "express";
import { Op } from "sequelize";
import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreatePhraseDto, UpdatePhraseDto } from "../dtos/master-data.dto";
import { authorize } from "../middlewares/authorize.middleware";
import { getPaginationOptions } from "../utils/pagination.util";
import asyncHandler from "../middlewares/error.middleware";

/**
 * Pick Lists. The first entity built on the factory, and the reference for the
 * rest: a config object, no bespoke controller/service/repo.
 *
 * `entries[]` is a nested sub-form — sent inside the Phrase payload, saved in
 * the same transaction, and reported as one audit entry whose `childChanges`
 * names exactly which value was added, changed or removed.
 */
export const phraseConfig: CrudConfig<Phrase> = {
  model: Phrase,
  entityName: "Pick List",
  permissionEntity: "PHRASE",
  uniqueField: "phrase",
  // Pick lists are shared by every group, so they are never stamped with the
  // creator's home group.
  globalReference: true,
  searchFields: ["phrase", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: PhraseEntry,
      as: "entries",
      attributes: ["id", "phraseEntryId", "name", "description"],
      required: false
    }
  ],
  relationFields: { group: "groupId" },
  children: [
    {
      field: "entries",
      model: PhraseEntry,
      foreignKey: "phraseId",
      fields: ["phraseEntryId", "name", "description"],
      // The business key, not the row id — renaming a value must read as a
      // change to that value, not a delete plus an insert.
      matchKey: "phraseEntryId"
    }
  ]
};

const service = buildCrudService(phraseConfig);

const crudRouter = buildCrudRouter({
  service,
  entityName: phraseConfig.entityName,
  permissionEntity: phraseConfig.permissionEntity,
  createDto: CreatePhraseDto,
  updateDto: UpdatePhraseDto
});

/**
 * Values of one pick list, e.g. `GET /entries?phrase=RATING` — feeds every
 * phrase-driven dropdown across LIMS (Rating, Location Type, Stock Type,
 * Calibration Type/Status, Analysis Type, Approval Status, Sample Type, ...).
 *
 * Registered on its own router mounted BEFORE the generic CRUD router below:
 * without this, `/entries` falls through to that router's `GET /:id` and
 * "entries" gets read as a record id, failing as an invalid UUID.
 */
const router = Router();

router.get(
  "/entries",
  authorize("PHRASE", "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const phraseCode = typeof req.query.phrase === "string" ? req.query.phrase : undefined;
    if (!phraseCode) {
      return res.status(400).json({ message: "phrase is required." });
    }

    const { page, limit, skip, search } = getPaginationOptions(req.query);
    const where = search ? { name: { [Op.iLike]: `%${search}%` } } : undefined;

    const { rows, count } = await PhraseEntry.findAndCountAll({
      where,
      include: [{ model: Phrase, as: "phrase", where: { phrase: phraseCode }, attributes: [] }],
      order: [["name", "ASC"]],
      limit,
      offset: skip
    });

    res.status(200).json({
      data: rows,
      metadata: {
        totalCount: count,
        currentPage: page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  })
);

router.use(crudRouter);

export default router;
