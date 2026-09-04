# ROADMAP DE MEJORAS PARA PRODUCCIÓN
## CRM Elite Ventas

**Fecha:** 15 de enero de 2026
**Prioridad:** Rendimiento > Estabilidad > UX > Código

---

## FASE 1: RENDIMIENTO CRÍTICO (Semana 1)

### 1.1 [BACKEND] Resolver N+1 Queries en Ventas
**Archivo:** `SaleController.ts:104-130`
**Problema:** Cada venta hace una consulta separada (100 ventas = 101 queries)
**Impacto:** Timeouts en listados, servidor lento
**Solución:** Usar `include` en Prisma para cargar relaciones en una sola query

```typescript
// Antes (N+1)
const sales = await repo.list(filters);
const salesWithRelations = await Promise.all(
  sales.map(sale => repo.findWithRelations(sale.id))
);

// Después (1 query)
const sales = await prisma.sale.findMany({
  where: { /* filters */ },
  include: { items: true, status: true, client: true }
});
```

**Estimación:** 2-3 horas

---

### 1.2 [BACKEND] Agregar Índices a Base de Datos
**Archivo:** `prisma/schema.prisma`
**Problema:** Consultas frecuentes sin índices = full table scans
**Impacto:** Lentitud exponencial con más datos

**Índices a agregar:**
```prisma
model Sale {
  @@index([clientId])
  @@index([statusId])
  @@index([comercial])
  @@index([createdAt])
  @@index([createdAt, statusId])  // Compuesto para filtros comunes
}

model Client {
  @@index([dni])
  @@index([createdAt])
}

model SaleItem {
  @@index([saleId])
  @@index([productId])
}
```

**Estimación:** 1 hora + migración

---

### 1.3 [BACKEND] Implementar Paginación Correcta
**Archivos:** `SaleController.ts`, `ClientController.ts`
**Problema:** Endpoints devuelven TODOS los registros
**Impacto:** Memoria del servidor, timeouts, ancho de banda

**Endpoints a paginar:**
- `GET /api/sales` - Actualmente sin límite
- `GET /api/clients` - Búsquedas pueden devolver muchos
- `GET /api/products` - Lista completa cada vez

**Estimación:** 3-4 horas

---

### 1.4 [BACKEND] Agregar Timeout a Prisma
**Archivo:** `prismaClient.ts`
**Problema:** Queries lentas bloquean el servidor
**Solución:**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Middleware de timeout
prisma.$use(async (params, next) => {
  const timeout = 30000; // 30 segundos
  return Promise.race([
    next(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    ),
  ]);
});
```

**Estimación:** 1 hora

---

## FASE 2: RENDIMIENTO FRONTEND (Semana 1-2)

### 2.1 [FRONTEND] Implementar AbortController en Búsquedas
**Archivo:** `useUnifiedSearch.ts`
**Problema:** Race conditions si usuario busca rápido
**Impacto:** Resultados incorrectos mostrados

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const performUnifiedSearch = async (searchTerm: string) => {
  // Cancelar búsqueda anterior
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();

  try {
    const [crmResults, skoreResult] = await Promise.allSettled([
      clientService.searchClient(searchTerm, abortControllerRef.current.signal),
      dispatch(doSearch1Skore(searchTerm))
    ]);
    // ...
  } catch (err) {
    if (err.name === 'AbortError') return; // Ignorar cancelaciones
  }
};
```

**Estimación:** 2 horas

---

### 2.2 [FRONTEND] Agregar Debounce en Búsquedas
**Archivos:** `ClientList.tsx`, `ProductSearchForm.tsx`
**Problema:** Cada keystroke dispara búsqueda
**Impacto:** Muchas requests innecesarias

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (term: string) => searchClient(term),
  300
);
```

**Estimación:** 1-2 horas

---

### 2.3 [FRONTEND] Implementar React.memo en Componentes Pesados
**Archivos:** `ClientForm.tsx`, `SaleForm.tsx`, `ProductSearchForm.tsx`
**Problema:** Re-renders innecesarios en cada cambio de estado padre

```typescript
const ClientForm = React.memo(({ client, onSubmit, ... }) => {
  // ...
});

