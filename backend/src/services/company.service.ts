import { Request } from "express";
import { Company } from "../models/company.model";

const updateCompany = async (req: Request) => {
  const { name, description } = req.body;
  const { id: _id } = req.params;
  const logoPath = req.file?.path;

  const company = await Company.findByPk(_id as string);
  if (!company) return null;

  return await company.update({
    name,
    logo: logoPath?.split("uploads")[1],
    description
  });
};

const getCompany = async () => {
  return await Company.findOne();
};

export { updateCompany, getCompany };
