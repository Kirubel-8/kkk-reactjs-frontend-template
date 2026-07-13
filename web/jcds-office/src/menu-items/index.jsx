import useCountryRegistration from './country_registration';
import useDashboard from './dashboard';
import usePages from './page';
import useBaseData from './base_data';

// ==============================|| MENU ITEMS ||============================== //
export default function useMenuItems() {
  const pages = usePages();
  const dashboard = useDashboard();

  const base_data = useBaseData();
  const country_registration = useCountryRegistration();
  const menuItems = {
    items: [
      dashboard,
      pages,
      country_registration,
      base_data,
    ]
  };
  return menuItems;
}