// Memoizar callbacks
const handleChange = useCallback((field) => (e) => {
  setFormData(prev => ({ ...prev, [field]: e.target.value }));
}, []);
```

**Estimación:** 3-4 horas

---

### 2.4 [FRONTEND] Lazy Loading de Rutas
**Archivo:** `AppRoutes.tsx`
**Problema:** Todo el bundle carga de inicio
**Impacto:** Tiempo de carga inicial alto

```typescript
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const SalesPage = lazy(() => import('../pages/sales/SalesPage'));
const ProductsPage = lazy(() => import('../pages/products/ProductsPage'));
// ...
```

**Estimación:** 2 horas

---

## FASE 3: ESTABILIDAD (Semana 2)

### 3.1 [BACKEND] Implementar Transacciones en Operaciones Críticas
**Archivo:** `CreateSaleWithProductsUseCase.ts`
**Problema:** Si falla a mitad, queda venta incompleta

```typescript
await prisma.$transaction(async (tx) => {
  const sale = await tx.sale.create({ ... });
  for (const item of items) {
    await tx.saleItem.create({ saleId: sale.id, ... });
  }
  return sale;
});
```

**Estimación:** 3-4 horas

---

### 3.2 [FRONTEND] Cleanup de setTimeout/setInterval
**Archivos:** `CrmResults.tsx`, `SkoreResults.tsx`, `EditClientsPage.tsx`
**Problema:** Memory leaks si componente se desmonta

```typescript
useEffect(() => {
  const timer = setTimeout(() => { /* ... */ }, 500);
  return () => clearTimeout(timer);
}, []);
```

**Estimación:** 1-2 horas

---

### 3.3 [BACKEND] Mejorar Manejo de Errores con Tipos
**Archivos:** Controllers varios
**Problema:** Distinguir errores por string es frágil

```typescript
// Antes
if (errorMessage.includes('permiso')) return res.status(403)

// Después
if (error instanceof AuthorizationError) return res.status(403)
if (error instanceof NotFoundError) return res.status(404)
if (error instanceof ValidationError) return res.status(400)
```

**Estimación:** 2-3 horas

---

### 3.4 [BACKEND] Validar Path Traversal en Grabaciones
**Archivo:** `RecordingController.ts:73`
**Problema:** Posible acceso a archivos fuera del directorio

```typescript
const filePath = path.resolve(RECORDS_DIR, recording.storagePath);
if (!filePath.startsWith(path.resolve(RECORDS_DIR))) {
  throw new AuthorizationError('Acceso denegado');
}
```

**Estimación:** 30 minutos

---

## FASE 4: UX Y FEEDBACK (Semana 2-3)

### 4.1 [FRONTEND] Mostrar Errores al Usuario (no solo console)
**Archivos:** `SalesPage.tsx`, `ClientList.tsx`, varios
**Problema:** Errores solo en console, usuario no sabe qué pasó

```typescript
const [error, setError] = useState<string | null>(null);

try {
  await create(payload);
} catch (err) {
  setError('Error al crear venta. Inténtalo de nuevo.');
}

