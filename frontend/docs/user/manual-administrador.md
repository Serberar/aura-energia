# Manual de Usuario - Rol Administrador

## Introducción

Como administrador, tienes acceso completo a todas las funcionalidades del sistema, incluyendo la configuración y gestión de elementos que otros roles no pueden modificar.

Tus responsabilidades incluyen:
- Todas las funciones de otros roles
- Gestión de productos
- Configuración de estados de venta
- Visualización del dashboard de estadísticas
- **Creación de nuevos usuarios**

---

## Acceso al Sistema

### Iniciar Sesión

1. Abre tu navegador web
2. Ingresa la dirección del sistema
3. Introduce tu **usuario** y **contraseña**
4. Haz clic en **Iniciar sesión**

---

## Menú de Navegación

Como administrador, tienes acceso a TODAS las secciones:

| Sección              | Descripción              |
|----------------------|--------------------------|
| **Buscar registro**  | Búsqueda de clientes     |
| **Editar registro**  | Edición de registros     |
| **Aplicaciones**     | Herramientas externas    |
| **Dashboard CRM**    | Estadísticas del sistema |
| **Clientes**         | Gestión de clientes      |
| **Productos**        | Gestión de productos     |
| **Ventas**           | Gestión de ventas        |
| **Estados de Venta** | Configuración de estados |

---

## Dashboard CRM - Estadísticas

### Acceder al Dashboard

1. En el menú lateral, haz clic en **Dashboard CRM**
2. Verás un resumen de las estadísticas del sistema:

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard CRM                                                  │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  Total Ventas │  │   Este Mes    │  │  Esta Semana  │        │
│  │     150       │  │      32       │  │       8       │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                 │
│  Ventas por Estado:                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Pendiente      ████████░░░░░░░░░░░░░░░░  45             │    │
│  │ Verificada     ████████████████░░░░░░░░  80             │    │
│  │ Completada     █████░░░░░░░░░░░░░░░░░░░  25             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Métricas Disponibles

- **Total de ventas**: Número total de ventas en el sistema
- **Ventas este mes**: Ventas creadas en el mes actual
- **Ventas esta semana**: Ventas creadas en la semana actual
- **Distribución por estado**: Cuántas ventas hay en cada estado

---

## Gestión de Productos

### Acceder a Productos

1. En el menú lateral, haz clic en **Productos**
2. Verás la lista de todos los productos:

```
┌─────────────────────────────────────────────────────────────────┐
│  Gestión de Productos                       [+ Nuevo Producto]  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Tarifa Luz Básica    │ LUZ-001 │ 45.99€ │ ● Activo      │    │
│  │ Tarifa de luz para hogares                [Editar]      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Tarifa Gas Hogar     │ GAS-001 │ 35.50€ │ ● Activo      │    │
│  │ Tarifa de gas natural                     [Editar]      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Pack Luz + Gas       │ PACK-01 │ 75.00€ │ ○ Inactivo    │    │
│  │ Combinado luz y gas                       [Editar]      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Crear un Producto

1. Haz clic en **+ Nuevo Producto**
2. Completa los datos:

```
┌─────────────────────────────────────────────────────────────────┐
│  Nuevo Producto                                                 │
│                                                                 │
│  Nombre: ________________________________                       │
│                                                                 │
│  Descripción: ___________________________                       │
│                                                                 │
│  SKU: ___________________________________                       │
│                                                                 │
│  Precio: ________________________________                       │
│                                                                 │
│              [Cancelar]    [Crear Producto]                     │
└─────────────────────────────────────────────────────────────────┘
```

3. Haz clic en **Crear Producto**

### Editar un Producto

1. Haz clic en **Editar** junto al producto
2. Modifica los campos necesarios
3. Guarda los cambios

### Activar/Desactivar un Producto

1. Haz clic en **Editar** junto al producto
2. Cambia el estado de **Activo** a **Inactivo** o viceversa
3. Guarda

**Nota**: Los productos inactivos no aparecen disponibles para nuevas ventas, pero las ventas existentes mantienen su información.

---

## Gestión de Estados de Venta

### Acceder a Estados

1. En el menú lateral, haz clic en **Estados de Venta**
2. Verás la lista de estados ordenados:

```
┌─────────────────────────────────────────────────────────────────┐
│  Estados de Venta                           [+ Nuevo Estado]    │
│                                                                 │
│  Arrastra para reordenar                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ≡  1. Pendiente      │ ██ Naranja │          [Editar]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ≡  2. En Verificación│ ██ Azul    │          [Editar]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ≡  3. Verificada     │ ██ Verde   │          [Editar]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ≡  4. Completada     │ ██ Verde ✓ │ Final    [Editar]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ≡  5. Cancelada      │ ██ Rojo  ✗ │ Final    [Editar]   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Crear un Estado

