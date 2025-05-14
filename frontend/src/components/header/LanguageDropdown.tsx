import React, { useState } from 'react';
// import { useCurrentUser } from 'hooks/use-current-user';
import { useTranslation } from 'react-i18next';
// import { useUpdateMeMutation } from 'redux/users.api';
import { useGlobalContext } from '@/context';
import { SupportedLanguages } from '@/types/common.types';
import { LanguageIcon } from '@/public/icons';
import { Dropdown } from '../ui/dropdown/Dropdown';
import { DropdownItem } from '../ui/dropdown/DropdownItem';
import { useCurrentUser } from '@/hooks/use-current-user';
import { updateUser } from '@/services/admin.service';

interface LanguageDropdownProps {
    onChange?: (lng: string) => void;
    languagesFromProps?: SupportedLanguages[];
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
    onChange,
    languagesFromProps,
}) => {
    const { t } = useTranslation();
    const currentUser = useCurrentUser();
    console.log('currentUser', currentUser);
    const { setCurrentLanguage } = useGlobalContext()
    const [isOpen, setIsOpen] = useState(false);

    function closeDropdown() {
        setIsOpen(false);
    }
    const changeLanguage = async (lng: string) => {
        try {
            setCurrentLanguage(lng);
            if (onChange) {
                onChange(lng);
            } else if (currentUser?._id) {
                await updateUser(currentUser._id, { currentLanguage: lng });
            }
        } catch (error) {
            console.error('Error updating language:', error);
        } finally {
            setIsOpen(false);
        }
    };


    const languageOptions = [
        { label: t('languages.english'), key: SupportedLanguages.en },
        { label: t('languages.arabic'), key: SupportedLanguages.ar },
        { label: t('languages.chinese'), key: SupportedLanguages.zh },
        { label: t('languages.german'), key: SupportedLanguages.de },
        { label: t('languages.spanish'), key: SupportedLanguages.es },
        { label: t('languages.french'), key: SupportedLanguages.fr },
        { label: t('languages.hebrew'), key: SupportedLanguages.he },
        { label: t('languages.italian'), key: SupportedLanguages.it },
        { label: t('languages.japanese'), key: SupportedLanguages.ja },
        { label: t('languages.korean'), key: SupportedLanguages.ko },
        { label: t('languages.dutch'), key: SupportedLanguages.nl },
        { label: t('languages.polish'), key: SupportedLanguages.pl },
        { label: t('languages.portuguese'), key: SupportedLanguages.pt },
    ];

    const filteredLanguages = languageOptions.filter((lang) =>
        !languagesFromProps || languagesFromProps.length === 0
            ? true
            : languagesFromProps.includes(lang.key)
    );

    //   if (!currentUser) return null;

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
                <span
                    className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full`}
                >
                    <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"></span>
                </span>
                <LanguageIcon fontSize={24} opacity={0.8} />
            </button>
            <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
            >
                <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
                    {/* Example notification items */}
                    <li>
                        <div className="p-2 font-semibold border-b border-gray-100">
                            {t('changeLanguage')}
                        </div>
                        {filteredLanguages.map((lang) => (
                            < DropdownItem
                                className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                                key={lang.key}
                                onItemClick={() => {
                                    console.log("Clicked:", lang.key);
                                    changeLanguage(lang.key);
                                }}
                            >
                                {lang.label}
                            </DropdownItem>
                        ))}
                    </li>
                </ul>

            </Dropdown>
        </div >
    );
};

export default LanguageDropdown;
