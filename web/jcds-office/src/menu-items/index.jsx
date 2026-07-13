import useCountryRegistration from './country_registration';
import useDashboard from './dashboard';
import usePages from './page';
import useCompliant from './compliant';
import useBaseData from './base_data';
import useDepartmentCommitteeMenu from './department_cmmitte_menu';
import useJudicialDirector from './judicial-director';
import useCourtOffice from './court-office';
import useLetterGenerationMenu from './letter_generation';

// ==============================|| MENU ITEMS ||============================== //
export default function useMenuItems() {
  const pages = usePages();
  const dashboard = useDashboard();

  const base_data = useBaseData();
  const country_registration = useCountryRegistration();

  const compliant = useCompliant();

  const department_committe = useDepartmentCommitteeMenu();
  const judicial_director = useJudicialDirector();
  const court_office = useCourtOffice();
  const { complaintGroup, disciplinaryGroup } = useLetterGenerationMenu();

  const menuItems = {
    items: [
      dashboard,
      pages,
      country_registration,
      base_data,
      compliant,
      department_committe,
      judicial_director,
      court_office,
      complaintGroup,
      disciplinaryGroup
    ]
  };
  return menuItems;
}
