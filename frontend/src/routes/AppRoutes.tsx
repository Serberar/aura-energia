import { Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/login/LoginPage";
import UnauthorizedPage from "../pages/unauthorized/UnauthorizedPage";
import PrivateRoute from "./PrivateRoute";
import Layout from "../layouts/Layout";
import { useAppSelector, useAppDispatch } from "../hooks/reduxHooks";
import { routesConfig } from "./routesConfig";
import { Spinner } from "../components/LoadingComponents";
import LazyErrorBoundary from "../components/LazyErrorBoundary";
import { loadModuleSettings } from "../features/settings/settingsSlice";

function HomeRedirect() {
  const s = useAppSelector((state) => state.appSettings);
  if (s.crmOnlineSearchEnabled) return <Navigate to="/dashboard" replace />;
  if (s.crmModuleEnabled)       return <Navigate to="/clients"   replace />;
  if (s.callsModuleEnabled)     return <Navigate to="/calls"     replace />;
  return <Navigate to="/settings/modules" replace />;
}

export default function AppRoutes() {
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isLoggedIn) dispatch(loadModuleSettings());
  }, [isLoggedIn, dispatch]);

  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Página de acceso denegado */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Rutas privadas con Suspense para lazy loading */}
      {routesConfig.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <PrivateRoute allowedRoles={route.allowedRoles} moduleKey={route.moduleKey}>
              <Layout>
                <LazyErrorBoundary>
                  <Suspense fallback={<Spinner size="large" />}>
                    {route.element}
                  </Suspense>
                </LazyErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
      ))}

      {/* Ruta comodín */}
      <Route
        path="*"
        element={isLoggedIn ? <HomeRedirect /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
