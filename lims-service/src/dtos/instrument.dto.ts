import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsDateString, IsArray } from "class-validator";

// Instrument DTOs
export class CreateInstrumentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsUUID()
  @IsOptional()
  statusPhraseId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateInstrumentDto extends CreateInstrumentDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

// Instrument Part DTOs
export class CreateInstrumentPartDto {
  @IsUUID()
  @IsNotEmpty()
  instrumentId!: string;

  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsString()
  @IsOptional()
  partId?: string;

  @IsDateString()
  @IsOptional()
  installationDate?: string;

  @IsInt()
  @IsOptional()
  expectedLifetimeDays?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateInstrumentPartDto {
  @IsString()
  @IsOptional()
  partName?: string;

  @IsString()
  @IsOptional()
  partId?: string;

  @IsDateString()
  @IsOptional()
  installationDate?: string;

  @IsInt()
  @IsOptional()
  expectedLifetimeDays?: number;
  @IsString()
  @IsOptional()
  changeReason?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

// Calibration Schedule DTOs
export class CreateCalibrationScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  instrumentId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @IsNotEmpty()
  frequencyDays!: number;

  @IsDateString()
  @IsNotEmpty()
  nextDueDate!: string;
}

export class UpdateCalibrationScheduleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @IsOptional()
  frequencyDays?: number;

  @IsDateString()
  @IsOptional()
  nextDueDate?: string;
  @IsString()
  @IsOptional()
  changeReason?: string;
}

// Calibration DTOs
export class CreateCalibrationDto {
  @IsUUID()
  @IsOptional()
  scheduleId?: string;

  @IsUUID()
  @IsNotEmpty()
  instrumentId!: string;

  @IsUUID()
  @IsOptional()
  performedBy?: string;

  @IsDateString()
  @IsNotEmpty()
  performedAt!: string;

  @IsUUID()
  @IsNotEmpty()
  resultPhraseId!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  calibrationSchedules?: any[];

}

export class UpdateCalibrationDto {
  @IsUUID()
  @IsOptional()
  performedBy?: string;

  @IsDateString()
  @IsOptional()
  performedAt?: string;

  @IsUUID()
  @IsOptional()
  resultPhraseId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
  @IsString()
  @IsOptional()
  changeReason?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

// Inspection Plan DTOs
export class CreateInspectionPlanDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  version?: number;

  @IsArray()
  @IsOptional()
  inspectionPersonnel?: any[];

}

export class UpdateInspectionPlanDto extends CreateInspectionPlanDto {
  @IsString()
  @IsOptional()
  changeReason?: string;
}

// Inspection Personnel DTOs
export class CreateInspectionPersonnelDto {
  @IsUUID()
  @IsNotEmpty()
  planId!: string;

  @IsInt()
  @IsNotEmpty()
  stepOrder!: number;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  stepDescription?: string;
}

export class UpdateInspectionPersonnelDto {
  @IsInt()
  @IsOptional()
  stepOrder?: number;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  stepDescription?: string;
  @IsString()
  @IsOptional()
  changeReason?: string;
}
