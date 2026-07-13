// import { useEffect, useState } from "react";
// import { Navigate } from 'react-router-dom';
// import { useStateContext } from './contextProvider';
// import { jwtDecode } from 'jwt-decode';
// import authService from 'service/auth.service';

// const hasPermission = (permissions, requiredPermission) => {
//   const permissionList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

//   return permissionList.some(({ resource, action }) =>
//     permissions.some(permission => permission.resource === resource && permission.action === action)
//   );
// };

// const ProtectedRoute = ({ children, requiredPermission }) => {
//   const { token } = useStateContext();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [permissions, setPermissions] = useState([]);

//   if (!token) {
//     return <Navigate to="/login" />;
//   }

//   useEffect(() => {
//     if (token) {
//       const decodedToken = jwtDecode(token);
//       const userId = decodedToken.id;

//       const getUserPermissions = async (userId) => {
//         try {
//           const storedPermissions = localStorage.getItem(`permissions`);

//           if (storedPermissions) {
//             setPermissions(JSON.parse(storedPermissions));
//           } else {
//             const response = await authService.getPermissionsByUserId(userId);
//             setPermissions(response.data.permissions || []);
//             localStorage.setItem(`permissions`, JSON.stringify(response.data.permissions || []));
//           }
//           setLoading(false);
//         } catch (err) {
//           setError("Error fetching permissions");
//           setLoading(false);
//         }
//       };

//       getUserPermissions(userId);
//     }
//   }, [token]);

//   const hasRequiredPermission = hasPermission(permissions, requiredPermission);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!hasRequiredPermission) {
//     return <Navigate to="/error" />;
//   }

//   if (error) {
//     return <div>{error}</div>;
//   }

//   return children;
// };

// export default ProtectedRoute;


const ProtectedRoute = ({ children }) => {
  return children;
};

export default ProtectedRoute;