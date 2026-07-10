import { useStateContext } from '../../routes/contextProvider'
// ==============================|| MINIMAL LAYOUT ||============================== //
import { Outlet, Navigate, NavLink } from "react-router-dom";

export default function MinimalLayout() {
  const {user, token, setUser, setToken} = useStateContext();
  if(token){
    return <Navigate to ="/"/>
}
  return (
    <>
      <Outlet />
    </>
  );
}
