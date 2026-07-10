// src/menu-items/committeeDecidedMenu.js
import { FileDoneOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileDoneOutlined
};

export default function useCommitteeDecidedMenu() {
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

  // ==== Menu Pages for Committee Decided ====
  const committeeDecidedPages = [
    {
      id: 'committee_decided_cases',
      title: t('Council Decisions'),
      type: 'item',
      url: '/committee_decided', // match your route
      icon: icons.FileDoneOutlined,
      target: false,
      permission: { resource: 'CommitteeDecided', action: 'read' }
    }
  ];

  const filteredPages = committeeDecidedPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));

  const hasGroupPermission = hasPermission('CommitteeDecided', 'read');

  if (!hasGroupPermission) {
    return { id: 'committee-decided', type: 'group' };
  }

  const pages = {
    id: 'committee-decided',
    title: 'Committee Decided',
    type: 'group',
    children: filteredPages,
    permission: { resource: 'CommitteeDecided', action: 'read' }
  };

  return pages;
}
