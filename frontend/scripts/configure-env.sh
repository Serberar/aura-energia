#!/bin/bash

# ==========================================
# SCRIPT DE CONFIGURACIÓN PARA DESPLIEGUE
# ==========================================
# Este script ayuda a configurar las URLs para diferentes entornos

echo "🚀 CRM Elite Ventas - Configuración de Entorno"
echo "=============================================="
echo ""

# Detectar el entorno actual
if [ -f ".env" ]; then
    CURRENT_API_URL=$(grep "VITE_API_URL" .env | cut -d '=' -f2)
    echo "📍 Configuración actual: $CURRENT_API_URL"
else
    echo "⚠️  No se encontró archivo .env"
    echo "💡 Copiando desde .env.example..."
    cp .env.example .env
fi

echo ""
echo "🔧 Selecciona el entorno a configurar:"
echo "1) Desarrollo local (localhost:3001)"
echo "2) Red local (192.168.1.250:3001)"
echo "3) DuckDNS (personalizar)"
echo "4) Dominio personalizado"
echo "5) Mantener configuración actual"

read -p "Opción (1-5): " option

case $option in
    1)
        API_URL="http://localhost:3001/api"
        echo "✅ Configurando para desarrollo local..."
        ;;
    2)
        API_URL="http://192.168.1.250:3001/api"
        echo "✅ Configurando para red local..."
        ;;
    3)
        read -p "Ingresa tu dominio DuckDNS (sin http://): " domain
        API_URL="http://$domain:3001/api"
        echo "✅ Configurando para DuckDNS: $API_URL"
        ;;
    4)
        read -p "Ingresa la URL completa del backend (con /api): " custom_url
        API_URL="$custom_url"
        echo "✅ Configurando URL personalizada: $API_URL"
        ;;
    5)
        echo "✅ Manteniendo configuración actual"
        exit 0
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

# Actualizar el archivo .env
if [ "$API_URL" != "" ]; then
    # Crear backup
    cp .env .env.backup
    
    # Actualizar la línea VITE_API_URL
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=$API_URL|" .env
    
    echo ""
    echo "🎉 Configuración actualizada exitosamente!"
    echo "📄 Archivo .env actualizado con: $API_URL"
    echo "💾 Backup guardado como .env.backup"
    echo ""
    echo "🔄 Para aplicar los cambios:"
    echo "   npm run build  # Para compilar con la nueva configuración"
    echo "   npm run dev    # Para desarrollo"
fi

echo ""
echo "✨ ¡Listo para usar!"