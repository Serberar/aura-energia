import React from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";

interface PrivateRouteProps {
  children:     ReactNode;
  allowedRoles?: string[];
  moduleKey?:   string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles, moduleKey }) => {
  const { isLoggedIn, role } = useAppSelector((state) => state.auth);
  const settings = useAppSelector((s) => s.appSettings);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role ?? "")) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (moduleKey) {
    const moduleEnabled: Record<string, boolean> = {
      calls:           settings.callsModuleEnabled,
      crm:             settings.crmModuleEnabled,
      crmOnlineSearch: settings.crmOnlineSearchEnabled,
      firma:           settings.firmaModuleEnabled,
    };
    if (moduleEnabled[moduleKey] === false) {
      return <Navigate to="/settings/modules" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
