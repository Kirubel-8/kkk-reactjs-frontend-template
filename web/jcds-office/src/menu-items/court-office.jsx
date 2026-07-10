import { FileSearchOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileSearchOutlined,
  CloudUploadOutlined
};

export default function useCourtOffice() {
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

  const courtOfficePages = [
    {
      id: 'court-office-requests',
      title: 'Document Requests',
      type: 'item',
      url: '/court-office/requests',
      icon: icons.FileSearchOutlined,
      target: false,
      permission: { resource: 'CourtOffice', action: 'viewDocumentRequests' }
    }
  ];

  // Filter pages based on permissions
  const filteredCourtOfficePages = courtOfficePages.filter((page) => hasPermission(page.permission.resource, page.permission.action));

  const hasGroupPermission = hasPermission('CourtOffice', 'viewDocumentRequests');

  if (!hasGroupPermission) {
    const pages = {
      id: 'court-office',
      type: 'group'
    };
    return pages;
  }

  const pages = {
    id: 'court-office',
    title: 'Court Office',
    type: 'group',
    children: filteredCourtOfficePages,
    permission: { resource: 'CourtOffice', action: 'viewDocumentRequests' }
  };

  return pages;
}