// En JSX
{error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
```

**Estimación:** 3-4 horas

---

### 4.2 [FRONTEND] Loading States Consistentes
**Archivos:** `DashboardPage.tsx`, botones de acción
**Problema:** Usuario no sabe si algo está cargando

```typescript
<Button
  disabled={isLoading}
  isLoading={isLoading}
  loadingText="Buscando..."
>
  Buscar
</Button>
```

**Estimación:** 2-3 horas

---

### 4.3 [FRONTEND] Reemplazar alert() con Componentes
**Archivos:** `CrmResults.tsx`, `SkoreResults.tsx`
**Problema:** alert() bloquea UI y es feo

```typescript
// Usar toast o modal del design system
import { useToast } from '@/design-system';

const { showSuccess, showError } = useToast();
showSuccess('Cliente creado correctamente');
showError('Error: ' + message);
```

**Estimación:** 2-3 horas

---

## FASE 5: LIMPIEZA DE CÓDIGO (Semana 3+)

### 5.1 [BACKEND] Eliminar console.error, usar logger
**Archivos:** Controllers varios
```typescript
// Antes
console.error('Error:', error);

// Después
logger.error('Error en operación', { error, context });
```

**Estimación:** 1-2 horas

---

### 5.2 [FRONTEND] Eliminar console.log en producción
**Archivos:** Múltiples
**Solución:** Configurar ESLint + build para eliminar en prod

```typescript
// vite.config.ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  }
}
```

**Estimación:** 30 minutos

---

### 5.3 [BACKEND] Sanitizar Logs de Tokens
**Archivo:** `UserController.ts:173-178`
**Problema:** Headers con tokens se loguean

```typescript
const sanitizedHeaders = { ...req.headers };
delete sanitizedHeaders.authorization;
delete sanitizedHeaders.cookie;
logger.debug('Request', { headers: sanitizedHeaders });
```

**Estimación:** 1 hora

---

### 5.4 [CÓDIGO] Eliminar "as any" Progresivamente
**Archivos:** `ClientForm.tsx`, `ProductForm.tsx`, etc.
**Estimación:** 2-3 horas (puede ser gradual)

---

## FASE 6: CACHING (Semana 3+)

### 6.1 [BACKEND] Cache para Datos Estáticos
**Datos a cachear:**
- Lista de estados de venta (cambia poco)
- Lista de productos activos
- Lista de usuarios

```typescript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 }); // 5 min

