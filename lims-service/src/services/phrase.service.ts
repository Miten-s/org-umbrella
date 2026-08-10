import { bulkSoftDelete, bulkDuplicate as duplicateBulk } from "../utils/bulk.util";
import * as auditService from "./audit.service";
import { Phrase } from "../models/phrase.model";
import * as repo from "../repo/phrase.repo";
import { AppError } from "../types/common.types";

export const createPhrase = async (phraseData: any, entriesData: any[]) => {
  const existing = await repo.getPhraseByNameRepo(phraseData.name);
  if (existing) {
    const error: AppError = new Error(`Phrase with name ${phraseData.name} already exists`);
    error.statusCode = 409;
    throw error;
  }
  return await repo.createPhraseRepo(phraseData, entriesData);
};

export const updatePhrase = async (id: string, phraseData: any, entriesData: any[]) => {
  const existing = await repo.getPhraseByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Phrase not found");
    error.statusCode = 404;
    throw error;
  }

  // Prevent user from modifying isSystem flag, and prevent system phrases from being fully overwritten in a way that breaks them
  if (existing.isSystem) {
    // Only allow appending entries or modifying descriptions. Core logic shouldn't allow renaming system phrases.
    phraseData.name = existing.name;
    phraseData.isSystem = true;
  }

  return await repo.updatePhraseRepo(id, phraseData, entriesData);
};

export const getPhraseById = async (id: string) => {
  const phrase = await repo.getPhraseByIdRepo(id);
  if (!phrase) {
    const error: AppError = new Error("Phrase not found");
    error.statusCode = 404;
    throw error;
  }
  return phrase;
};

export const getAllPhrases = async (page: number = 1, limit: number = 20, filters: any = {}) => {
  const skip = (page - 1) * limit;
  const { rows, count } = await repo.getAllPhrasesRepo(skip, limit, filters);
  return { phrases: rows, total: count };
};

export const deletePhrase = async (id: string, deletedBy: string) => {
  const existing = await repo.getPhraseByIdRepo(id);
  if (!existing) {
    const error: AppError = new Error("Phrase not found");
    error.statusCode = 404;
    throw error;
  }

  if (existing.isSystem) {
    const error: AppError = new Error("System phrases cannot be deleted");
    error.statusCode = 403;
    throw error;
  }

  await repo.deletePhraseRepo(id, deletedBy);
};

export const bulkDelete = async (ids: string[], changeReason?: string, userId: string = "system", userName: string = "system") => {
  return await bulkSoftDelete({ Model: Phrase, ids, entityName: "PHRASE", deletedBy: userId, deletedByName: userName, changeReason });
};

export const bulkDuplicate = async (ids: string[], userId: string = "system", userName: string = "system") => {
  return await duplicateBulk({ Model: Phrase, ids, labelField: "name", entityName: "PHRASE", createdBy: userId, createdByName: userName });
};

export const restore = async (id: string, changeReason?: string, userId: string = "system", userName: string = "system") => {
  const record = await repo.getPhraseByIdRepo(id);
  if (!record) {
    const error: any = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  await Phrase.update({ isDeleted: false }, { where: { id } as any });
  await auditService.createAuditLog({ entityName: "PHRASE", entityId: id, action: "RESTORE", oldValue: null, newValue: null, changeReason, performedBy: userId, performedByName: userName });
  return await repo.getPhraseByIdRepo(id);
};

export const getAuditLogs = async (id: string, page: number = 1, limit: number = 20) => {
  return await auditService.getAuditLogsForEntity("PHRASE", id, page, limit);
};
