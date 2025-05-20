import { useTranslation } from "react-i18next";

const Designations = () => {  
  const {t}= useTranslation()
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">{t('welcomeTitle')}</h1>
        <p className="mt-4 text-lg">
          {t('welcomeSubtitle')}
        </p>
      </div>
    </>
  );
};

export default Designations;
