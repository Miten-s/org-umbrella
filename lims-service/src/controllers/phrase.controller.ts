import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import * as phraseService from "../services/phrase.service";
import { getPaginationOptions } from "../utils/pagination.util";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";

export const createPhrase = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, isSystem, entries } = req.body;
  const phrase = await phraseService.createPhrase(
    { name, description, isSystem: isSystem || false },
    entries || []
  );
  res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, "Phrase"), data: phrase });
});

export const updatePhrase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { name, description, entries } = req.body;
  const phrase = await phraseService.updatePhrase(
    id,
    { name, description },
    entries
  );
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, "Phrase"), data: phrase });
});

export const getPhraseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const phrase = await phraseService.getPhraseById(id);
  res.status(200).json({ data: phrase });
});

export const getAllPhrases = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const result = await phraseService.getAllPhrases(page, limit);
  res.status(200).json({
    data: result.phrases,
    metadata: {
      totalCount: result.total,
      currentPage: page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    }
  });
});

export const deletePhrase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id || "system"; // Should be authenticated user
  await phraseService.deletePhrase(id, userId);
  res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, "Phrase") });
});
