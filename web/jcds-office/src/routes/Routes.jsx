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
