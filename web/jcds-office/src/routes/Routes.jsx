import Loadable from 'components/Loadable';
import Dashboard from 'layout/Dashboard';
import MinimalLayout from 'layout/MinimalLayout';
import { lazy, useEffect } from 'react';
import ProtectedRoute from './ProtectedRoute ';

const User = Loadable(lazy(() => import('pages/component-overview/User/user')));
const AddUser = Loadable(lazy(() => import('pages/component-overview/User/AddUser')));
const EditUser = Loadable(lazy(() => import('pages/component-overview/User/editUser')));
const Department = Loadable(lazy(() => import('pages/component-overview/Department/department_index')));
const AddDepartment = Loadable(lazy(() => import('pages/component-overview/Department/add-department')));
const EditDepartment = Loadable(lazy(() => import('pages/component-overview/Department/edit-department')));
const Applicant = Loadable(lazy(() => import('pages/component-overview/User/applicant')));

const Role = Loadable(lazy(() => import('pages/component-overview/Role/role_index')));
const RoleAdd = Loadable(lazy(() => import('pages/component-overview/Role/add_role')));
const RoleEdit = Loadable(lazy(() => import('pages/component-overview/Role/edit_role')));

const Region = Loadable(lazy(() => import('pages/component-overview/Region/region_index')));
const RegionAdd = Loadable(lazy(() => import('pages/component-overview/Region/region_add')));
const RegionEdit = Loadable(lazy(() => import('pages/component-overview/Region/edit_region')));

const Ajenda = Loadable(lazy(() => import('pages/component-overview/Ajenda/ajenda-index')));
const AjendaAdd = Loadable(lazy(() => import('pages/component-overview/Ajenda/ajenda-add')));
const AjendaEdit = Loadable(lazy(() => import('pages/component-overview/Ajenda/ajenda-edit')));

const AjendaStatus = Loadable(lazy(() => import('pages/component-overview/Ajenda-With-Status/status-index')));
const AjendaStatusAdd = Loadable(lazy(() => import('pages/component-overview/Ajenda-With-Status/status-add')));
const AjendaStatusEdit = Loadable(lazy(() => import('pages/component-overview/Ajenda-With-Status/status-edit')));

const City = Loadable(lazy(() => import('pages/component-overview/City/city_index')));
const CityAdd = Loadable(lazy(() => import('pages/component-overview/City/city_add')));
const CityEdit = Loadable(lazy(() => import('pages/component-overview/City/edit_city')));

const Zone = Loadable(lazy(() => import('pages/component-overview/Zone/zone_index')));
const ZoneAdd = Loadable(lazy(() => import('pages/component-overview/Zone/zone_add')));
const ZoneEdit = Loadable(lazy(() => import('pages/component-overview/Zone/edit_zone')));

const SubCity = Loadable(lazy(() => import('pages/component-overview/Sub-City/sub_city_index')));
const SubCityAdd = Loadable(lazy(() => import('pages/component-overview/Sub-City/sub_city_add')));
const SubCityEdit = Loadable(lazy(() => import('pages/component-overview/Sub-City/edit_sub_city')));

const Woreda = Loadable(lazy(() => import('pages/component-overview/woreda/woreda_index')));
const WoredaAdd = Loadable(lazy(() => import('pages/component-overview/woreda/woreda_add')));
const EditWoreda = Loadable(lazy(() => import('pages/component-overview/woreda/woreda_edit')));

const Team = Loadable(lazy(() => import('pages/component-overview/Team/team_index')));
const TeamAdd = Loadable(lazy(() => import('pages/component-overview/Team/team_add')));
const TeamEdit = Loadable(lazy(() => import('pages/component-overview/Team/team_edit')));

