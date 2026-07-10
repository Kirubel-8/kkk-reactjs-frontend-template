// import React from 'react';
import { FileSearchOutlined, FileTextOutlined, FolderOutlined, UploadOutlined, IdcardOutlined, ClusterOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileSearchOutlined,
  FileTextOutlined,
  FolderOutlined,
  UploadOutlined,
  IdcardOutlined,
  ClusterOutlined
};

export default function useFileOrganizerExpert() {
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

  const fileOrganizerPages = [
    // Judiciary Director Section
    {
      id: 'get-director-request',
      title: 'Get New Disciplinary',
      type: 'item',
      url: '/get-director-request',
      icon: icons.IdcardOutlined,
      target: false,
      permission: { resource: 'JudiciaryDirectorate', action: 'reviewDisciplinaryComplaint' }
    },
    {
      id: 'judiciary-director-cases',
      title: 'Disciplinary Record',
      type: 'item',
      url: '/judiciary-director-cases',
      icon: icons.ClusterOutlined,
      target: false,
      permission: { resource: 'JudiciaryDirectorate', action: 'reviewDisciplinaryComplaint' }
    }
  ];

  // Filter pages based on permissions
  const filteredFileOrganizerPages = fileOrganizerPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));

  const hasGroupPermission = hasPermission('JudiciaryDirectorate', 'reviewDisciplinaryComplaint');

  // For demo purposes, always show the menu even without permissions
  // In production, uncomment the permission check below
  if (!hasGroupPermission) {
    const pages = {
      id: 'judicial-director',
      type: 'group'
    };
    return pages;
  }

  const pages = {
    id: 'judicial-director',
    title: 'Judges Disciplinary Matter Director',
    type: 'group',
    children: filteredFileOrganizerPages,
    permission: { resource: 'JudiciaryDirectorate', action: 'reviewDisciplinaryComplaint' }
  };

  return pages;
}
