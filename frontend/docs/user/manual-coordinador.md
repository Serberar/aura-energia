# Manual de Usuario - Rol Coordinador

## Introducción

Bienvenido al manual de usuario para el rol de **Coordinador**. Como coordinador, tienes la responsabilidad de supervisar las operaciones del equipo, gestionar ventas y clientes, y asegurar que el flujo de trabajo se mantenga eficiente.

Tus responsabilidades incluyen:
- Supervisar el trabajo del equipo comercial y verificador
- Gestionar y editar registros de clientes
- Revisar y procesar ventas
- Cambiar estados de ventas
- Gestionar grabaciones (incluido eliminar)
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

Como coordinador, tienes acceso a las siguientes secciones:

| Sección | Descripción |
|---------|-------------|
| **Buscar registro** | Búsqueda de clientes |
| **Editar registro** | Edición de registros de clientes |
| **Aplicaciones** | Herramientas externas |
| **Clientes** | Gestión completa de clientes |
| **Ventas** | Lista y gestión de ventas |

---

## Búsqueda de Clientes

### Dashboard Principal

La pantalla de búsqueda te permite encontrar clientes rápidamente:

1. Escribe el **teléfono** o **DNI**
2. Haz clic en **Buscar**
3. Los resultados mostrarán toda la información del cliente

Puedes realizar múltiples búsquedas consecutivas.

---

## Edición de Registros

Como coordinador, tienes acceso a **Editar registro**, una función que permite modificar la información de los clientes en la base de datos.

### Acceder a Edición de Registros

1. En el menú lateral, haz clic en **Editar registro**
2. Busca el cliente que deseas editar
3. Modifica los datos necesarios
4. Guarda los cambios

**Nota importante**: A diferencia de editar datos en una venta (que solo afecta a esa venta), editar un registro modifica los datos del cliente para todas las ventas futuras.

---

## Gestión de Ventas

### Ver Lista de Ventas

1. En el menú lateral, haz clic en **Ventas**
2. Verás el listado completo de ventas:

```
┌─────────────────────────────────────────────────────────────────┐
│  Gestión de Ventas                          [+ Nueva Venta]     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Filtros:                                                │    │
│  │ Estado: [Todos ▼]  Comercial: [Todos ▼]  Fecha: [    ] │    │
│  │ DNI: [          ]                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #a1b2c3  │ María López   │ Pendiente   │ 15/01/2024    │    │
│  │          │ 12345678A     │ Juan García │               │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Filtros Avanzados

Como coordinador, puedes filtrar por:

- **Estado**: Pendiente, En Verificación, Verificada, Completada, Cancelada
- **Comercial**: Filtra las ventas de un comercial específico
- **Rango de fechas**: Desde/Hasta
- **DNI del cliente**: Busca ventas de un cliente específico

### Ver Detalle de una Venta

Haz clic en cualquier venta para ver su detalle completo:

- Información general
- Datos del cliente
- Comercial asignado
- Productos
- Grabaciones
- Historial de cambios

---

## Supervisión del Equipo

### Monitorear el Trabajo

Como coordinador, puedes:

1. **Filtrar por comercial**: Ver todas las ventas de cada miembro del equipo
2. **Revisar estados**: Ver cuántas ventas están pendientes vs procesadas
3. **Identificar cuellos de botella**: Detectar ventas atascadas en algún estado

### Seguimiento de Productividad

1. Filtra por comercial específico
2. Establece un rango de fechas
3. Revisa el número de ventas y sus estados

---

## Editar Datos de una Venta

### Editar Cliente en la Venta

1. Abre el detalle de la venta
2. Haz clic en **Editar Cliente**
3. Modifica los campos:
   - Nombre y apellidos
   - DNI
   - Email
   - Fecha de nacimiento
   - Teléfono
   - Cuenta bancaria
   - Dirección de suministro
   - CUPS de luz y gas
4. Haz clic en **Guardar Cambios**

### Editar Comercial

1. En la sección **Comercial**, haz clic en **Editar**
2. Modifica el nombre
3. Guarda

---

## Gestión de Productos

### Añadir Producto

1. En **Productos**, haz clic en **+ Añadir Producto**
2. Busca y selecciona el producto
3. Indica la cantidad

### Editar Producto

1. Haz clic en **Editar** junto al producto
2. Modifica la cantidad
3. Guarda

### Eliminar Producto

1. Haz clic en **Eliminar**
2. Confirma la eliminación

---

## Gestión de Grabaciones

Como coordinador, tienes control total sobre las grabaciones.

### Subir Grabación

1. En **Grabaciones**, haz clic en **+ Subir Grabación**
2. Selecciona el archivo
3. Espera la subida

### Descargar Grabación

1. Haz clic en **Descargar**
2. El archivo se guardará en tu ordenador

### Eliminar Grabación

> **Función exclusiva de coordinadores y administradores**

1. Haz clic en **Eliminar** junto a la grabación
2. Confirma la eliminación

**Nota**: Esta acción no se puede deshacer. Usa esta función solo cuando sea necesario.

---

## Cambiar Estado de Ventas

### Flujo de Estados

```
Pendiente → En Verificación → Verificada → Completada
                                       ↘ Cancelada
