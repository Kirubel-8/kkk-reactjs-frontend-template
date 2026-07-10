// import React from 'react';
import { FileSearchOutlined, FileTextOutlined, FolderOutlined, UploadOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileSearchOutlined,
  FileTextOutlined,
  FolderOutlined,
  UploadOutlined
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
    {
      id: 'file_organizer_get',
      title: t('fileOrganizer.getComplaint'),
      type: 'item',
      url: '/get_file_organizer_files', 
      icon: icons.FileSearchOutlined,
      target: false,
      permission: { resource: 'JudiciaryInvestigationDirectorate', action: 'read' }
    },
    {
      id: 'file_organizer_assigned',
      title: t('fileOrganizer.assignedComplaints'),
      type: 'item',
      url: '/assigned_complaints',
      icon: icons.FileTextOutlined,
      target: false,
      permission: { resource: 'JudiciaryInvestigationDirectorate', action: 'read' }
    }
  ];

  // Filter pages based on permissions
  const filteredFileOrganizerPages = fileOrganizerPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));

  const hasGroupPermission = hasPermission('JudiciaryInvestigationDirectorate', 'read');

  // For demo purposes, always show the menu even without permissions
  // In production, uncomment the permission check below
  if (!hasGroupPermission) {
    const pages = {
      id: 'file-organizer-expert',
      type: 'group'
    };
    return pages;
  }

  const pages = {
    id: 'file-organizer-expert',
    title: "Disciplinary Records Management",
    type: 'group',
    children: filteredFileOrganizerPages,
    permission: { resource: 'JudiciaryInvestigationDirectorate', action: 'read' }
  };

  return pages;
}
