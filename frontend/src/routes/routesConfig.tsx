import { lazy } from "react";
import type { RouteConfig } from "../types";

// Páginas del Buscador (siempre activas)
const DashboardPage    = lazy(() => import("../pages/dashboard/DashboardPage"));
const EditClientsPage  = lazy(() => import("../pages/editClients/EditClientsPage"));
const AppsPage         = lazy(() => import("../pages/apps/AppsPage"));

// Páginas del módulo CRM
const CrmDashboardPage = lazy(() => import("../pages/crm-dashboard/CrmDashboardPage"));
const ClientsPage      = lazy(() => import("../pages/clients/ClientsPage"));
const ProductsPage     = lazy(() => import("../pages/products/ProductsPage"));
const SalesPage        = lazy(() => import("../pages/sales/SalesPage"));
const SaleStatusPage   = lazy(() => import("../pages/sale-status/SaleStatusPage"));

// Páginas del módulo Llamadas
const CallsPage        = lazy(() => import("../pages/calls/CallsPage"));
const SupervisorPage   = lazy(() => import("../pages/calls/SupervisorPage"));
const ReportsPage      = lazy(() => import("../pages/calls/ReportsPage"));
const DncPage          = lazy(() => import("../pages/calls/DncPage"));
const ScriptsPage      = lazy(() => import("../pages/calls/ScriptsPage"));
const DialerPage       = lazy(() => import("../pages/calls/DialerPage"));
const CampaignsPage       = lazy(() => import("../pages/calls/CampaignsPage"));
const ReviewPage          = lazy(() => import("../pages/calls/ReviewPage"));
const DispositionsPage    = lazy(() => import("../pages/calls/DispositionsPage"));


// Páginas de Administración
const UsersPage             = lazy(() => import("../pages/users/UsersPage"));
const SettingsPage          = lazy(() => import("../pages/settings/SettingsPage"));
const ModulesPage           = lazy(() => import("../pages/settings/modules/ModulesPage"));
const SignatureSettingsPage  = lazy(() => import("../pages/settings/signature/SignatureSettingsPage"));
const IpSettingsPage        = lazy(() => import("../pages/settings/ips/IpSettingsPage"));
const ContractTemplatesPage = lazy(() => import("../pages/settings/contract/ContractTemplatesPage"));
const ContractSettingsPage  = lazy(() => import("../pages/settings/contract/ContractSettingsPage"));
const CallsSettingsPage     = lazy(() => import("../pages/settings/calls/CallsSettingsPage"));
const CrmSettingsPage       = lazy(() => import("../pages/settings/crm/CrmSettingsPage"));
const CrmImportPage         = lazy(() => import("../pages/settings/crm/CrmImportPage"));

