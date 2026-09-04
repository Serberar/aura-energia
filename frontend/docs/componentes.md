# Catálogo de Componentes

## Visión General

Este documento describe los componentes principales de la aplicación, organizados por categoría.

---

## Design System

Componentes base reutilizables en toda la aplicación.

### Button

Botón con diferentes variantes y tamaños.

```tsx
import Button from '@/design-system/components/Button';

// Uso
<Button variant="primary" size="md" onClick={handleClick}>
  Guardar
</Button>

<Button variant="secondary" size="sm" disabled>
  Cancelar
</Button>
```

**Props**:
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Estilo visual |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño |
| disabled | `boolean` | `false` | Deshabilitar |
| onClick | `() => void` | - | Handler de click |
| type | `'button' \| 'submit'` | `'button'` | Tipo HTML |

---

### Input

Campo de entrada de texto.

```tsx
import Input from '@/design-system/components/Input';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="usuario@email.com"
  error="Email inválido"
  fullWidth
/>
```

**Props**:
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| label | `string` | - | Etiqueta del campo |
| type | `string` | `'text'` | Tipo de input |
| value | `string` | - | Valor controlado |
| onChange | `(e) => void` | - | Handler de cambio |
| placeholder | `string` | - | Placeholder |
| error | `string` | - | Mensaje de error |
| fullWidth | `boolean` | `false` | Ancho completo |
| disabled | `boolean` | `false` | Deshabilitar |

---

## Componentes de Carga

### Spinner

Indicador de carga.

```tsx
import { Spinner } from '@/components/LoadingComponents';

<Spinner size="small" />
<Spinner size="medium" />
<Spinner size="large" />
```

### LoadingButton

Botón con estado de carga.

```tsx
import { LoadingButton } from '@/components/LoadingComponents';

<LoadingButton
  isLoading={loading}
  loadingText="Guardando..."
  onClick={handleSave}
>
  Guardar
</LoadingButton>
```

### ErrorMessage

Mensaje de error con opción de cerrar.

```tsx
import { ErrorMessage } from '@/components/LoadingComponents';

<ErrorMessage
  message="Ocurrió un error al guardar"
  onDismiss={() => setError(null)}
/>
```

---

## Feature: Sales (Ventas)

### SalesList

Lista de ventas con opciones de filtrado.

```tsx
import { SalesList } from '@/features/sales';

<SalesList
  onViewSale={(sale) => navigate(`/sales/${sale.id}`)}
  showFilters={true}
/>
```

**Props**:
| Prop | Tipo | Descripción |
|------|------|-------------|
| onViewSale | `(sale: Sale) => void` | Callback al seleccionar una venta |
| showFilters | `boolean` | Mostrar panel de filtros |

---

### SaleDetail

Detalle completo de una venta con todas sus secciones.

```tsx
import { SaleDetail } from '@/features/sales';

<SaleDetail
  saleId="uuid-de-la-venta"
  onClose={() => navigate('/sales')}
  readonly={false}
/>
```

**Secciones incluidas**:
- Información general (ID, fechas, estado)
- Datos del cliente (editable)
- Comercial asignado
- Productos de la venta (gestión de items)
- Grabaciones (subida y descarga)
- Cambio de estado

---

### SaleForm

Formulario para crear una nueva venta.

```tsx
import { SaleForm } from '@/features/sales';

<SaleForm
  onSubmit={async (payload) => await createSale(payload)}
  onCancel={() => navigate(-1)}
  loading={isCreating}
  error={errorMessage}
/>
```

**Componentes internos**:
- `ClientSearchForm`: Búsqueda y edición de cliente
- `ProductSearchForm`: Selección de productos
- Campo de comercial
- Resumen de la venta

---

### SaleCard

Tarjeta compacta de una venta para listas.

```tsx
import { SaleCard } from '@/features/sales';

<SaleCard
  sale={saleData}
  onClick={() => handleViewSale(saleData)}
/>
```

---

### SaleFilters

Panel de filtros para las ventas.

```tsx
import { SaleFilters } from '@/features/sales';

<SaleFilters
  onFilterChange={(filters) => loadSales(filters)}
  statuses={availableStatuses}
  comerciales={comercialesList}
/>
```

**Filtros disponibles**:
- Estado de la venta
- Comercial
- Rango de fechas
- DNI del cliente

---

### SaleItemsManager

Gestión de productos en una venta.

