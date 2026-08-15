import Customer from "../models/customer.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import Project from "../models/project.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateCustomerDto, UpdateCustomerDto } from "../dtos/commercial.dto";

/**
 * Customers. `linkedProjects` is read-only — it is the Projects pointing back
 * here, so it is included but never written from this endpoint.
 */
export const customerConfig: CrudConfig<Customer> = {
  model: Customer,
  entityName: "Customer",
  permissionEntity: "CUSTOMER",
  uniqueField: "customerId",
  businessId: { field: "customerId", prefix: "CUST" },
  searchFields: ["customerId", "customerName", "email", "contactName"],
  defaultSortBy: "customerName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: PhraseEntry, as: "rating", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: Project, as: "linkedProjects", attributes: ["id", "projectId", "name"], required: false }
  ],
  relationFields: { group: "groupId", rating: "ratingId" }
};

const service = buildCrudService(customerConfig);

export default buildCrudRouter({
  service,
  entityName: customerConfig.entityName,
  permissionEntity: customerConfig.permissionEntity,
  createDto: CreateCustomerDto,
  updateDto: UpdateCustomerDto,
  model: Customer,
  businessId: customerConfig.businessId
});
