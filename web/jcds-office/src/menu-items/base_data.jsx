// assets
import { useEffect, useState } from "react";
import { SettingOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { useStateContext } from '../routes/contextProvider';
import authService from 'service/auth.service';

const icons = {
  SettingOutlined
};

export default function useBaseData() {
  const { token } = useStateContext();
  const { t } = useTranslation();

  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      authService.getPermissionsByUserId(userId)
        .then(response => {
          setUserPermissions(response.data.permissions || []);
          setLoading(false);
        })
        .catch(err => {
          setError("Error fetching permissions");
          setLoading(false);
        });
    }
  }, [token]);

  const hasPermission = (resource, action) =>
    userPermissions.some((permission) => permission.resource === resource && permission.action === action);
  const allPages = [
    {
      id: 'base_data',
      title: t('basedata.settings'),
      type: 'item',
      url: '/setting',
      icon: icons.SettingOutlined,
      target: false,
      permission: { resource: 'region', action: 'read' }
    },
  ];

  const filteredPages = allPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));
  const hasGroupPermission = hasPermission('region', 'read');

  if (!hasGroupPermission) {
    const pages = {
      id: 'base_data',
      type: 'group'
    };
    return pages;
  }
  const pages = {
    id: 'base_data',
    title: t('basedata.settings'),
    type: 'group',
    children: filteredPages
  };

  return pages;
}
