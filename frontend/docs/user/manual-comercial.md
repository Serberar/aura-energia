# Manual de Usuario - Rol Comercial

## Introducción

Este manual te guiará en el uso del sistema CRM para registrar ventas de forma rápida y eficiente.

Como comercial, tu trabajo principal es:
- Buscar información de clientes
- Registrar nuevas ventas
- Acceder a aplicaciones de apoyo

---

## Acceso al Sistema

### Iniciar Sesión

1. Abre tu navegador web
2. Ingresa la dirección del sistema proporcionada por tu supervisor
3. Verás la pantalla de inicio de sesión:

```
┌────────────────────────────────┐
│       [Elite de ventas]        │
│                                │
│         Bienvenido             │
│                                │
│  ┌──────────────────────────┐  │
│  │ Usuario                  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Contraseña               │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │    Iniciar sesión        │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

4. Ingresa tu **usuario** y **contraseña**
5. Haz clic en **Iniciar sesión**

### Cerrar Sesión

1. En la esquina superior derecha, haz clic en tu nombre de usuario
2. Selecciona **Cerrar sesión**

---

## Pantalla Principal - Búsqueda de Clientes

Al iniciar sesión, llegarás al **Dashboard de Búsqueda**. Esta es tu herramienta principal para encontrar información de clientes.

### Buscar un Cliente

1. En el campo de búsqueda, escribe:
   - **Número de teléfono** (ej: 666123456)
   - **DNI/NIF** (ej: 12345678A)

2. Haz clic en **Buscar** o presiona **Enter**

3. Los resultados aparecerán debajo:

```
┌─────────────────────────────────────────────┐
│  Búsqueda de Clientes                       │
│                                             │
│  ┌───────────────────────────┐ ┌─────────┐  │
│  │ 666123456                 │ │ Buscar  │  │
│  └───────────────────────────┘ └─────────┘  │
│                                             │
│  ═══════════════════════════════════════    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ María López García                  │    │
│  │ DNI: 12345678A                      │    │
│  │ Tel: 666123456, 912345678           │    │
│  │ Email: maria@email.com              │    │
│  │                                     │    │
│  │ Direcciones:                        │    │
│  │ • Calle Principal 123, Madrid       │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Buscar Múltiples Clientes

Puedes realizar varias búsquedas seguidas. Los resultados se acumulan en la pantalla para que puedas compararlos.

Para limpiar todos los resultados, haz clic en **Limpiar**.

---

## Crear una Nueva Venta

Como comercial, tu función principal es registrar ventas. Sigue estos pasos:

### Paso 1: Acceder al Formulario de Venta

1. En el menú lateral, haz clic en **Ventas**
2. Se abrirá directamente el formulario de **Nueva Venta**

### Paso 2: Buscar o Crear el Cliente

En la sección **Datos del Cliente**:

```
┌─────────────────────────────────────────────┐
│  Datos del Cliente                          │
│                                             │
│  Buscar cliente por teléfono o DNI:         │
│  ┌───────────────────────────┐ ┌─────────┐  │
│  │                           │ │ Buscar  │  │
│  └───────────────────────────┘ └─────────┘  │
└─────────────────────────────────────────────┘
```

**Si el cliente existe:**
1. Escribe el teléfono o DNI del cliente
2. Haz clic en **Buscar**
3. Los datos se cargarán automáticamente
4. Puedes modificar los datos si es necesario

**Si el cliente es nuevo:**
1. Completa manualmente todos los campos:
   - Nombre
   - Apellidos
   - DNI
   - Email
   - Fecha de nacimiento
   - Teléfono
   - Cuenta bancaria (si aplica)

### Paso 3: Seleccionar Dirección de Suministro

Si el cliente tiene varias direcciones, selecciona la correcta:

```
┌─────────────────────────────────────────────┐
│  Dirección de Suministro                    │
│                                             │
│  ○ Calle Principal 123, Madrid              │
│    CUPS Luz: ES0021...                      │
│                                             │
│  ● Avenida Secundaria 45, Barcelona         │
│    CUPS Luz: ES0022...                      │
│    CUPS Gas: ES0033...                      │
└─────────────────────────────────────────────┘
```

