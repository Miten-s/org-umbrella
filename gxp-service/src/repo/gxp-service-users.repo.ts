import GxpServiceUser from "../models/gxp-service-users.model";

export const createUserRepo = async (data: any) => {
  const user = new GxpServiceUser(data);
  return await user.save();
};

export const findAllUsersRepo = async () => {
  return await GxpServiceUser.find().populate("roles", "name");
};

export const findUserByIdRepo = async (id: string) => {
  return await GxpServiceUser.findById(id).populate("roles", "name");
};

export const updateUserRepo = async (id: string, data: any) => {
  return await GxpServiceUser.findByIdAndUpdate(id, data, {
    new: true
  }).populate("roles", "name");
};

export const disableUserRepo = async (id: string) => {
  return await updateUserRepo(id, { status: "disabled" });
};

export const enableUserRepo = async (id: string, comments: any) => {
  return await updateUserRepo(id, { status: "enabled", modifiedBy: comments });
};