async function getSaleStatuses() {
  const cached = cache.get('saleStatuses');
  if (cached) return cached;

  const statuses = await repo.findAll();
  cache.set('saleStatuses', statuses);
  return statuses;
}
```

**Estimación:** 3-4 horas

---

## RESUMEN POR PRIORIDAD

| Fase | Enfoque | Tiempo Est. | Impacto |
|------|---------|-------------|---------|
| 1 | Rendimiento Backend | 7-9 horas | 🔴 CRÍTICO |
| 2 | Rendimiento Frontend | 8-10 horas | 🔴 ALTO |
| 3 | Estabilidad | 7-10 horas | 🟠 ALTO |
| 4 | UX/Feedback | 7-10 horas | 🟡 MEDIO |
| 5 | Limpieza código | 5-7 horas | 🟢 BAJO |
| 6 | Caching | 3-4 horas | 🟡 MEDIO |

**Total estimado:** ~40-50 horas de trabajo

---

## ORDEN DE EJECUCIÓN RECOMENDADO

### Día 1-2:
- [x] 1.1 Resolver N+1 Queries ✅
- [x] 1.2 Agregar Índices BD ✅
- [x] 1.3 Paginación ✅

### Día 3-4:
- [x] 1.4 Timeout Prisma ✅
- [x] 2.1 AbortController ✅
- [x] 2.2 Debounce búsquedas ✅ (No necesario - búsquedas por botón/Enter)

### Día 5-6:
- [x] 2.3 React.memo ✅ (Ya implementado en ProductCard y otros)
- [x] 2.4 Lazy loading ✅ (Ya implementado con React.lazy)
- [x] 3.1 Transacciones ✅

### Día 7-8:
- [x] 3.2 Cleanup timeouts ✅
- [x] 3.3 Manejo errores tipos ✅ (Ya existe sistema AppError)
- [x] 3.4 Path traversal ✅

### Día 9-10:
- [x] 4.1 Mostrar errores UI ✅ (Implementado sistema Toast en design-system)
- [x] 4.2 Loading states ✅ (Botones con isLoading en DashboardPage, CrmResults, SkoreResults, SalesList)
- [x] 4.3 Reemplazar alert() ✅ (Todos los alert() reemplazados por useToast)

### Día 11 (16 de enero 2026):
- [x] 5.1 Eliminar console.error backend ✅ (Ya estaba usando logger)
- [x] 5.2 Eliminar console.log producción ✅ (Ya configurado en vite.config.ts con esbuild.drop)
- [x] 5.3 Sanitizar logs tokens ✅ (Ya implementado en UserController logout)
- [x] 5.4 Eliminar 'as any' ✅ (Corregidos 5 usos en ProductForm, ClientForm, CrmResults, saleService)
- [x] 6.1 Caching datos estáticos ✅ (Implementado CacheService en backend para SaleStatus, Products, Users)

### Día 11 (Mejora arquitectónica) - 16 de enero 2026:
- [x] 7.1 Migrar use cases a excepciones tipadas ✅ (NotFoundError, AuthorizationError, ValidationError, DatabaseError)
  - Migrados: CreateSaleWithProductsUseCase, ChangeSaleStatusUseCase, GetProductUseCase, UpdateProductUseCase, ToggleProductActiveUseCase
  - Migrados: UpdateClientUseCase, PushDataClientUseCase, DeleteSaleStatusUseCase
  - Migrados: UploadRecordingUseCase, DeleteRecordingUseCase, DownloadRecordingUseCase, ListRecordingsUseCase
  - Migrados: UpdateClientSnapshotUseCase, RefreshTokenUseCase, LoginUserUseCase
- [x] 7.2 Simplificar controladores para propagar errores al middleware centralizado ✅
  - ProductController: Simplificado (de ~165 líneas a ~100 líneas)
  - SaleStatusController: Simplificado (de ~110 líneas a ~70 líneas)
  - SaleController: Simplificado (de ~410 líneas a ~250 líneas) + helper formatSaleResponse

---

## NOTAS

- **Excluido:** Rate limiting (comerciales rápidos), contraseña fuerte (errores al escribir), 1Skore SSL
- **Prioridad absoluta:** Rendimiento de base de datos (N+1, índices, paginación)
- **Quick wins:** Índices y timeout se pueden hacer rápido con alto impacto

## MEJORA COMPLETADA: Excepciones Tipadas ✅

**Problema resuelto:** Los use cases ahora lanzan excepciones tipadas y los controladores propagan errores al middleware.

**Implementación:**
1. ✅ Use cases lanzan excepciones tipadas: `NotFoundError`, `AuthorizationError`, `ValidationError`, `DatabaseError`, `AuthenticationError`
2. ✅ Controladores propagan errores: `catch (error) { next(error) }`
3. ✅ Middleware centralizado (`errorHandler.ts`) maneja todos los errores consistentemente

**Beneficios logrados:**
- Código ~40% más limpio en controladores
- Respuestas de error consistentes y tipadas
- Mejor mantenibilidad a largo plazo
- Sistema de cache implementado para datos estáticos

---

## 🎉 ROADMAP COMPLETADO

Todas las fases del roadmap han sido implementadas:
- ✅ Fase 1: Rendimiento Backend (N+1, índices, paginación, timeout)
- ✅ Fase 2: Rendimiento Frontend (AbortController, React.memo, lazy loading)
- ✅ Fase 3: Estabilidad (transacciones, cleanup, manejo errores, path traversal)
- ✅ Fase 4: UX/Feedback (Toast system, loading states, reemplazo alert())
- ✅ Fase 5: Limpieza código (logger, console.log, sanitización, eliminación 'as any')
- ✅ Fase 6: Caching (CacheService para datos estáticos)
- ✅ Fase 7: Mejoras arquitectónicas (excepciones tipadas, simplificación controladores)
