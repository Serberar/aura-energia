# ==========================================
# SCRIPT DE CONFIGURACIÓN PARA DESPLIEGUE
# ==========================================
# Este script ayuda a configurar las URLs para diferentes entornos

Write-Host "🚀 CRM Elite Ventas - Configuración de Entorno" -ForegroundColor Green
Write-Host "==============================================`n"

# Detectar el entorno actual
if (Test-Path ".env") {
    $currentApiUrl = (Get-Content ".env" | Where-Object { $_ -match "VITE_API_URL" }) -split "=" | Select-Object -Last 1
    Write-Host "📍 Configuración actual: $currentApiUrl" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  No se encontró archivo .env" -ForegroundColor Yellow
    Write-Host "💡 Copiando desde .env.example..."
    Copy-Item ".env.example" ".env"
}

Write-Host "`n🔧 Selecciona el entorno a configurar:"
Write-Host "1) Desarrollo local (localhost:3001)"
Write-Host "2) Red local (192.168.1.250:3001)"
Write-Host "3) DuckDNS (personalizar)"
Write-Host "4) Dominio personalizado"
Write-Host "5) Mantener configuración actual"

$option = Read-Host "`nOpción (1-5)"

switch ($option) {
    "1" {
        $apiUrl = "http://localhost:3001/api"
        Write-Host "✅ Configurando para desarrollo local..." -ForegroundColor Green
    }
    "2" {
        $apiUrl = "http://192.168.1.250:3001/api"
        Write-Host "✅ Configurando para red local..." -ForegroundColor Green
    }
    "3" {
        $domain = Read-Host "Ingresa tu dominio DuckDNS (sin http://)"
        $apiUrl = "http://$domain:3001/api"
        Write-Host "✅ Configurando para DuckDNS: $apiUrl" -ForegroundColor Green
    }
    "4" {
        $apiUrl = Read-Host "Ingresa la URL completa del backend (con /api)"
        Write-Host "✅ Configurando URL personalizada: $apiUrl" -ForegroundColor Green
    }
    "5" {
        Write-Host "✅ Manteniendo configuración actual" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

# Actualizar el archivo .env
if ($apiUrl) {
    # Crear backup
    Copy-Item ".env" ".env.backup" -Force
    
    # Leer el archivo .env
    $envContent = Get-Content ".env"
    
    # Actualizar la línea VITE_API_URL
    $updatedContent = $envContent | ForEach-Object {
        if ($_ -match "^VITE_API_URL=") {
            "VITE_API_URL=$apiUrl"
        } else {
            $_
        }
    }
    
    # Escribir el archivo actualizado
    $updatedContent | Set-Content ".env"
    
    Write-Host "`n🎉 Configuración actualizada exitosamente!" -ForegroundColor Green
    Write-Host "📄 Archivo .env actualizado con: $apiUrl" -ForegroundColor Cyan
    Write-Host "💾 Backup guardado como .env.backup" -ForegroundColor Cyan
    Write-Host "`n🔄 Para aplicar los cambios:"
    Write-Host "   npm run build  # Para compilar con la nueva configuración" -ForegroundColor Yellow
    Write-Host "   npm run dev    # Para desarrollo" -ForegroundColor Yellow
}

Write-Host "`n✨ ¡Listo para usar!" -ForegroundColor Green