import GxpServiceUser from "../models/gxp-service-users.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

export const createUserRepo = async (data: any) => {
  const user = new GxpServiceUser(data);
  return await user.save();
};


export const findAllUsersRepo = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const filter: any = {};
  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { "user.name": { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }
  const [data, totalCount] = await Promise.all([
    GxpServiceUser.find(filter).skip(skip).limit(limit).lean(),
    GxpServiceUser.countDocuments(filter).exec()
  ]);
  return {
    data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
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
