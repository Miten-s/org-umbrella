import { Request } from "express";
import { Company } from "../models/company.model";

const updateCompany = async (req: Request) => {
  const { name, description } = req.body;
  const { id: _id } = req.params;
  const logoPath = req.file?.path;

  return await Company.findOneAndUpdate(
    { _id },
    { name, logo: logoPath?.split("uploads")[1], description }
  ).exec();
};

const getCompany = async () => {
  return await Company.findOne().exec();
};

export { updateCompany, getCompany };