const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/index')));
const AuthLogin = Loadable(lazy(() => import('pages/authentication/login')));
const AuthForgetPasswordRequest = Loadable(lazy(() => import('pages/authentication/forgetPasswordRequest')));
const AuthForgetPassword = Loadable(lazy(() => import('pages/authentication/forgetPassword')));
const AuthRegister = Loadable(lazy(() => import('pages/authentication/register')));

const Setting = Loadable(lazy(() => import('pages/component-overview/Base Data/setting')));
const UserManagement = Loadable(lazy(() => import('pages/component-overview/UserManagement/index')));

const CaseType = Loadable(lazy(() => import('pages/component-overview/Case Type/case_type')));
const CaseTypeEdit = Loadable(lazy(() => import('pages/component-overview/Case Type/case_type_update')));
const CaseTypeAdd = Loadable(lazy(() => import('pages/component-overview/Case Type/case_type_add')));

const CourtCategory = Loadable(lazy(() => import('pages/component-overview/CourtCategory/court_category_index')));
const CourtCategoryAdd = Loadable(lazy(() => import('pages/component-overview/CourtCategory/add_court_category')));
const CourtCategoryEdit = Loadable(lazy(() => import('pages/component-overview/CourtCategory/edit_court_category')));

const CourtOffice = Loadable(lazy(() => import('pages/component-overview/CourtCategory/court_office_index')));
const CourtOfficeAdd = Loadable(lazy(() => import('pages/component-overview/CourtCategory/add_court_office')));
const CourtOfficeEdit = Loadable(lazy(() => import('pages/component-overview/CourtCategory/edit_court_office')));

//dear team add ur routes under here
const GetDisciplineRequests = Loadable(lazy(() => import('pages/component-overview/DisciplinaryCase/get-disciplinary-case')));
const DisciplineRequests = Loadable(lazy(() => import('pages/component-overview/DisciplinaryCase/disciplinary-request-index')));
const DisciplineDetail = Loadable(lazy(() => import('pages/component-overview/DisciplinaryCase/disciplinary-detail')));
const DisciplineExpiryRequests = Loadable(lazy(() => import('pages/component-overview/DisciplinaryCase/expiring-displinary-index')));

const GetFileOrganizerFiles = Loadable(lazy(() => import('pages/component-overview/FileOrganizerExpert/get-file-organizer-files')));
const AssignedComplaints = Loadable(lazy(() => import('pages/component-overview/FileOrganizerExpert/assigned-complaint')));
const FileOrganizerDisciplinaryDetail = Loadable(lazy(() => import('pages/component-overview/FileOrganizerExpert/disciplinary-detail')));

const GetDirectorRequest = Loadable(lazy(() => import('pages/component-overview/JudiciaryDirector/get-director-request')));
const JudiciaryDirectorCases = Loadable(lazy(() => import('pages/component-overview/JudiciaryDirector/assigned-cases')));
const DirectorCaseDetail = Loadable(lazy(() => import('pages/component-overview/JudiciaryDirector/director-case-detail')));

// Court Office Pages
const DocumentRequests = Loadable(lazy(() => import('pages/component-overview/CourtOffice/document-requests')));
const UploadDocuments = Loadable(lazy(() => import('pages/component-overview/CourtOffice/upload-documents')));
const CourtDetail = Loadable(lazy(() => import('pages/component-overview/CourtOffice/court-detail')));