export const routesConfig: RouteConfig[] = [

  // ── Buscador ──────────────────────────────────────────────────────────────
  {
    path: "/dashboard",
    element: <DashboardPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Buscar registro",
    group: "Buscador",
    moduleKey: "crmOnlineSearch",
  },
  {
    path: "/edit",
    element: <EditClientsPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Editar registro",
    group: "Buscador",
    hideFromMenu: true,
    moduleKey: "crmOnlineSearch",
  },
  {
    path: "/apps",
    element: <AppsPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Aplicaciones",
    group: "Buscador",
    moduleKey: "crmOnlineSearch",
  },

  // ── Módulo CRM ────────────────────────────────────────────────────────────
  {
    path: "/crm",
    element: <CrmDashboardPage />,
    allowedRoles: ["administrador"],
    label: "Dashboard CRM",
    group: "CRM",
    moduleKey: "crm",
  },
  {
    path: "/clients",
    element: <ClientsPage />,
    allowedRoles: ["administrador", "coordinador", "verificador"],
    label: "Clientes",
    group: "CRM",
    moduleKey: "crm",
  },
  {
    path: "/products",
    element: <ProductsPage />,
    allowedRoles: ["administrador"],
    label: "Productos",
    group: "CRM",
    moduleKey: "crm",
  },
  {
    path: "/sales",
    element: <SalesPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Ventas",
    group: "CRM",
    moduleKey: "crm",
  },
  {
    path: "/sales/create",
    element: <SalesPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Nueva Venta",
    group: "CRM",
    hideFromMenu: true,
    moduleKey: "crm",
  },
  {
    path: "/sales/:saleId",
    element: <SalesPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Detalle de Venta",
    group: "CRM",
    hideFromMenu: true,
    moduleKey: "crm",
  },
  {
    path: "/sale-status",
    element: <SaleStatusPage />,
    allowedRoles: ["administrador"],
    label: "Estados de Venta",
    group: "CRM",
    moduleKey: "crm",
  },

  // ── Módulo Llamadas ───────────────────────────────────────────────────────
  {
    path: "/calls",
    element: <CallsPage />,
    allowedRoles: ["administrador", "coordinador", "comercial"],
    label: "Llamadas",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/supervisor",
    element: <SupervisorPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Supervisor",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/reports",
    element: <ReportsPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Reportes",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/dnc",
    element: <DncPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Bloqueados",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/review",
    element: <ReviewPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Revisar registros",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/dispositions",
    element: <DispositionsPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Codificaciones",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/scripts",
    element: <ScriptsPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Guiones",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/dialer",
    element: <DialerPage />,
    allowedRoles: ["administrador", "coordinador", "comercial"],
    label: "Marcador",
    group: "Llamadas",
    moduleKey: "calls",
  },
  {
    path: "/calls/campaigns",
    element: <CampaignsPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Campañas",
    group: "Llamadas",
    moduleKey: "calls",
  },

  // ── Administración ────────────────────────────────────────────────────────
  {
    path: "/users",
    element: <UsersPage />,
    allowedRoles: ["administrador"],
    label: "Gestión de Usuarios",
    group: "Administración",
    hideFromMenu: true,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    allowedRoles: ["administrador"],
    label: "Configuración",
    group: "Administración",
  },
  {
    path: "/settings/crm",
    element: <CrmSettingsPage />,
    allowedRoles: ["administrador"],
    label: "Módulo CRM",
    group: "Administración",
    hideFromMenu: true,
    moduleKey: "crm",
  },
  {
    path: "/settings/crm/import",
    element: <CrmImportPage />,
    allowedRoles: ["administrador"],
    label: "Importar clientes",
    group: "Administración",
    hideFromMenu: true,
    moduleKey: "crm",
  },
  {
    path: "/settings/calls",
    element: <CallsSettingsPage />,
    allowedRoles: ["administrador"],
    label: "Módulo de Llamadas",
    group: "Administración",
    hideFromMenu: true,
    moduleKey: "calls",
  },
  {
    path: "/settings/modules",
    element: <ModulesPage />,
    allowedRoles: ["administrador"],
    label: "Módulos del sistema",
    group: "Administración",
    hideFromMenu: true,
  },
  {
    path: "/settings/signature",
    element: <SignatureSettingsPage />,
    allowedRoles: ["administrador"],
    label: "Firma Electrónica",
    group: "Administración",
    hideFromMenu: true,
  },
  {
    path: "/settings/ips",
    element: <IpSettingsPage />,
    allowedRoles: ["administrador"],
    label: "IPs Permitidas",
    group: "Administración",
    hideFromMenu: true,
  },
  {
    path: "/settings/contract",
    element: <ContractTemplatesPage />,
    allowedRoles: ["administrador"],
    label: "Plantillas de Contrato",
    group: "Administración",
    hideFromMenu: true,
  },
  {
    path: "/settings/contract/:templateId",
    element: <ContractSettingsPage />,
    allowedRoles: ["administrador"],
    label: "Editar Plantilla de Contrato",
    group: "Administración",
    hideFromMenu: true,
  },
];
