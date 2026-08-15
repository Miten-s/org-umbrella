import { Router, Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import asyncHandler from "../middlewares/error.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { uploadAttachment, attachmentPath, removeStoredFile } from "../middlewares/multer.middleware";
import Attachment from "../models/attachment.model";
import { writeAudit, AuditActor } from "../utils/audit.util";
import { formatLimsEntity } from "../utils/format.util";
import { getListQuery } from "../utils/pagination.util";
import API_ROUTES from "../utils/routes";
import { auditNameFor } from "../utils/entity-registry";

/**
 * Files for every entity, through one endpoint.
 *
 * Permission is checked against the **parent**: attaching to a Sample needs
 * `LIMS:UPDATE:SAMPLE`. There is deliberately no `ATTACHMENT` permission — a
 * file is part of the record it hangs off, not a thing you can be granted
 * separately, and adding one to the catalogue would let a role be given file
 * access to records it cannot otherwise see.
 *
 * Uploads and removals are written to the parent's audit trail for the same
 * reason: from an auditor's point of view a document appearing on a batch
 * record is a change to that batch record.
 */
const router = Router();

/** Entity name comes from the body on upload, the query string on list. */
const entityFromRequest = (req: Request): string | undefined =>
  (req.body?.entityName as string) ?? (req.query?.entityName as string);

/**
 * For `/:id` routes the parent isn't in the request — load the row first so
 * `authorize` can check against the real parent rather than a client-supplied
 * entity name, which would be trivially forgeable.
 */
const loadAttachment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const record = await Attachment.findOne({
    where: { id: req.params["id"] as string, isDeleted: false }
  });

  if (!record) return res.status(404).json({ message: "Attachment not found." });

  (req as Request & { attachment?: Attachment }).attachment = record;
  req.body = { ...(req.body ?? {}), entityName: record.entityName };
  next();
});

const loaded = (req: Request) => (req as Request & { attachment?: Attachment }).attachment!;

const actorFrom = (req: Request): AuditActor => ({
  id: req.user?.id ?? "system",
  fullName: req.user?.fullName ?? undefined
});

// ─── Upload ─────────────────────────────────────────────────────────────────
// multer runs before authorize because the entity name lives in the multipart
// body and isn't parsed until then. A rejected upload therefore leaves a file
// on disk, so the failure paths below clean it up.
router.post(
  API_ROUTES.ROOT,
  uploadAttachment.single("file"),
  authorize(entityFromRequest, "UPDATE"),
  asyncHandler(async (req: Request, res: Response) => {
    const { entityName, entityId, comment } = req.body as Record<string, string>;

    if (!req.file) return res.status(400).json({ message: "A file is required." });

    if (!entityId) {
      removeStoredFile(req.file.filename);
      return res.status(400).json({ message: "entityId is required." });
    }

    const created = await Attachment.create({
      entityName,
      entityId,
      fileName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      comment: comment ?? null,
      uploadedBy: req.user?.id ?? null,
      uploadedByName: req.user?.fullName ?? null,
      // Stamp the uploader's home group so attachment lists filter like
      // everything else without a runtime join to the parent table.
      groupId: req.access?.homeGroupId ?? null
    });

    await writeAudit({
      entityName: auditNameFor(entityName),
      entityId,
      action: "UPDATE",
      newValue: { attachmentAdded: created.fileName, attachmentId: created.id },
      changeReason: comment ?? "Attachment added",
      actor: actorFrom(req)
    });

    res.status(201).json({ message: "Attachment uploaded", data: formatLimsEntity(created) });
  })
);

// ─── List for one record ────────────────────────────────────────────────────
router.get(
  API_ROUTES.ROOT,
  authorize(entityFromRequest, "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const { entityName, entityId } = req.query as Record<string, string>;

    if (!entityId) return res.status(400).json({ message: "entityId is required." });

    const { skip, limit } = getListQuery(req.query);
    const scope = req.access!;

    const { count, rows } = await Attachment.findAndCountAll({
      where: {
        entityName,
        entityId,
        isDeleted: false,
        // Same rule as every other list: only your groups, unless OPERATE:ALL.
        ...(scope.operateAll
          ? {}
          : { [Op.or]: [{ groupId: { [Op.in]: scope.accessGroupIds } }, { groupId: null }] })
      },
      offset: skip,
      limit,
      order: [["created_at", "DESC"]]
    });

    res.status(200).json({
      data: formatLimsEntity(rows),
      metadata: { totalCount: count, limit }
    });
  })
);

// ─── Download ───────────────────────────────────────────────────────────────
router.get(
  API_ROUTES.PARAMS + "/download",
  loadAttachment,
  authorize(entityFromRequest, "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const record = loaded(req);
    // Served through the app rather than the static mount so the permission
    // check above actually applies — a bare /uploads URL would bypass it.
    res.download(attachmentPath(record.storedName), record.fileName);
  })
);

// ─── Edit the comment ───────────────────────────────────────────────────────
router.patch(
  API_ROUTES.PARAMS,
  loadAttachment,
  authorize(entityFromRequest, "UPDATE"),
  asyncHandler(async (req: Request, res: Response) => {
    const record = loaded(req);
    const previous = record.comment;

    record.comment = (req.body as { comment?: string }).comment ?? null;
    record.modifiedBy = req.user?.id ?? null;
    await record.save();

    await writeAudit({
      entityName: auditNameFor(record.entityName),
      entityId: record.entityId,
      action: "UPDATE",
      oldValue: { attachmentComment: previous },
      newValue: { attachmentComment: record.comment },
      changeReason: (req.body as { changeReason?: string }).changeReason ?? null,
      actor: actorFrom(req)
    });

    res.status(200).json({ message: "Attachment updated", data: formatLimsEntity(record) });
  })
);

// ─── Remove ─────────────────────────────────────────────────────────────────
router.delete(
  API_ROUTES.PARAMS,
  loadAttachment,
  authorize(entityFromRequest, "UPDATE"),
  asyncHandler(async (req: Request, res: Response) => {
    const record = loaded(req);

    // Soft delete only. The file stays on disk: an audit trail that points at
    // a document nobody can open is not an audit trail.
    record.isDeleted = true;
    record.deletedAt = new Date();
    record.deletedBy = req.user?.id ?? null;
    await record.save();

    await writeAudit({
      entityName: auditNameFor(record.entityName),
      entityId: record.entityId,
      action: "UPDATE",
      oldValue: { attachmentRemoved: record.fileName, attachmentId: record.id },
      changeReason: (req.body as { changeReason?: string })?.changeReason ?? "Attachment removed",
      actor: actorFrom(req)
    });

    res.status(200).json({ message: "Attachment removed" });
  })
);

export default router;
