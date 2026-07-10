import { FileSearchOutlined, TeamOutlined, FileDoneOutlined, UploadOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileSearchOutlined,
  TeamOutlined,
  FileDoneOutlined,
  UploadOutlined
};

export default function useDepartmentCommitteeMenu() {
  const { token } = useStateContext();
  const { t } = useTranslation();
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      const userId = decoded.id;

      authService
        .getPermissionsByUserId(userId)
        .then((response) => {
          setUserPermissions(response.data.permissions || []);
          setLoading(false);
        })
        .catch(() => {
          setError('Error fetching permissions');
          setLoading(false);
        });
    }
  }, [token]);

  const hasPermission = (resource, action) =>
    userPermissions.some(
      (perm) => perm.resource === resource && perm.action === action
    );

  const departmentCommitteePages = [
    {
      id: 'assigned_department_cases',
      title: t('GetAssignedCases'),
      type: 'item',
      url: '/assigned_department_cases',
      icon: icons.FileSearchOutlined,
      target: false,
      permission: { resource: 'DepartmentCommittee', action: 'read' }
    }
 
  ];

  // Filter pages by permission
  const filteredPages = departmentCommitteePages.filter((page) =>
    hasPermission(page.permission.resource, page.permission.action)
  );

  // Show group only if user has read permission
  const hasGroupPermission = hasPermission('DepartmentCommittee', 'read');

  if (!hasGroupPermission) {
    // Return empty group to avoid breaking sidebar
    return { id: 'department-committee', type: 'group' };
  }

  const pages = {
    id: 'department-committee',
    title: 'Department Committee',
    type: 'group',
    children: filteredPages,
    permission: { resource: 'DepartmentCommittee', action: 'read' }
  };

  return pages;
}
