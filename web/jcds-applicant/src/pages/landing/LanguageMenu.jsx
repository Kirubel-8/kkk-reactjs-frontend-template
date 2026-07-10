import { memo } from "react";
import {
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { GlobeAltIcon } from "@heroicons/react/24/solid";

const LANGUAGE_OPTIONS = [
  {
    code: "en",
    label: "English",
    flag: "/cfms-customer/img/Flag_of_the_United_States_(Pantone).svg",
  },
  { code: "አማ", label: "አማርኛ", flag: "/cfms-customer/img/Flag_of_Ethiopia.svg" },
];

const LanguageMenu = memo(({ selectedLanguage, handleLanguageSelect, t }) => (
  <Menu>
    <MenuHandler>
      <IconButton
        variant="text"
        color="blue-gray"
        aria-label={t("landing.languageSelector")}
      >
        <GlobeAltIcon className="h-5 w-5 text-blue-gray-500" />
      </IconButton>
    </MenuHandler>
    <MenuList className="w-max border-0 bg-white rounded-lg shadow-md overflow-hidden">
      {LANGUAGE_OPTIONS.map((option) => (
        <MenuItem
          key={option.code}
          className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ${selectedLanguage === option.code ? "bg-gray-100" : ""}`}
          onClick={() => handleLanguageSelect(option.code)}
        >
          <img
            src={option.flag}
            alt={`${option.label} flag`}
            className="h-6 w-6 rounded-full object-cover"
          />
          <Typography
            variant="small"
            color="blue-gray"
            className="font-medium"
          >
            {option.label}
          </Typography>
        </MenuItem>
      ))}
    </MenuList>
  </Menu>
));

export default LanguageMenu;