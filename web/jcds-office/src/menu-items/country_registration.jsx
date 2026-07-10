// assets
import { useEffect, useState } from "react";

import { BorderOutlined, ClusterOutlined, CompassOutlined, PartitionOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { useStateContext } from '../routes/contextProvider';
import authService from "service/auth.service";

const icons = {
  PartitionOutlined,
  BorderOutlined,
  ClusterOutlined,
  CompassOutlined
};

export default function useCountryRegistration() {
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
      id: 'region',
      title: t('sector.region'),
      type: 'item',
      url: '/region',
      icon: icons.CompassOutlined,
      target: false,
      permission: { resource: 'region', action: 'read' }
    },
    {
      id: 'city',
      title: t('sector.cityAdmin'),
      type: 'item',
      url: '/city',
      icon: icons.CompassOutlined,
      target: false,
      permission: { resource: 'region', action: 'read' }
    },
    {
      id: 'zone',
      title: t('sector.zone'),
      type: 'item',
      url: '/zone',
      icon: icons.PartitionOutlined,
      target: false,
      permission: { resource: 'zone', action: 'read' }
    },
    {
      id: 'sub_city',
      title: t('sector.subCity'),
      type: 'item',
      url: '/sub-city',
      icon: icons.PartitionOutlined,
      target: false,
      permission: { resource: 'zone', action: 'read' }
    },
    {
      id: 'woreda',
      title: t('sector.woreda'),
      type: 'item',
      url: '/woreda',
      icon: icons.ClusterOutlined,
      target: false,
      permission: { resource: 'woreda', action: 'read' }
    }
  ];

  const filteredPages = allPages.filter((page) => hasPermission(page.permission.resource, page.permission.action));
  const hasGroupPermission = hasPermission('region', 'read');

  if (!hasGroupPermission) {
    const pages = {
      id: 'country_registration',
      type: 'group'
    };
    return pages;
  }
  const pages = {
    id: 'country_registration',
    // title: t('sector.sectorManagement'),
    type: 'group'
    // children: filteredPages
  };

  return pages;
}
