// src/menu-items/letter_generation.jsx
import { FileTextOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import authService from 'service/auth.service';
import { useStateContext } from '../routes/contextProvider';

const icons = {
  FileTextOutlined
};

// Builds menu groups for complaint and disciplinary letter generation based on permissions.
export default function useLetterGenerationMenu() {
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

  // ==== Menu Pages for Letter Generation ====
  const complaintLetterPage = {
    id: 'letter_generation',
    title: 'Generate Letter',
    type: 'item',
    url: '/letter_generation',
    icon: icons.FileTextOutlined,
    target: false,
    permission: { resource: 'complaintLetterGeneration', action: 'read' }
  };

  const disciplinaryLetterPage = {
    id: 'disciplinary_letter_generation',
    title: t('Disciplinary Letter Generation'),
    type: 'item',
    url: '/disciplinary_letter_generation',
    icon: icons.FileTextOutlined,
    target: false,
    permission: { resource: 'disciplinaryLetterGeneration', action: 'read' }
  };

  const hasComplaintLetterPermission = hasPermission('complaintLetterGeneration', 'read');
  const hasDisciplinaryLetterPermission = hasPermission('disciplinaryLetterGeneration', 'read');

  const complaintGroup = hasComplaintLetterPermission
    ? {
        id: 'letter-generation',
        title: 'Letter Management',
        type: 'group',
        children: [complaintLetterPage]
      }
    : { id: 'letter-generation', type: 'group' };

  const disciplinaryGroup = hasDisciplinaryLetterPermission
    ? {
        id: 'disciplinary-letter-generation',
        title: 'Disciplinary Letter Management',
        type: 'group',
        children: [disciplinaryLetterPage]
      }
    : { id: 'disciplinary-letter-generation', type: 'group' };

  return { complaintGroup, disciplinaryGroup };
}