También puedes editar los datos de la dirección:
- Dirección completa
- CUPS de Luz
- CUPS de Gas

### Paso 4: Añadir Productos

En la sección **Productos**:

1. Busca el producto escribiendo su nombre
2. Selecciona el producto de la lista
3. Indica la cantidad
4. El producto se añadirá a la lista

```
┌─────────────────────────────────────────────┐
│  Productos                                  │
│                                             │
│  Buscar producto:                           │
│  ┌───────────────────────────┐              │
│  │ Tarifa luz                │              │
│  └───────────────────────────┘              │
│                                             │
│  Productos seleccionados:                   │
│  ┌─────────────────────────────────────┐    │
│  │ Tarifa Luz Básica        x1         │    │
│  │ Tarifa Gas Hogar         x1         │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Paso 5: Indicar tu Nombre (Comercial)

En el campo **Comercial**, escribe tu nombre completo. Esto es importante para el seguimiento de las ventas.

```
┌─────────────────────────────────────────────┐
│  Comercial                                  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Juan García Pérez                     │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Paso 6: Revisar y Confirmar

Antes de crear la venta, revisa el **Resumen**:

```
┌─────────────────────────────────────────────┐
│  Resumen de la Venta                        │
│                                             │
│  Cliente: María López García                │
│  Dirección: Avenida Secundaria 45, BCN      │
│                                             │
│  Pedido:                                    │
│  • Tarifa Luz Básica - 1 unidad             │
│  • Tarifa Gas Hogar - 1 unidad              │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │           CREAR VENTA                 │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

Si todo es correcto, haz clic en **Crear Venta**.

### Paso 7: Venta Creada

Al crear la venta exitosamente:
- Se mostrará un mensaje de confirmación
- El formulario se limpiará automáticamente
- Podrás comenzar a registrar la siguiente venta

---

## Aplicaciones Externas

En el menú lateral, encontrarás la sección **Aplicaciones**. Aquí tendrás acceso a herramientas externas que tu empresa utiliza.

Haz clic en cualquier aplicación para abrirla en una nueva pestaña.

---

## Menú de Navegación

Como comercial, tienes acceso a:

| Opción | Descripción |
|--------|-------------|
| **Buscar registro** | Dashboard de búsqueda de clientes |
| **Aplicaciones** | Herramientas externas |
| **Ventas** | Formulario de creación de ventas |

---

## Consejos para Trabajar Más Rápido

1. **Usa el teclado**: Presiona Enter después de escribir en el buscador para buscar más rápido

2. **Datos correctos**: Asegúrate de que los datos del cliente son correctos antes de crear la venta

3. **CUPS importante**: Si el cliente ya tiene CUPS de luz o gas, asegúrate de seleccionar la dirección correcta

4. **Tu nombre siempre**: No olvides poner tu nombre en el campo Comercial

5. **Verifica antes de enviar**: Revisa el resumen antes de crear la venta

---

## Problemas Frecuentes

### "No puedo iniciar sesión"
- Verifica que tu usuario y contraseña son correctos
- Comprueba que no tienes activado el bloqueo de mayúsculas
- Si continúa el problema, contacta con tu supervisor

### "No encuentro al cliente"
- Intenta buscar con otro dato (teléfono vs DNI)
- Verifica que el número o DNI están escritos correctamente
- Si el cliente es nuevo, completa los datos manualmente

### "El producto no aparece"
- Escribe el nombre del producto con al menos 3 caracteres
- Si no aparece, puede que el producto no esté activo
- Contacta con tu supervisor

### "Error al crear la venta"
- Revisa que todos los campos obligatorios estén completos
- Verifica que hay al menos un producto añadido
- Comprueba tu conexión a internet

---

## Contacto de Soporte

Si tienes problemas que no puedes resolver, contacta con:
- Tu supervisor directo
- El coordinador de tu equipo

---

**Recuerda**: Tu trabajo es fundamental para el éxito del equipo. Cada venta bien registrada facilita el trabajo de verificación y entrega.
