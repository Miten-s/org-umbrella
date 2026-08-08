import { Router } from "express";
import * as controller from "../controllers/phrase.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreatePhraseDto, UpdatePhraseDto } from "../dtos/phrase.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "PHRASE";

router.post(
  "/",
  validateDto(CreatePhraseDto, "body"),
  auditMiddleware(ENTITY_NAME, false),
  controller.createPhrase
);

router.get("/", controller.getAllPhrases);

router.get(
  API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  controller.getPhraseById
);

router.put(
  API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  validateDto(UpdatePhraseDto, "body"),
  auditMiddleware(ENTITY_NAME, true),
  controller.updatePhrase
);

router.delete(
  API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  auditMiddleware(ENTITY_NAME, true),
  controller.deletePhrase
);

export default router;
