# Manual de Usuario - Rol Verificador

## Introducción

Bienvenido al manual de usuario para el rol de **Verificador**. Como verificador, tu función principal es revisar y procesar las ventas creadas por el equipo comercial, asegurando que toda la información sea correcta antes de que la venta avance en el proceso.

Tus responsabilidades incluyen:
- Buscar información de clientes
- Revisar y verificar ventas pendientes
- Editar datos de ventas si es necesario
- Cambiar el estado de las ventas
- Gestionar grabaciones de llamadas
- Crear ventas cuando sea necesario

---

## Acceso al Sistema

### Iniciar Sesión

1. Abre tu navegador web
2. Ingresa la dirección del sistema
3. Introduce tu **usuario** y **contraseña**
4. Haz clic en **Iniciar sesión**

### Cerrar Sesión

1. En la esquina superior derecha, haz clic en tu nombre
2. Selecciona **Cerrar sesión**

---

## Menú de Navegación

Como verificador, tienes acceso a las siguientes secciones:

| Sección             | Descripción                             |
|---------------------|-----------------------------------------|
| **Buscar registro** | Búsqueda de clientes por teléfono o DNI |
| **Aplicaciones**    | Herramientas externas                   |
| **Clientes**        | Gestión de clientes                     |
| **Ventas**          | Lista y gestión de ventas               |

---

## Búsqueda de Clientes

### Dashboard de Búsqueda

La pantalla principal te permite buscar clientes rápidamente:

1. Escribe el **teléfono** o **DNI** del cliente
2. Haz clic en **Buscar**
3. Los resultados se mostrarán con toda la información del cliente

Puedes realizar múltiples búsquedas y los resultados se acumularán en pantalla.

---

## Gestión de Ventas

### Ver Lista de Ventas

1. En el menú lateral, haz clic en **Ventas**
2. Verás el listado de todas las ventas:

```
┌─────────────────────────────────────────────────────────────────┐
│  Gestión de Ventas                          [+ Nueva Venta]     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Filtros:                                                │    │
│  │ Estado: [Todos ▼]  Comercial: [Todos ▼]  Fecha: [    ]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #a1b2c3  │ María López   │ Pendiente   │ 15/01/2024   │    │
│  │            │ 12345678A     │ Juan García │              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #d4e5f6  │ Pedro Martín  │ Verificada  │ 14/01/2024   │    │
│  │            │ 87654321B     │ Ana López   │              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Filtrar Ventas

Usa los filtros para encontrar ventas específicas:

- **Estado**: Filtra por estado de la venta (Pendiente, Verificada, etc.)
- **Comercial**: Filtra por el comercial que creó la venta
- **Fecha**: Filtra por rango de fechas

### Ver Detalle de una Venta

1. Haz clic en cualquier venta de la lista
2. Se abrirá el detalle completo:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver                  Venta #a1b2c3d4       [Pendiente]  │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  INFORMACIÓN GENERAL                                            │
│  ├─ ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890                    │
│  ├─ Creada: 15 enero 2024, 10:30                                │
│  └─ Actualizada: 15 enero 2024, 10:30                           │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  CLIENTE                                      [Editar Cliente]  │
│  ├─ Nombre: María López García                                  │
│  ├─ DNI: 12345678A                                              │
│  ├─ Email: maria@email.com                                      │
│  ├─ Teléfono: 666123456                                         │
│  ├─ Cuenta: ES12 1234 5678 90 1234567890                        │
│  │                                                              │
│  │  Dirección de Suministro                                     │
│  ├─ Dirección: Calle Principal 123, 28001 Madrid                │
│  ├─ CUPS Luz: ES0021000000000001AA                              │
│  └─ CUPS Gas: ES0022000000000001BB                              │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  COMERCIAL                                         [Editar]     │
│  └─ Juan García Pérez                                           │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  PRODUCTOS                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Tarifa Luz Básica    │ x1 │ 45.99€  │ [Editar] [Eliminar]│   │
│  │ Tarifa Gas Hogar     │ x1 │ 35.50€  │ [Editar] [Eliminar]│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                    [+ Añadir Producto]          │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  GRABACIONES                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ llamada_cliente.mp3  │ 2.3 MB │ [Descargar]             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                    [+ Subir Grabación]          │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  CAMBIAR ESTADO                                                 │
│  Estado actual: Pendiente                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ○ Pendiente  ● En Verificación  ○ Verificada  ○ ...     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                    [Guardar Estado]             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Editar Datos del Cliente en la Venta

Puedes corregir los datos del cliente si hay errores:

1. En el detalle de la venta, haz clic en **Editar Cliente**
2. Modifica los campos necesarios:
   - Nombre y apellidos
   - DNI
   - Email
   - Fecha de nacimiento
   - Teléfono
   - Cuenta bancaria
   - Dirección de suministro
   - CUPS de luz y gas
3. Haz clic en **Guardar Cambios**

**Importante**: Los cambios solo afectan a esta venta, no modifican los datos del cliente original en la base de datos.

---

## Editar el Comercial

Si necesitas cambiar el nombre del comercial asignado:

1. En la sección **Comercial**, haz clic en **Editar**
2. Escribe el nuevo nombre
3. Haz clic en **Guardar**

---

## Gestionar Productos de la Venta

### Añadir un Producto

1. En la sección **Productos**, haz clic en **+ Añadir Producto**
2. Busca el producto por nombre
3. Selecciona el producto
4. Indica la cantidad
5. El producto se añadirá a la lista

### Editar un Producto

1. Haz clic en **Editar** junto al producto
2. Modifica la cantidad
3. Guarda los cambios

### Eliminar un Producto

1. Haz clic en **Eliminar** junto al producto
2. Confirma la eliminación

---

## Gestionar Grabaciones

Las grabaciones de llamadas son importantes para la verificación.

### Subir una Grabación

1. En la sección **Grabaciones**, haz clic en **+ Subir Grabación**
2. Selecciona el archivo de audio desde tu ordenador
3. Espera a que se complete la subida
4. La grabación aparecerá en la lista

**Formatos soportados**: MP3, WAV, M4A, MP4

### Descargar una Grabación

1. Haz clic en **Descargar** junto a la grabación
2. El archivo se descargará a tu ordenador

### Escuchar una Grabación

1. Descarga el archivo
2. Ábrelo con tu reproductor de audio

---

## Cambiar Estado de una Venta

El flujo normal de estados es:

```
Pendiente → En Verificación → Verificada → Completada
                                       ↘ Cancelada
```

### Cambiar el Estado

1. En la sección **Cambiar Estado**, selecciona el nuevo estado
2. Haz clic en **Guardar Estado**
3. El cambio se registrará en el historial

---

## Crear una Nueva Venta

Aunque tu rol principal es verificar, también puedes crear ventas:

1. En la lista de ventas, haz clic en **+ Nueva Venta**
2. Sigue los mismos pasos que un comercial:
   - Buscar o crear cliente
   - Seleccionar dirección
   - Añadir productos
   - Indicar comercial
   - Crear la venta

---

## Problemas Frecuentes

### "No puedo cambiar el estado"
- Verifica que tienes permisos para ese cambio de estado
- Algunos estados son finales y no pueden modificarse

### "No se sube la grabación"
- Verifica que el archivo no supere el tamaño máximo (50MB)
- Asegúrate de que el formato es compatible