```tsx
import { SaleItemsManager } from '@/features/sales';

<SaleItemsManager
  items={sale.items}
  readonly={false}
  loading={updating}
  onAddItem={async (item) => await addItem(item)}
  onUpdateItem={async (itemId, data) => await updateItem(itemId, data)}
  onRemoveItem={async (itemId) => await removeItem(itemId)}
/>
```

---

### SaleStatusChanger

Selector para cambiar el estado de una venta.

```tsx
import { SaleStatusChanger } from '@/features/sales';

<SaleStatusChanger
  sale={currentSale}
  availableStatuses={statuses}
  onChangeStatus={async (statusId) => await changeStatus(statusId)}
/>
```

---

### SaleRecordings

Gestión de grabaciones de una venta.

```tsx
import SaleRecordings from '@/features/sales/components/SaleRecordings';

<SaleRecordings
  saleId="uuid-de-la-venta"
  readonly={false}
/>
```

**Funcionalidades**:
- Subir grabaciones (audio/video)
- Listar grabaciones existentes
- Descargar grabaciones
- Eliminar grabaciones

---

### ClientSearchForm

Formulario de búsqueda y edición de cliente para ventas.

```tsx
import ClientSearchForm from '@/features/sales/components/ClientSearchForm';

<ClientSearchForm
  onClientSelected={(clientData) => setSelectedClient(clientData)}
  initialData={existingClientData}
/>
```

**Funcionalidades**:
- Búsqueda por teléfono o DNI
- Autocompletado de datos
- Edición de datos del cliente
- Selección de dirección de suministro

---

### ProductSearchForm

Selector de productos para una venta.

```tsx
import ProductSearchForm from '@/features/sales/components/ProductSearchForm';

<ProductSearchForm
  onProductsSelected={(items) => setSelectedProducts(items)}
  initialItems={existingItems}
/>
```

---

## Feature: SaleStatus

### SaleStatusBadge

Badge visual del estado de una venta.

```tsx
import { SaleStatusBadge } from '@/features/saleStatus';

<SaleStatusBadge
  name="Verificada"
  color="#4CAF50"
  isFinal={false}
  size="md"
/>
```

---

## Feature: Clientes

### UnifiedSearchResults

Muestra resultados de búsqueda de clientes.

```tsx
import { UnifiedSearchResults } from '@/features/clientes/components';

<UnifiedSearchResults
  results={searchResults}
  onRemoveResult={(index) => removeResult(index)}
/>
```

---

## Layouts

### Layout

Layout principal con navegación.

```tsx
import Layout from '@/layouts/Layout';

<Layout>
  <PageContent />
</Layout>
```

**Incluye**:
- Header con logo y usuario
- Menú de navegación lateral
- Área de contenido principal
- Footer (opcional)

---

## Páginas

### LoginPage

Página de inicio de sesión.

**Ruta**: `/login`

**Características**:
- Formulario de usuario/contraseña
- Validación de campos
- Manejo de errores
- Redirección post-login

---

### DashboardPage

Página principal de búsqueda de clientes.

**Ruta**: `/dashboard`

**Características**:
- Buscador unificado (teléfono/DNI)
- Resultados acumulativos
- Acciones rápidas sobre resultados

---

### SalesPage

Página de gestión de ventas.

**Ruta**: `/sales` y `/sales/:saleId`

**Modos**:
- Lista de ventas (admin, coordinador, verificador)
- Detalle de venta
- Creación de venta (formulario)

**Comportamiento especial**:
- El rol "comercial" ve directamente el formulario de creación

---

### ProductsPage

Página de gestión de productos.

**Ruta**: `/products`

**Permisos**: Solo administrador

**Funcionalidades**:
- Listar productos
- Crear producto
- Editar producto
- Activar/desactivar producto

---

### SaleStatusPage

Página de gestión de estados de venta.

**Ruta**: `/sale-status`

**Permisos**: Solo administrador

**Funcionalidades**:
- Ver estados ordenados
- Crear nuevo estado
- Editar estado existente
- Reordenar estados (drag & drop)
- Eliminar estado

---

### CrmDashboardPage

Dashboard con estadísticas del CRM.

**Ruta**: `/crm`

**Permisos**: Solo administrador

**Incluye**:
- Total de ventas
- Ventas por estado
- Ventas del mes/semana
- Gráficos (opcional)

---

### UnauthorizedPage

Página de acceso denegado.

**Ruta**: `/unauthorized`

**Muestra cuando**: El usuario intenta acceder a una ruta sin permisos.
