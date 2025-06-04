import { useTranslation } from "react-i18next";
import UserInfoCard from "./UserInfoCard";
import UserAddressCard from "./UserAddressCard";
import UserMetaCard from "./UserMetaCard";

const ProfileInfo = () => {  
  const {t}= useTranslation()
  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard/>
          <UserInfoCard />
          <UserAddressCard /> 
        </div>
      </div>
    </>
  );
};

export default ProfileInfo;
