import useCountryRegistration from './country_registration';
import useDashboard from './dashboard';
import usePages from './page';
import useCompliant from './compliant';
import useBaseData from './base_data';
import useDisciplineRequest from './discipline_request';
import useFileOrganizerExpert from './file_organizer_expert';
import useDepartmentCommitteeMenu from './department_cmmitte_menu';
import useCommitteeDecidedMenu from './council_decision';
import useJudicialDirector from './judicial-director';
import useCourtOffice from './court-office';
import useLetterGenerationMenu from './letter_generation';
import useFederalOfficeMenu from './federal_office';

// ==============================|| MENU ITEMS ||============================== //
export default function useMenuItems() {
  const pages = usePages();
  const dashboard = useDashboard();

  const base_data = useBaseData();
  const country_registration = useCountryRegistration();

  const compliant = useCompliant();

  const discipline_request = useDisciplineRequest();
  const file_organizer_expert = useFileOrganizerExpert();
  const department_committe = useDepartmentCommitteeMenu();
  const council_decision = useCommitteeDecidedMenu();
  const judicial_director = useJudicialDirector();
  const court_office = useCourtOffice();
  const { complaintGroup, disciplinaryGroup } = useLetterGenerationMenu();
  const federal_office = useFederalOfficeMenu();

  const menuItems = {
    items: [
      dashboard,
      pages,
      country_registration,
      base_data,
      compliant,
      discipline_request,
      file_organizer_expert,
      department_committe,
      council_decision,
      judicial_director,
      court_office,
      complaintGroup,
      disciplinaryGroup,
      federal_office
    ]
  };
  return menuItems;
}
