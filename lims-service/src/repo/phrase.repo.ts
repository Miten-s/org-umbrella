import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import { sequelize } from "../configs/db.sequelize";
import { Transaction } from "sequelize";

export const createPhraseRepo = async (
  phraseData: any,
  entriesData: any[],
  transaction?: Transaction
) => {
  const execute = async (t: Transaction) => {
    const phrase = await Phrase.create(phraseData, { transaction: t });
    
    if (entriesData && entriesData.length > 0) {
      const mappedEntries = entriesData.map((entry) => ({
        ...entry,
        phraseId: phrase.id,
        isSystem: phraseData.isSystem || false
      }));
      await PhraseEntry.bulkCreate(mappedEntries, { transaction: t });
    }

    return phrase;
  };

  if (transaction) {
    return execute(transaction);
  }
  return sequelize.transaction(execute);
};

export const updatePhraseRepo = async (
  id: string,
  phraseData: any,
  entriesData: any[],
  transaction?: Transaction
) => {
  const execute = async (t: Transaction) => {
    await Phrase.update(phraseData, { where: { id }, transaction: t });

    if (entriesData) {
      // For simplicity in this implementation, we soft delete existing entries and recreate them.
      // In a more robust system, we would diff them.
      await PhraseEntry.update(
        { isDeleted: true },
        { where: { phraseId: id }, transaction: t }
      );

      const mappedEntries = entriesData.map((entry) => ({
        ...entry,
        phraseId: id,
        isSystem: phraseData.isSystem || false,
        isDeleted: false
      }));
      await PhraseEntry.bulkCreate(mappedEntries, { transaction: t });
    }

    return getPhraseByIdRepo(id, t);
  };

  if (transaction) {
    return execute(transaction);
  }
  return sequelize.transaction(execute);
};

export const getPhraseByIdRepo = async (id: string, transaction?: Transaction) => {
  return await Phrase.findOne({
    where: { id, isDeleted: false },
    include: [
      {
        model: PhraseEntry,
        as: "entries",
        where: { isDeleted: false },
        required: false
      }
    ],
    order: [[{ model: PhraseEntry, as: "entries" }, "sortOrder", "ASC"]],
    transaction
  });
};

export const getPhraseByNameRepo = async (name: string, transaction?: Transaction) => {
  return await Phrase.findOne({
    where: { name, isDeleted: false },
    include: [
      {
        model: PhraseEntry,
        as: "entries",
        where: { isDeleted: false },
        required: false
      }
    ],
    order: [[{ model: PhraseEntry, as: "entries" }, "sortOrder", "ASC"]],
    transaction
  });
};

export const getAllPhrasesRepo = async (skip: number, limit: number, filters: any = {}) => {
  const where: any = { isDeleted: false, ...filters };
  
  return await Phrase.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["name", "ASC"]],
    include: [
      {
        model: PhraseEntry,
        as: "entries",
        where: { isDeleted: false },
        required: false
      }
    ]
  });
};

export const deletePhraseRepo = async (
  id: string,
  deletedBy: string,
  transaction?: Transaction
) => {
  const execute = async (t: Transaction) => {
    await Phrase.update(
      { isDeleted: true, deletedBy, deletedAt: new Date() },
      { where: { id }, transaction: t }
    );
    await PhraseEntry.update(
      { isDeleted: true },
      { where: { phraseId: id }, transaction: t }
    );
  };

  if (transaction) {
    return execute(transaction);
  }
  return sequelize.transaction(execute);
};
