// import React from 'react';
import {TagsOutlined , FileProtectOutlined ,CommentOutlined, FileSearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileSearchOutlined,
  FileTextOutlined,
  CommentOutlined,FileProtectOutlined ,TagsOutlined 
};

export default function useRegistrar() {
  const { token } = useStateContext();
  const { t } = useTranslation();

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

  const registrarPages = [
    {
      id: 'discipline_request_get',
      title: t('request.getRequest'),
      type: 'item',
      url: '/get_disciplinary_requests',
      icon: icons.FileSearchOutlined,
      target: false,
      permission: { resource: 'disciplineRequest', action: 'read' }
    },

    {
      id: 'disciplinary_requests',
      title: t('request.requestedDoc'),
      type: 'item',
      url: '/disciplinary_requests',
      icon: icons.FileSearchOutlined,
      target: false,
      permission: { resource: 'disciplineRequest', action: 'read' }
    },
    // {
    //   id: 'disciplinary_requests_expiry',
    //   title: t('request.requestedDoc'),
    //   type: 'item',
    //   url: '/disciplinary_requests_expiry',
    //   icon: icons.FileSearchOutlined,
    //   target: false,
    //   permission: { resource: 'disciplineRequest', action: 'read' }
    // },

  ];

  const filteredFjacsPages = registrarPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));

  const hasGroupPermission = hasPermission('disciplineRequest', 'read');

  if (!hasGroupPermission) {
    const pages = {
      id: 'registrar-office',
      type: 'group'
    };
    return pages;
  }
  const pages = {
    id: 'disciplinary-office',
    title: t('request.dispManagement'),
    type: 'group',
    children: filteredFjacsPages,
    permission: { resource: 'disciplineRequest', action: 'read' }
  };

  return pages;
}