const Compliant = Loadable(lazy(() => import('pages/component-overview/compliant/compliant_index')));
const GetCompliant = Loadable(lazy(() => import('pages/component-overview/compliant/get_compliant')));
const DetailCompliant = Loadable(lazy(() => import('pages/component-overview/compliant/compliant_detail')));
const CaseReviewIndex = Loadable(lazy(() => import('pages/component-overview/complaintCaseReview/case_review_index')));
const CaseReviewDetail = Loadable(lazy(() => import('pages/component-overview/complaintCaseReview/case_review_detail')));
const CaseDecisionDetail = Loadable(lazy(() => import('pages/component-overview/complaintCaseDecision/case_decision_detail')));
const CaseDecisionIndex = Loadable(lazy(() => import('pages/component-overview/complaintCaseDecision/case_decision_index')));
const ComplaintExpiryRequests = Loadable(lazy(() => import('pages/component-overview/compliant/expiring-complaint-index')));
const ComplaintLetterGenerationIndex = Loadable(lazy(() => import('pages/component-overview/complaintLetterGeneration/complaint_letter_generation_index')));
const ComplaintLetterGenerationDetail = Loadable(lazy(() => import('pages/component-overview/complaintLetterGeneration/complaint_letter_generation')));
const FederalOfficeIndex = Loadable(lazy(() => import('pages/component-overview/compliant/federal_office_index')));
const ComplaintCaseIndex = Loadable(lazy(() => import('pages/component-overview/compliant/complaint_case_index')));

const DisciplinaryLetterGenerationIndex = Loadable(lazy(() => import('pages/component-overview/DisciplinaryCase/disciplinary_letter_generation_index')));
const DisciplinaryLetterGenerationDetail = Loadable(lazy(() => import('pages/component-overview/DisciplinaryCase/disciplinary_letter_generation')));

//here added for assigned case to department

const AssignedDepartmentCases = Loadable(lazy(() => import('pages/component-overview/AssignedCommitte/assigned_department_cases')));
const GetAssignedCases = Loadable(lazy(() => import('pages/component-overview/AssignedCommitte/get_assigned_cases')));
const DepartmentAssignedCaseDetail = Loadable(
  lazy(() => import('pages/component-overview/AssignedCommitte/department_assigned_case_detail'))
);

//here i added the committe decided route
// CommitteeDecided pages
const CommitteeDecidedIndex = Loadable(lazy(() => import('pages/component-overview/committeDecision/CommitteeDecidedCases')));
import CommitteeDecidedDetail from 'pages/component-overview/committeDecision/CommitteDecisionDetails';
const ErrorPage = Loadable(lazy(() => import('pages/Errorpage/erroepage')));

const TitleUpdater = ({ title }) => {
  useEffect(() => {
    document.title = title ? `JCDMS - ${title}` : 'JCDMS';
  }, [title]);
  return null;
};

