import Location from "../models/location.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateLocationDto, UpdateLocationDto } from "../dtos/master-data.dto";

/**
 * Storage Locations. Group-filtered like all lab data, and self-referencing:
 * `parentLocation` / `subLocations` give the Building → Room → Freezer tree.
 *
 * Column names are the client's payload names (`locationName`), so nothing has
 * to be translated in between.
 */
export const locationConfig: CrudConfig<Location> = {
  model: Location,
  entityName: "Storage Location",
  permissionEntity: "LOCATION",
  uniqueField: "locationId",
  businessId: { field: "locationId", prefix: "LOC" },
  searchFields: ["locationId", "locationName", "description"],
  defaultSortBy: "locationName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Location,
      as: "parentLocation",
      attributes: ["id", "locationId", "locationName", ["location_name", "name"]],
      where: { isDeleted: false },
      required: false
    },
    {
      // Without this filter a soft-deleted child kept showing on the parent's
      // "Sub locations" chip list — the include has no soft-delete predicate
      // of its own, unlike the top-level row.
      model: Location,
      as: "subLocations",
      attributes: ["id", "locationId", "locationName", ["location_name", "name"]],
      where: { isDeleted: false },
      required: false
    },
    {
      model: PhraseEntry,
      as: "locationType",
      attributes: ["id", "phraseEntryId", "name"],
      required: false
    }
  ],
  relationFields: {
    group: "groupId",
    parentLocation: "parentLocationId",
    locationType: "locationTypeId"
  }
};

const service = buildCrudService(locationConfig);

export default buildCrudRouter({
  service,
  entityName: locationConfig.entityName,
  permissionEntity: locationConfig.permissionEntity,
  createDto: CreateLocationDto,
  updateDto: UpdateLocationDto,
  model: Location,
  businessId: locationConfig.businessId
});
