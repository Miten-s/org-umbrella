import { Request } from "express";
import { Company } from "../models/company.model";

const createCompany = async (req: Request) => {
  const { name, description } = req.body;
  const logoPath = req.file?.path;
  if (!logoPath) throw new Error("Logo is required");

  const newCompany = new Company({
    name,
    logo: logoPath.split("uploads")[1],
    description
  });
  return await newCompany.save();
};

const getCompany = async () => {
  return await Company.findOne().exec();
};

export { createCompany, getCompany };
