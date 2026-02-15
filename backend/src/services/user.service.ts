import { Request } from "express";
import { IUser, User } from "../models/user.model";

const getUsers = async (user?: IUser) => {
  let filter = { fullName: { $nin: ["superadmin", user?.fullName] } };
  let populatation = {
    populate: [
      {
        path: "roles",
        select: ["name", "type", "permissions"]
      },
      {
        path: "department",
        select: ["departmentName"]
      },
      {
        path: "location",
        select: ["locationName"]
      },
      {
        path: "designation",
        select: ["designationName"]
      }
    ]
  };
  return await User.find(filter, null, populatation).exec();
};

const createUser = async (req: Request) => {
    const payload =
      typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
    const signature = req.file?.filename;
    payload["createdBy"] = req?.user?._id;

    if (signature) {
      payload["signature"] = signature;
    }
    return await User.create(payload);
};

const updateUser = async (req: Request) => {
  const payload =
    typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  const signature = req.file?.filename;
  if (signature) {
    payload["signature"] = signature;
  }
  return await User.updateOne({ _id: req.params.id }, { $set: payload });
};

const deleteUser = async (req: Request) => {
  return await User.updateOne(
    { _id: req.params.id },
    { $set: { deletedAt: new Date() } }
  );
};

const getUserDetail = async (id: string) => {
  return await User.findOne(
    { _id: id },
    { password: 0 },
    {
      populate: [
        {
          path: "roles",
          select: ["name", "type", "permissions"]
        },
        {
          path: "department",
          select: ["departmentName"]
        },
        {
          path: "location",
          select: ["locationName"]
        },
        {
          path: "designation",
          select: ["designationName"]
        }
      ]
    }
  ).exec();
};

  export default { getUsers, createUser, updateUser, deleteUser, getUserDetail };
