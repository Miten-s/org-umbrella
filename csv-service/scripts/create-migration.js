#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "..", "src", "migrations");

const rawName = process.argv[2];
if (!rawName) {
  console.error("Usage: npm run db:migrate:create -- <migration-name>");
  process.exit(1);
}

const slug = rawName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug) {
  console.error(`"${rawName}" doesn't produce a valid migration name.`);
  process.exit(1);
}

const existing = fs
  .readdirSync(migrationsDir)
  .map((f) => f.match(/^(\d{3})-/))
  .filter(Boolean)
  .map((m) => parseInt(m[1], 10));

const nextNumber = (existing.length ? Math.max(...existing) : 0) + 1;
const number = String(nextNumber).padStart(3, "0");
const fileName = `${number}-${slug}.ts`;
const filePath = path.join(migrationsDir, fileName);

if (fs.existsSync(filePath)) {
  console.error(`${fileName} already exists.`);
  process.exit(1);
}

const template = `import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  // TODO: implement migration
};
`;

fs.writeFileSync(filePath, template);
console.log(`Created src/migrations/${fileName}`);
