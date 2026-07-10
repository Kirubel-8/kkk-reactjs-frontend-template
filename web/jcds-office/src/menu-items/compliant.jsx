// assets
import { useEffect, useState } from 'react';

import { BorderOutlined, ClusterOutlined, CompassOutlined, PartitionOutlined, FileSearchOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { useStateContext } from '../routes/contextProvider';
import authService from 'service/auth.service';

const icons = {
  PartitionOutlined,
  BorderOutlined,
  ClusterOutlined,
  CompassOutlined,
  FileSearchOutlined
};
export default function useCompliant() {
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
  console.log('tokentoken', token);
  const hasPermission = (resource, action) =>
    userPermissions.some((permission) => permission.resource === resource && permission.action === action);

  const allPages = [
    {
      id: 'get_compliant',
      title: t('compliant.get_compliant'),
      type: 'item',
      url: '/get_compliant',
      icon: icons.FileSearchOutlined,
      target: false,
      permission: { resource: 'complaint', action: 'can_get' }
    },
    {
      id: 'compliant',
      title: t('compliant.request'),
      type: 'item',
      url: '/compliant',
      icon: icons.FileSearchOutlined,
      target: false,
      permission: { resource: 'complaint', action: 'read' }
    },
    {
      id: 'complaint_case',
      title: t('compliant.complaint_case'),
      type: 'item',
      url: '/complaint_case',
      icon: icons.ClusterOutlined,
      target: false,
      permission: { resource: 'caseReview', action: 'read' }
    },
    {
      id: 'case_review',
      title: t('compliant.case_review'),
      type: 'item',
      url: '/case_review',
      icon: icons.ClusterOutlined,
      target: false,
      permission: { resource: 'caseReview', action: 'read' }
    },
    {
      id: 'case_decision',
      title: t('compliant.case_decision'),
      type: 'item',
      url: '/case_decision',
      icon: icons.PartitionOutlined,
      target: false,
      permission: { resource: 'caseDecision', action: 'read' }
    }
  ];
  const filteredPages = allPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));
  const hasGroupPermission =
    hasPermission('complaint', 'read') || hasPermission('caseReview', 'read') || hasPermission('caseDecision', 'read');

  if (!hasGroupPermission) {
    const pages = {
      id: 'complaint',
      type: 'group'
    };
    return pages;
  }
  const pages = {
    id: 'compliant',
    title: t('compliant.compliant'),
    type: 'group',
    children: filteredPages
  };

  return pages;
}
