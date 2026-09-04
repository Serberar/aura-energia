# Sistema de Estilos

## Visión General

La aplicación utiliza **SCSS Modules** para los estilos, lo que proporciona encapsulamiento de CSS por componente y evita conflictos de nombres de clases.

---

## SCSS Modules

Cada componente tiene su archivo de estilos correspondiente:

```
components/
├── SaleForm.tsx
├── SaleForm.module.scss
├── SaleDetail.tsx
└── SaleDetail.module.scss
```

### Uso Básico

```tsx
// SaleForm.tsx
import styles from './SaleForm.module.scss';

const SaleForm = () => {
  return (
    <form className={styles.form}>
      <h2 className={styles.title}>Nueva Venta</h2>
      <div className={styles.section}>
        {/* contenido */}
      </div>
      <button className={styles.submitButton}>Guardar</button>
    </form>
  );
};
```

```scss
// SaleForm.module.scss
.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.section {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
}

.submitButton {
  background: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}
```

---

## Clases Condicionales

### Usando template literals

```tsx
<button className={`${styles.button} ${isActive ? styles.active : ''}`}>
  Click
</button>
```

### Usando array join

```tsx
<div className={[styles.card, loading && styles.loading].filter(Boolean).join(' ')}>
  Contenido
</div>
```

### Múltiples clases

```tsx
<div className={`${styles.section} ${styles.highlighted} ${styles.large}`}>
  Contenido
</div>
```

---

## Estructura de Archivos SCSS

### Variables Globales

```scss
// src/styles/_variables.scss
$primary-color: #007bff;
$secondary-color: #6c757d;
$success-color: #28a745;
$danger-color: #dc3545;
$warning-color: #ffc107;

$font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

$border-radius: 4px;
$border-radius-lg: 8px;

$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;
$spacing-xl: 2rem;

$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
```

### Mixins

```scss
// src/styles/_mixins.scss

// Flexbox center
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// Flexbox between
@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// Truncate text
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Card style
@mixin card {
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  padding: $spacing-lg;
}

// Button base
@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

### Breakpoints

```scss
// src/styles/_breakpoints.scss

$breakpoints: (
  'sm': 576px,
  'md': 768px,
  'lg': 992px,
  'xl': 1200px,
);

@mixin respond-to($breakpoint) {
  $value: map-get($breakpoints, $breakpoint);
  @media (min-width: $value) {
    @content;
  }
}

@mixin respond-below($breakpoint) {
  $value: map-get($breakpoints, $breakpoint);
  @media (max-width: #{$value - 1}) {
    @content;
  }
}
```

---

## Patrones de Estilos

### Página

```scss
// *Page.module.scss
.page {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  @include flex-between;
  margin-bottom: $spacing-lg;
}

.title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
}

.content {
  @include card;
}
```

### Formulario

```scss
// *Form.module.scss
.form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.label {
  font-weight: 500;
  color: #555;
}

.input {
  padding: $spacing-sm $spacing-md;
  border: 1px solid #ddd;
  border-radius: $border-radius;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }

  &.error {
    border-color: $danger-color;
  }
}

.errorText {
  color: $danger-color;
  font-size: 0.875rem;
}

.actions {
  @include flex-between;
  margin-top: $spacing-lg;
}
```

### Lista

```scss
// *List.module.scss
.list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.item {
  @include card;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}

.emptyState {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl;
  color: #888;
}
```

### Tarjeta

```scss
// *Card.module.scss
.card {
  @include card;
}

.cardHeader {
  @include flex-between;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid #eee;
  margin-bottom: $spacing-md;
}

.cardTitle {
  font-size: 1.125rem;
  font-weight: 600;
}

.cardBody {
  // contenido principal
}

.cardFooter {
  @include flex-between;
  padding-top: $spacing-md;
  border-top: 1px solid #eee;
  margin-top: $spacing-md;
}
```

---

## Responsive Design

### Mobile First

```scss
.container {
  padding: $spacing-md;

  @include respond-to('md') {
    padding: $spacing-lg;
  }

  @include respond-to('lg') {
    padding: $spacing-xl;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Grid Responsive

```scss
.grid {
  display: grid;
  gap: $spacing-md;
  grid-template-columns: 1fr;

  @include respond-to('md') {
    grid-template-columns: repeat(2, 1fr);
  }

  @include respond-to('lg') {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Ocultar/Mostrar

```scss
.mobileOnly {
  display: block;

  @include respond-to('md') {
    display: none;
  }
}

.desktopOnly {
  display: none;

  @include respond-to('md') {
    display: block;
  }
}
```

---

## Temas y Colores

### Variables CSS

```scss
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;

  --color-text: #333;
  --color-text-light: #666;
  --color-text-muted: #999;

  --color-bg: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-border: #dee2e6;
}
```

### Uso de Variables CSS

```scss
.button {
  background: var(--color-primary);
  color: white;

  &:hover {
    filter: brightness(0.9);
  }
}

.text {
  color: var(--color-text);
}

.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}
```

---

## Componentes de Estado

### Loading

```scss
.loading {
  @include flex-center;
  min-height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Error

```scss
.error {
  background: rgba($danger-color, 0.1);
  border: 1px solid $danger-color;
  border-radius: $border-radius;
  padding: $spacing-md;
  color: $danger-color;
}
```

### Success

```scss
.success {
  background: rgba($success-color, 0.1);
  border: 1px solid $success-color;
  border-radius: $border-radius;
  padding: $spacing-md;
  color: darken($success-color, 10%);
}
```

---

## Badges de Estado

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badgePending {
  background: #fff3cd;
  color: #856404;
}

.badgeVerified {
  background: #d4edda;
  color: #155724;
}

.badgeCompleted {
  background: #cce5ff;
  color: #004085;
}

.badgeCancelled {
  background: #f8d7da;
  color: #721c24;
}
```

---

## Buenas Prácticas

1. **Un archivo SCSS por componente**
2. **Usar SCSS modules** para encapsulamiento
3. **Importar variables y mixins** donde sea necesario
4. **Mobile first** para responsive design
5. **Nombres de clase descriptivos** en camelCase
6. **Evitar anidamiento profundo** (máx. 3 niveles)
7. **Usar variables** para colores, espaciados, etc.
8. **Crear mixins** para patrones repetidos
