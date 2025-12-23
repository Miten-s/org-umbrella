import GxpServiceUser from "../models/gxp-service-users.model";

export const createUserRepo = async (data: any) => {
  const user = new GxpServiceUser(data);
  return await user.save();
};

export const findAllUsersRepo = async () => {
  //temporary fix as role module is not yet ready
  return await GxpServiceUser.find().lean();;
};

export const findUserByIdRepo = async (id: string) => {
  return await GxpServiceUser.findById(id).lean();
};

export const updateUserRepo = async (id: string, data: any) => {
  try {
  return await GxpServiceUser.findByIdAndUpdate(id, data, {
    new: true
  }).lean();
} catch (error) {
  throw error;
}
};

export const disableUserRepo = async (id: string) => {
  return await updateUserRepo(id, { status: "disabled" });
};

export const enableUserRepo = async (id: string, comments: any) => {
  return await updateUserRepo(id, { status: "enabled", modifiedBy: comments });
};
