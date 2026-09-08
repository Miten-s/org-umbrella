import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export const useCurrentUser = () => {
  return useSelector((state: RootState) => state.user.currentUser);
};
