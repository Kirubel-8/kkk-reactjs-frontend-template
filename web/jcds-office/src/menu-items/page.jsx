// assets
import { useEffect, useState } from "react";
import { ClusterOutlined, IdcardOutlined, TeamOutlined, UserOutlined, FileSearchOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { useStateContext } from '../routes/contextProvider';
import authService from "service/auth.service";

const icons = {
  UserOutlined,
  ClusterOutlined,
  IdcardOutlined,
  TeamOutlined,
  FileSearchOutlined
};

export default function usePages() {
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
      id: 'user',
      title: t('user.User'),
      type: 'item',
      url: '/user',
      icon: icons.UserOutlined,
      target: false,
      permission: { resource: 'user', action: 'read' }
    },
    {
      id: 'applicant',
      title: t('user.applicant'),
      type: 'item',
      url: '/applicant',
      icon: icons.UserOutlined,
      target: false,
      permission: { resource: 'user', action: 'read' }
    },
    {
      id: 'department',
      title: t('user.department'),
      type: 'item',
      url: '/department',
      icon: icons.ClusterOutlined,
      target: false,
      permission: { resource: 'department', action: 'read' }
    },
    {
      id: 'role',
      title: t('user.Role'),
      type: 'item',
      url: '/role',
      icon: icons.IdcardOutlined,
      target: false,
      permission: { resource: 'role', action: 'read' }
    },
    {
      id: 'team',
      title: t('user.Team'),
      type: 'item',
      url: '/team',
      icon: icons.TeamOutlined,
      target: false,
      permission: { resource: 'team', action: 'read' }
    }
  ];

  const filteredPages = allPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));
  const hasGroupPermission = hasPermission('user', 'read');

  if (!hasGroupPermission) {
    const pages = {
      id: 'authentication',
      type: 'group'
    };
    return pages;
  }
  const pages = {
    id: 'authentication',
    title: t('user.User_Management'),
    type: 'group',
    children: filteredPages
  };

  return pages;
}
