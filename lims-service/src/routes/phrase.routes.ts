import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreatePhraseDto, UpdatePhraseDto } from "../dtos/master-data.dto";

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

export default buildCrudRouter({
  service,
  entityName: phraseConfig.entityName,
  permissionEntity: phraseConfig.permissionEntity,
  createDto: CreatePhraseDto,
  updateDto: UpdatePhraseDto
});
