import { NavLink, useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { logout } from "../features/auth/authSlice";
import { logoutUser } from "../features/auth/services/authService";
import { routesConfig } from "../routes/routesConfig";
import type { RouteConfig, UserRole } from "../types";
import { preloadOnHover, preloadCommonRoutes } from "../utils/preloader";
import logo from '../assets/Logo.png';
import styles from "./Menu.module.scss";
import { useState, useEffect, useRef } from "react";

export default function Menu() {
  const role = useRole();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const callsModuleEnabled       = useAppSelector((s) => s.appSettings.callsModuleEnabled);
  const crmModuleEnabled         = useAppSelector((s) => s.appSettings.crmModuleEnabled);
  const crmOnlineSearchEnabled   = useAppSelector((s) => s.appSettings.crmOnlineSearchEnabled);
  const firmaModuleEnabled       = useAppSelector((s) => s.appSettings.firmaModuleEnabled);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const handleLogout = async () => {
    const ok = await logoutUser();
    if (ok) {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  const enabledModules: Record<string, boolean> = {
    calls:           callsModuleEnabled,
    crm:             crmModuleEnabled,
    crmOnlineSearch: crmOnlineSearchEnabled,
    firma:           firmaModuleEnabled,
  };

  // Filtrar rutas según el rol del usuario y módulos activos
  const filteredRoutes = role
    ? routesConfig.filter(route =>
        route.allowedRoles.includes(role as UserRole) &&
        !route.hideFromMenu &&
        (!route.moduleKey || enabledModules[route.moduleKey] !== false)
      )
    : [];

  // Agrupar rutas por grupo
  const menuGroups: Record<string, RouteConfig[]> = {};

  filteredRoutes.forEach(route => {
    if (route.group) {
      if (!menuGroups[route.group]) menuGroups[route.group] = [];
      menuGroups[route.group].push(route);
    }
  });

  // Precargar rutas comunes al montar el componente
  useEffect(() => {
    preloadCommonRoutes();
  }, []);

  // Cerrar dropdown al hacer clic fuera (solo en móvil)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Cerrar el menú móvil cuando se hace clic en un link
  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const toggleDropdown = (groupName: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setOpenDropdown(prev => (prev === groupName ? null : groupName));
  };

  // Renderizar un grupo de menú
  const renderMenuGroup = (groupName: string, items: RouteConfig[], isMobile: boolean = false) => {
    // Si solo hay 1 item en el grupo, mostrarlo directamente sin dropdown
    if (items.length === 1) {
      const item = items[0];
      return (
        <li key={item.path} className={styles.menuItem}>
          {item.external ? (
            <a
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              onClick={handleLinkClick}
            >
              {item.label}
            </a>
          ) : (
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.activeLink : ""}`
              }
              onMouseEnter={() => preloadOnHover(item.path)}
              onClick={handleLinkClick}
            >
              {item.label}
            </NavLink>
          )}
        </li>
      );
    }

    // Si hay múltiples items, mostrar dropdown
    return (
      <li
        key={groupName}
        className={`${styles.menuItem} ${styles.hasDropdown}`}
      >
        <button
          className={`${styles.link} ${styles.dropdownToggle} ${
            openDropdown === groupName ? styles.active : ""
          }`}
          onClick={(e) => toggleDropdown(groupName, e)}
          onMouseEnter={() => !isMobile && setOpenDropdown(groupName)}
        >
          {groupName}
          <svg
            className={`${styles.chevron} ${openDropdown === groupName ? styles.open : ""}`}
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {openDropdown === groupName && (
          <ul className={`${styles.dropdown} ${isMobile ? styles.dropdownMobile : ''}`}>
            {items.map(item => (
              <li key={item.path} className={styles.dropdownItem}>
                {item.external ? (
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.dropdownLink}
                    onClick={handleLinkClick}
                  >
                    <span className={styles.dropdownLinkText}>{item.label}</span>
                  </a>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `${styles.dropdownLink} ${isActive ? styles.activeDropdownLink : ""}`
                    }
                    onMouseEnter={() => preloadOnHover(item.path)}
                    onClick={handleLinkClick}
                  >
                    <span className={styles.dropdownLinkText}>{item.label}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className={styles.nav} ref={navRef}>
      <div className={styles.brand}>
        <img src={logo} alt="Logo Empresa" className={styles.logo} />
      </div>

      {/* Botón hamburguesa para móvil */}
      <button
        className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menú principal */}
      <ul className={`${styles.menuList} ${isMenuOpen ? styles.open : ''}`}>
        {Object.entries(menuGroups).map(([groupName, items]) =>
          renderMenuGroup(groupName, items, isMenuOpen)
        )}
      </ul>

      <div className={styles.userSection}>
        {user && (
          <span className={styles.welcomeText}>
            Bienvenido, {user.firstName} {user.lastName}
          </span>
        )}
        <button onClick={handleLogout} className={styles.logoutButton}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
