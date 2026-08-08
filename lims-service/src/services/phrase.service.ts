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