1. Haz clic en **+ Nuevo Estado**
2. Configura:
   - **Nombre**: Nombre descriptivo del estado
   - **Color**: Color para identificación visual
   - **Es final**: Marca si es un estado que cierra la venta
   - **Es cancelación**: Marca si es un estado de cancelación

3. Haz clic en **Crear Estado**

### Editar un Estado

1. Haz clic en **Editar** junto al estado
2. Modifica los campos
3. Guarda

### Reordenar Estados

Los estados se muestran en orden en los selectores. Para cambiar el orden:

1. Arrastra el estado usando el icono ≡
2. Suéltalo en la nueva posición
3. El orden se guarda automáticamente

### Eliminar un Estado

1. Haz clic en **Editar** junto al estado
2. Haz clic en **Eliminar**
3. Confirma la eliminación

**Importante**: No puedes eliminar un estado que tenga ventas asociadas. Primero debes cambiar esas ventas a otro estado.

---

## Creación de Usuarios (Ruta Oculta)

> **IMPORTANTE**: Esta función no tiene interfaz en el sistema. Debes usar herramientas externas.

El sistema no tiene una pantalla para crear usuarios. Los nuevos usuarios se crean mediante una petición directa a la API.

### Método 1: Usando Postman

1. Abre Postman
2. Crea una nueva petición:
   - **Método**: POST
   - **URL**: `http://[tu-servidor]/api/users/register`
3. Ve a la pestaña **Body**
4. Selecciona **raw** y **JSON**
5. Introduce los datos del nuevo usuario:

```json
{
  "firstName": "Nombre",
  "lastName": "Apellidos",
  "username": "nombre_usuario",
  "password": "contraseña_segura",
  "role": "comercial"
}
```

6. Haz clic en **Send**
7. Si es exitoso, recibirás:

```json
{
  "id": "uuid-del-usuario",
  "username": "nombre_usuario"
}
```

### Método 2: Usando curl (Terminal)

```bash
curl -X POST http://[tu-servidor]/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Nombre",
    "lastName": "Apellidos",
    "username": "nombre_usuario",
    "password": "contraseña_segura",
    "role": "comercial"
  }'
```

### Roles Disponibles

Al crear un usuario, puedes asignar uno de estos roles:

| Rol             | Descripción                |
|-----------------|----------------------------|
| `administrador` | Acceso completo            |
| `coordinador`   | Supervisión de operaciones |
| `verificador`   | Verificación de ventas     |
| `comercial`     | Registro de ventas         |

### Ejemplo: Crear un Comercial

```json
{
  "firstName": "Juan",
  "lastName": "García Pérez",
  "username": "jgarcia",
  "password": "MiContraseña123",
  "role": "comercial"
}
```

### Ejemplo: Crear un Coordinador

```json
{
  "firstName": "Ana",
  "lastName": "López Martín",
  "username": "alopez",
  "password": "ContraseñaSegura456",
  "role": "coordinador"
}
```

### Requisitos de la Contraseña

- Mínimo 8 caracteres (recomendado)
- Combinar letras y números
- Evitar contraseñas obvias

### Errores Comunes

**"El usuario ya existe"**
- El username debe ser único
- Elige otro nombre de usuario

**"Datos inválidos"**
- Verifica que todos los campos están completos
- El rol debe ser exactamente uno de los válidos

---

## Gestión de Ventas (Avanzado)

Como administrador, tienes todas las funciones de gestión de ventas:

- Ver todas las ventas
- Editar cualquier venta
- Cambiar cualquier estado
- Eliminar grabaciones
- Crear ventas

Consulta el [Manual del Coordinador](./manual-coordinador.md) para detalles sobre estas funciones.

---

## Gestión de Clientes

Tienes acceso completo a la gestión de clientes:

- Buscar clientes
- Crear clientes
- Editar registros
- Ver historial de ventas

---

## Resumen de Funciones Exclusivas del Administrador

| Función              | Descripción                         |
|----------------------|-------------------------------------|
| Dashboard CRM        | Ver estadísticas del sistema        |
| Gestión de Productos | Crear, editar, activar/desactivar   |
| Estados de Venta     | Crear, editar, reordenar, eliminar  |
| Crear Usuarios       | Mediante API (ruta oculta)          |