const router = [
  {
    path: '/',
    element: <Dashboard />,
    children: [
      {
        path: '',
        element: (
          <>
            {' '}
            <TitleUpdater title="Dashboard" /> <DashboardDefault />{' '}
          </>
        )
      },

      {
        path: '/',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'dashboard', action: 'read' }}>
            <TitleUpdater title="Dashboard" />
            <DashboardDefault />
          </ProtectedRoute>
        )
      },
      {
        path: 'user-management',
        element: (
          <>
            <ProtectedRoute requiredPermission={{ resource: 'profile', action: 'view' }}>
              <TitleUpdater title="User Management" />
              <UserManagement />
            </ProtectedRoute>
          </>
        )
      },
      {
        path: 'user',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'user', action: 'read' }}>
            <TitleUpdater title="Users" />
            <User />
          </ProtectedRoute>
        )
      },
      {
        path: 'applicant',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'user', action: 'read' }}>
            <TitleUpdater title="Applicants" />
            <Applicant />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-user',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'user', action: 'create' }}>
            <TitleUpdater title="Add User" />
            <AddUser />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-user',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'user', action: 'update' }}>
            <TitleUpdater title="Edit User" />
            <EditUser />
          </ProtectedRoute>
        )
      },
      {
        path: 'department',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'department', action: 'read' }}>
            <TitleUpdater title="Departments" />
            <Department />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-department',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'department', action: 'create' }}>
            <TitleUpdater title="Add Department" />
            <AddDepartment />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-department',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'department', action: 'update' }}>
            <TitleUpdater title="Edit Department" />
            <EditDepartment />
          </ProtectedRoute>
        )
      },
      {
        path: 'role',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'role', action: 'read' }}>
            <TitleUpdater title="Roles" />
            <Role />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-role',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'role', action: 'create' }}>
            <TitleUpdater title="Add Role" />
            <RoleAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-role',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'role', action: 'update' }}>
            <TitleUpdater title="Edit Role" />
            <RoleEdit />
          </ProtectedRoute>
        )
      },
      {
        path: 'region',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'read' }}>
            <TitleUpdater title="Regions" />
            <Region />
          </ProtectedRoute>
        )
      },

      {
        path: 'add-region',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'create' }}>
            <TitleUpdater title="Add Region" />
            <RegionAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-region',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'update' }}>
            <TitleUpdater title="Edit Region" />
            <RegionEdit />
          </ProtectedRoute>
        )
      },

      {
        path: 'ajenda',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'read' }}>
            <TitleUpdater title="Ajendas" />
            <Ajenda />
          </ProtectedRoute>
        )
      },

      {
        path: 'add-ajenda',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'create' }}>
            <TitleUpdater title="Add Ajenda" />
            <AjendaAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-ajenda',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'update' }}>
            <TitleUpdater title="Edit Ajenda" />
            <AjendaEdit />
          </ProtectedRoute>
        )
      },

      {
        path: 'ajenda-status',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'read' }}>
            <TitleUpdater title="Ajendas Status" />
            <AjendaStatus />
          </ProtectedRoute>
        )
      },

      {
        path: 'add-ajenda-status',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'create' }}>
            <TitleUpdater title="Add Ajenda Status" />
            <AjendaStatusAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-ajenda-status',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'update' }}>
            <TitleUpdater title="Edit Ajenda Status" />
            <AjendaStatusEdit />
          </ProtectedRoute>
        )
      },

      {
        path: 'city',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'read' }}>
            <TitleUpdater title="City Administration" />
            <City />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-city-administration',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'create' }}>
            <TitleUpdater title="Add City Administration" />
            <CityAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-city-administration',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'update' }}>
            <TitleUpdater title="Edit City Administration" />
            <CityEdit />
          </ProtectedRoute>
        )
      },
      {
        path: 'zone',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'read' }}>
            <TitleUpdater title="Zones" />
            <Zone />
          </ProtectedRoute>
        )
      },
      {
        path: 'zone-add',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'create' }}>
            <TitleUpdater title="Add Zone" />
            <ZoneAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-zone',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'update' }}>
            <TitleUpdater title="Edit Zone" />
            <ZoneEdit />
          </ProtectedRoute>
        )
      },
      {
        path: 'sub-city',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'read' }}>
            <TitleUpdater title="Sub City" />
            <SubCity />
          </ProtectedRoute>
        )
      },
      {
        path: 'sub-city-add',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'create' }}>
            <TitleUpdater title="Add Sub City" />
            <SubCityAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-sub-city',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'update' }}>
            <TitleUpdater title="Edit Sub City" />
            <SubCityEdit />
          </ProtectedRoute>
        )
      },
      {
        path: 'woreda',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'woreda', action: 'read' }}>
            <TitleUpdater title="Woredas" />
            <Woreda />
          </ProtectedRoute>
        )
      },
      {
        path: 'woreda-add',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'woreda', action: 'create' }}>
            <TitleUpdater title="Add Woreda" />
            <WoredaAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-woreda',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'woreda', action: 'update' }}>
            <TitleUpdater title="Edit Woreda" />
            <EditWoreda />
          </ProtectedRoute>
        )
      },
      {
        path: 'team',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'team', action: 'read' }}>
            <TitleUpdater title="Teams" />
            <Team />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-team',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'team', action: 'create' }}>
            <TitleUpdater title="Add Team" />
            <TeamAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-team',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'team', action: 'update' }}>
            <TitleUpdater title="Edit Team" />
            <TeamEdit />
          </ProtectedRoute>
        )
      },

      {
        path: 'setting',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'read' }}>
            <TitleUpdater title="Settings" />
            <Setting />
          </ProtectedRoute>
        )
      },

      {
        path: 'case_type',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'read' }}>
            <TitleUpdater title="Case Type" />
            <CaseType />
          </ProtectedRoute>
        )
      },
      {
        path: 'case_type_update',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'update' }}>
            <CaseTypeEdit />
          </ProtectedRoute>
        )
      },
      {
        path: 'case_type_create',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'create' }}>
            <CaseTypeAdd />
          </ProtectedRoute>
        )
      },

      //court category
      {
        path: 'court-category',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'read' }}>
            <TitleUpdater title="Court Category" />
            <CourtCategory />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-court-category',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'create' }}>
            <TitleUpdater title="Add Court Category" />
            <CourtCategoryAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-court-category',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'region', action: 'update' }}>
            <TitleUpdater title="Edit Court Category" />
            <CourtCategoryEdit />
          </ProtectedRoute>
        )
      },

      {
        path: 'court-office',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'read' }}>
            <TitleUpdater title="Court Office" />
            <CourtOffice />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-court-office',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'create' }}>
            <TitleUpdater title="Add Court Office" />
            <CourtOfficeAdd />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-court-office',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'zone', action: 'update' }}>
            <TitleUpdater title="Edit Court Office" />
            <CourtOfficeEdit />
          </ProtectedRoute>
        )
      },

      //dear team add ur routes under here
      {
        path: 'get_disciplinary_requests',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'disciplineRequest', action: 'read' }}>
            <TitleUpdater title="Get New Discipline Request" />
            <GetDisciplineRequests />
          </ProtectedRoute>
        )
      },

      {
        path: 'disciplinary_requests',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'disciplineRequest', action: 'read' }}>
            <TitleUpdater title="New Discipline Request" />
            <DisciplineRequests />
          </ProtectedRoute>
        )
      },

      {
        path: 'disciplinary_detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'disciplineRequest', action: 'read' }}>
            <TitleUpdater title="Disciplinary Detail" />
            <DisciplineDetail />
          </ProtectedRoute>
        )
      },

      {
        path: 'disciplinary_requests_expiry',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'disciplineRequest', action: 'read' }}>
            <TitleUpdater title="To Be Expiry Discipline Request" />
            <DisciplineExpiryRequests />
          </ProtectedRoute>
        )
      },

      {
        path: 'compliant',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaint', action: 'read' }}>
            <TitleUpdater title="Compliant" />
            <Compliant />
          </ProtectedRoute>
        )
      },
      {
        path: 'complaint_case',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaint', action: 'can_get' }}>
            <TitleUpdater title="Complaint Case Reports" />
            <ComplaintCaseIndex />
          </ProtectedRoute>
        )
      },
      {
        path: 'get_compliant',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaint', action: 'can_get' }}>
            <TitleUpdater title="Get Compliant" />
            <GetCompliant />
          </ProtectedRoute>
        )
      },

      {
        path: 'complaint_requests_expiry',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaint', action: 'can_get' }}>
            <TitleUpdater title="To Be Expiry Complaint Request" />
            <ComplaintExpiryRequests />
          </ProtectedRoute>
        )
      },
      {
        path: 'detail_compliant',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaint', action: 'read' }}>
            <TitleUpdater title="Detail Compliant" />
            <DetailCompliant />
          </ProtectedRoute>
        )
      },

      {
        path: 'get_file_organizer_files',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'JudiciaryInvestigationDirectorate', action: 'read' }}>
            <TitleUpdater title="Get File Organizer Files" />
            <GetFileOrganizerFiles />
          </ProtectedRoute>
        )
      },

      {
        path: 'assigned_complaints',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'JudiciaryInvestigationDirectorate', action: 'read' }}>
            <TitleUpdater title="Assigned Complaints" />
            <AssignedComplaints />
          </ProtectedRoute>
        )
      },
      // CommitteeDecided Routes
      {
        path: 'committee_decided',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'CommitteeDecided', action: 'read' }}>
            <TitleUpdater title="Committee Decisions" />
            <CommitteeDecidedIndex />
          </ProtectedRoute>
        )
      },
      {
        path: 'council_review_detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'CommitteeDecided', action: 'read' }}>
            <TitleUpdater title="Committee Decision Detail" />
            <CommitteeDecidedDetail />
          </ProtectedRoute>
        )
      },

      // {
      //   path: 'detail_compliant',
      //   element: (
      //     <ProtectedRoute requiredPermission={{ resource: 'compliant', action: 'read' }}>
      //       <TitleUpdater title="Detail Compliant" />
      //       <DetailCompliant />
      //     </ProtectedRoute>
      //   )
      // },
      // {
      //   path: 'get_file_organizer_files',
      //   element: (
      //     <ProtectedRoute requiredPermission={{ resource: 'fileOrganizerExpert', action: 'read' }}>
      //       <TitleUpdater title="Get File Organizer Files" />
      //       <GetFileOrganizerFiles />
      //     </ProtectedRoute>
      //   )
      // },

      //here route added for committe assigned
      {
        path: 'assigned_complaints_to_committe',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'JudiciaryInvestigationDirectorate', action: 'read' }}>
            <TitleUpdater title="Department Case" />
            {/* <CommitteAssignedToCase /> */}
            <TitleUpdater title="Assigned Complaints" />
            <AssignedComplaints />
          </ProtectedRoute>
        )
      },

      {
        path: 'file-organizer-detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'JudiciaryInvestigationDirectorate', action: 'read' }}>
            <TitleUpdater title="Disciplinary Detail" />
            <FileOrganizerDisciplinaryDetail />
          </ProtectedRoute>
        )
      },

      // Judiciary Director Routes
      {
        path: 'get-director-request',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'JudiciaryDirectorate', action: 'reviewDisciplinaryComplaint' }}>
            <TitleUpdater title="Get Director Request" />
            <GetDirectorRequest />
          </ProtectedRoute>
        )
      },
      {
        path: 'judiciary-director-cases',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'JudiciaryDirectorate', action: 'reviewDisciplinaryComplaint' }}>
            <TitleUpdater title="Judiciary Director Cases" />
            <JudiciaryDirectorCases />
          </ProtectedRoute>
        )
      },
      {
        path: 'director-case-detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'JudiciaryDirectorate', action: 'reviewDisciplinaryComplaint' }}>
            <TitleUpdater title="Director Case Detail" />
            <DirectorCaseDetail />
          </ProtectedRoute>
        )
      },

      // Court Office Routes
      {
        path: 'court-office/requests',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'CourtOffice', action: 'viewDocumentRequests' }}>
            <TitleUpdater title="Document Requests" />
            <DocumentRequests />
          </ProtectedRoute>
        )
      },
      {
        path: 'court-office/upload',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'CourtOffice', action: 'uploadDocuments' }}>
            <TitleUpdater title="Upload Documents" />
            <UploadDocuments />
          </ProtectedRoute>
        )
      },
      {
        path: 'court-office/detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'CourtOffice', action: 'viewDocumentRequests' }}>
            <TitleUpdater title="Court Detail" />
            <CourtDetail />
          </ProtectedRoute>
        )
      },
      //here route added for department head and members
      {
        path: 'get_assigned_cases',
        element: (
          <>
            <ProtectedRoute requiredPermission={{ resource: 'DepartmentCommittee', action: 'read' }}>
              <TitleUpdater title="Get Case Assigned To You" />
              <GetAssignedCases />
            </ProtectedRoute>
          </>
        )
      },

      {
        path: 'assigned_department_cases',
        element: (
          <>
            <ProtectedRoute requiredPermission={{ resource: 'DepartmentCommittee', action: 'read' }}>
              <TitleUpdater title="Assigned Department Cases" />
              <AssignedDepartmentCases />
            </ProtectedRoute>
          </>
        )
      },

      {
        path: 'department_assigned_case_detail',
        element: (
          <>
            <ProtectedRoute requiredPermission={{ resource: 'DepartmentCommittee', action: 'read' }}>
              <TitleUpdater title="Department Case Detail" />
              <DepartmentAssignedCaseDetail />
            </ProtectedRoute>
          </>
        )
      },

      // Case Review (Council Head)
      {
        path: 'case_review',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'caseReview', action: 'read' }}>
            <TitleUpdater title="Case Review" />
            <CaseReviewIndex />
          </ProtectedRoute>
        )
      },
      {
        path: 'case_review_detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'caseReview', action: 'read' }}>
            <TitleUpdater title="Case Review Detail" />
            <CaseReviewDetail />
          </ProtectedRoute>
        )
      },

      // Case Decision (Council Members)
      {
        path: 'case_decision',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'caseDecision', action: 'read' }}>
            <TitleUpdater title="Case Decision" />
            <CaseDecisionIndex />
          </ProtectedRoute>
        )
      },
      {
        path: 'case_decision_detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'caseDecision', action: 'read' }}>
            <TitleUpdater title="Case Decision Detail" />
            <CaseDecisionDetail />
          </ProtectedRoute>
        )
      },

      // Letter Generation
      {
        path: 'letter_generation',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaintLetterGeneration', action: 'read' }}>
            <TitleUpdater title="Letter Generation" />
            <ComplaintLetterGenerationIndex />
          </ProtectedRoute>
        )
      },
      {
        path: 'letter_generation_detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaintLetterGeneration', action: 'read' }}>
            <TitleUpdater title="Generate Letter" />
            <ComplaintLetterGenerationDetail />
          </ProtectedRoute>
        )
      },

      {
        path: 'federal_office',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'complaintFederalOffice', action: 'read' }}>
            <TitleUpdater title="Federal Office Letters" />
            <FederalOfficeIndex />
          </ProtectedRoute>
        )
      },

      // Disciplinary Letter Generation
      {
        path: 'disciplinary_letter_generation',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'disciplinaryLetterGeneration', action: 'read' }}>
            <TitleUpdater title="Disciplinary Letter Generation" />
            <DisciplinaryLetterGenerationIndex />
          </ProtectedRoute>
        )
      },
      {
        path: 'disciplinary_letter_generation_detail',
        element: (
          <ProtectedRoute requiredPermission={{ resource: 'disciplinaryLetterGeneration', action: 'read' }}>
            <TitleUpdater title="Generate Disciplinary Letter" />
            <DisciplinaryLetterGenerationDetail />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '/',
    element: <MinimalLayout />,
    children: [
      {
        path: 'login',
        element: (
          <>
            {' '}
            <TitleUpdater title="Login" /> <AuthLogin />{' '}
          </>
        )
      },
      {
        path: 'forgot-password',
        element: (
          <>
            {' '}
            <TitleUpdater title="Forgot Password" /> <AuthForgetPasswordRequest />{' '}
          </>
        )
      },
      {
        path: 'reset-password',
        element: (
          <>
            {' '}
            <TitleUpdater title="Reset Password" /> <AuthForgetPassword />{' '}
          </>
        )
      },
      {
        path: 'register',
        element: (
          <>
            {' '}
            <TitleUpdater title="Register" /> <AuthRegister />{' '}
          </>
        )
      }
    ]
  },

  {
    path: '*',
    element: (
      <>
        {' '}
        <TitleUpdater title="404 - Page Not Found" />{' '}
        <ErrorPage errorCode={404} errorMessage="The page you are looking for does not exist." />{' '}
      </>
    )
  }
];

export default router;