```

### Cambiar Estado

1. En el detalle de la venta, ve a **Cambiar Estado**
2. Selecciona el nuevo estado
3. Haz clic en **Guardar Estado**

### Consideraciones

- Los estados **Completada** y **Cancelada** son finales
- Cada cambio queda registrado en el historial
- Puedes ver quién cambió cada estado y cuándo

---

## Gestión de Clientes

### Acceder a Clientes

1. En el menú lateral, haz clic en **Clientes**
2. Podrás buscar y ver información detallada de clientes

### Ver Cliente

- Información personal completa
- Historial de direcciones
- Ventas asociadas

### Crear Cliente

1. Haz clic en **+ Nuevo Cliente**
2. Completa todos los datos
3. Guarda

---

## Crear Ventas

Como coordinador, puedes crear ventas directamente:

1. En **Ventas**, haz clic en **+ Nueva Venta**
2. Busca o crea el cliente
3. Selecciona la dirección de suministro
4. Añade los productos
5. Indica el comercial
6. Crea la venta

---

## Flujo de Trabajo Recomendado

### Al Inicio de la Jornada

1. **Revisar ventas pendientes**: Filtra por estado "Pendiente"
2. **Identificar antigüedad**: Ordena por fecha para ver las más antiguas
3. **Asignar prioridades**: Las ventas más antiguas deben procesarse primero

### Durante el Día

1. **Monitorear el progreso**: Revisa periódicamente el estado de las ventas
2. **Resolver problemas**: Atiende consultas del equipo
3. **Corregir errores**: Edita datos incorrectos cuando sea necesario

### Al Final de la Jornada

1. **Balance del día**: Revisa cuántas ventas se procesaron
2. **Pendientes**: Identifica lo que queda para el día siguiente
3. **Incidencias**: Anota problemas recurrentes

---

## Supervisión Efectiva

### Métricas a Seguir

| Métrica | Qué Indica |
|---------|------------|
| Ventas pendientes | Carga de trabajo por procesar |
| Tiempo en cada estado | Posibles cuellos de botella |
| Ventas por comercial | Productividad individual |
| Ventas canceladas | Posibles problemas de calidad |

### Identificar Problemas

- **Muchas ventas pendientes**: El equipo de verificación puede necesitar apoyo
- **Ventas atascadas**: Pueden requerir información adicional
- **Cancelaciones frecuentes**: Revisar la calidad de las ventas

---

## Resolución de Problemas del Equipo

### Problemas Comunes

**"El comercial no puede crear ventas"**
1. Verifica que tiene acceso al sistema
2. Comprueba que puede buscar clientes
3. Asegúrate de que los productos están activos

**"El verificador no puede cambiar el estado"**
1. Verifica los permisos del usuario
2. Comprueba que el estado actual permite el cambio

**"Datos incorrectos en una venta"**
1. Accede al detalle de la venta
2. Edita los datos del cliente
3. Guarda los cambios

---

## Consejos de Gestión

1. **Comunicación**: Mantén informado al equipo de los cambios
2. **Priorización**: Las ventas más antiguas tienen prioridad
3. **Calidad**: Mejor verificar bien una venta que procesar muchas mal
4. **Documentación**: Usa las grabaciones como respaldo
5. **Seguimiento**: Revisa regularmente las métricas

---

## Problemas Frecuentes

### "No puedo eliminar una grabación"
- Verifica que tienes rol de coordinador
- Actualiza la página si acabas de cambiar de rol

### "Los filtros no funcionan"
- Limpia los filtros y vuelve a aplicarlos
- Verifica que los valores son correctos

### "No veo las ventas de un comercial"
- Asegúrate de que el comercial escribió su nombre correctamente
- Puede haber variaciones en el nombre

---

## Contacto de Soporte

Si tienes problemas técnicos, contacta con:
- El administrador del sistema
- Soporte técnico de la empresa

---

**Recuerda**: Como coordinador, eres el enlace entre el equipo comercial y los verificadores. Tu supervisión es clave para mantener la calidad y eficiencia del proceso.
