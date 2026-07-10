// src/menu-items/federal_office.jsx
import { FileSearchOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileSearchOutlined
};

// Builds menu item for federal office letter viewing based on permissions.
export default function useFederalOfficeMenu() {
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

  const hasPermission = (resource, action) => userPermissions.some((perm) => perm.resource === resource && perm.action === action);

  // ==== Menu Page for Federal Office ====
  const federalOfficePage = {
    id: 'federal_office',
    title: 'Federal Office Letters',
    type: 'item',
    url: '/federal_office',
    icon: icons.FileSearchOutlined,
    target: false,
    permission: { resource: 'complaintFederalOffice', action: 'read' }
  };

  const hasFederalOfficePermission = hasPermission('complaintFederalOffice', 'read');

  const federalOfficeGroup = hasFederalOfficePermission
    ? {
        id: 'federal-office',
        title: 'Federal Office',
        type: 'group',
        children: [federalOfficePage]
      }
    : { id: 'federal-office', type: 'group' };

  return federalOfficeGroup;
}

