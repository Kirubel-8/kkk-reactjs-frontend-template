// assets
import { AudioOutlined, DashboardOutlined, HomeOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';
const icons = {
  DashboardOutlined,
  AudioOutlined,
  HomeOutlined
};
export default function useDashboard() {
  const { t } = useTranslation();
  const { token } = useStateContext();

  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      authService
        .getPermissionsByUserId(userId)
        .then((response) => {
          setUserPermissions(response.data.permissions || []);
          setLoading(false);
        })
        .catch((err) => {
          setError('Error fetching permissions');
          setLoading(false);
        });
    }
  }, [token]);

  const hasPermission = (resource, action) =>
    userPermissions.some((permission) => permission.resource === resource && permission.action === action);

  const pages = [
    {
      id: 'dashboard',
      title: t('navigation.Dashboard'),
      type: 'item',
      url: '/',
      icon: icons.HomeOutlined,
      target: false
    },
   
  ];

  const dashboardGroup = {
    id: 'group-dashboard',
    // title: t('navigation.Navigation'),
    type: 'group',
    children: pages
  };

  return dashboardGroup;
}
