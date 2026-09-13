import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // 1. csv_applications
  await queryInterface.createTable("csv_applications", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    app_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    gxp_classification: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "GXP"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 2. csv_projects
  await queryInterface.createTable("csv_projects", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    app_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_applications", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    gxp_change_control_id: { type: DataTypes.STRING(100), allowNull: true },
    project_title: { type: DataTypes.STRING(255), allowNull: false },
    current_phase: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "INTAKE"
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 3. csv_change_controls
  await queryInterface.createTable("csv_change_controls", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    change_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "OPEN"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 4. csv_user_requirements
  await queryInterface.createTable("csv_user_requirements", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    urs_code: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    gxp_flag: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 5. csv_validation_plans
  await queryInterface.createTable("csv_validation_plans", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    deliverables: { type: DataTypes.JSONB, allowNull: false },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 6. csv_functional_specs
  await queryInterface.createTable("csv_functional_specs", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    urs_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_user_requirements", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    fs_code: { type: DataTypes.STRING(50), allowNull: false },
    flow_details: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 7. csv_config_specs
  await queryInterface.createTable("csv_config_specs", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fs_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_functional_specs", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    config_code: { type: DataTypes.STRING(50), allowNull: false },
    parameters: { type: DataTypes.JSONB, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 8. csv_functional_risks
  await queryInterface.createTable("csv_functional_risks", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fs_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_functional_specs", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    hazard_mode: { type: DataTypes.STRING(255), allowNull: false },
    severity: { type: DataTypes.STRING(50), allowNull: false },
    probability: { type: DataTypes.STRING(50), allowNull: false },
    residual_risk: { type: DataTypes.STRING(50), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 9. csv_test_protocols
  await queryInterface.createTable("csv_test_protocols", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    protocol_type: { type: DataTypes.STRING(50), allowNull: false },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 10. csv_sop_references
  await queryInterface.createTable("csv_sop_references", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    sop_code: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    effective_version: { type: DataTypes.STRING(50), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 11. csv_test_cases
  await queryInterface.createTable("csv_test_cases", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    protocol_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_test_protocols", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    tc_code: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 12. csv_test_steps
  await queryInterface.createTable("csv_test_steps", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    test_case_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_test_cases", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    step_num: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.TEXT, allowNull: false },
    expected_result: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 13. csv_test_executions
  await queryInterface.createTable("csv_test_executions", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    step_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_test_steps", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    actual_result: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "NOT_RUN"
    },
    executed_by: { type: DataTypes.UUID, allowNull: false },
    executed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 14. csv_evidences
  await queryInterface.createTable("csv_evidences", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    execution_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_test_executions", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    file_path: { type: DataTypes.STRING(500), allowNull: false },
    sha256_hash: { type: DataTypes.STRING(64), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 15. csv_discrepancies
  await queryInterface.createTable("csv_discrepancies", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    execution_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_test_executions", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    disc_code: { type: DataTypes.STRING(50), allowNull: false },
    bug_severity: { type: DataTypes.STRING(50), allowNull: false },
    root_cause: { type: DataTypes.TEXT, allowNull: true },
    fix_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "OPEN"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 16. csv_rtm_matrix
  await queryInterface.createTable("csv_rtm_matrix", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    urs_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_user_requirements", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    fs_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "csv_functional_specs", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    },
    risk_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "csv_functional_risks", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    },
    test_case_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "csv_test_cases", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    },
    coverage_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "UNCOVERED"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 17. csv_vsr_reports
  await queryInterface.createTable("csv_vsr_reports", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    summary_text: { type: DataTypes.TEXT, allowNull: false },
    release_recommendation: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT"
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 18. csv_signatures
  await queryInterface.createTable("csv_signatures", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.UUID, allowNull: false },
    signer_id: { type: DataTypes.UUID, allowNull: false },
    signature_meaning: { type: DataTypes.STRING(255), allowNull: false },
    signed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    checksum_hash: { type: DataTypes.STRING(64), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 19. csv_audit_logs
  await queryInterface.createTable("csv_audit_logs", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entity_name: { type: DataTypes.STRING(100), allowNull: false },
    entity_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    old_data: { type: DataTypes.JSONB, allowNull: true },
    new_data: { type: DataTypes.JSONB, allowNull: true },
    user_id: { type: DataTypes.UUID, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false }
  });

  // 20. csv_periodic_reviews
  await queryInterface.createTable("csv_periodic_reviews", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    app_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_applications", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "csv_projects", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    scheduled_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "SCHEDULED"
    },
    reviewer_id: { type: DataTypes.UUID, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });
};
