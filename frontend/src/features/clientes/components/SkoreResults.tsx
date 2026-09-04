import React, { useState } from 'react';
import type { SkoreResult } from '../hooks/useUnifiedSearch';
import type { CreateClientData } from '@/types/sales';
import { clientService } from '../services/clientService';
import { Button, useToast } from '@/design-system';
import styles from './SearchResults.module.scss';

// Tipo para crear cliente basado en CreateClientData
type CreateClientRequest = CreateClientData;

// Funciones de validación
const isValidIBAN = (iban: string): boolean => {
  if (!iban || iban === '') return true; // Opcional
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}[A-Z0-9]{1,9}$/i.test(iban);
};

interface SkoreResultsProps {
  results: SkoreResult[];
  searchTerm: string;
}

export const SkoreResults: React.FC<SkoreResultsProps> = ({
  results,
  searchTerm
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [formData, setFormData] = useState<{[key: string]: {phone: string, address: string, cupsGas: string, cupsLuz: string, bankAccount: string, comment: string}}>({});
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const updateFormData = (resultIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [resultIndex]: {
        ...prev[resultIndex] || {phone: '', address: '', cupsGas: '', cupsLuz: '', bankAccount: '', comment: ''},
        [field]: value
      }
    }));
  };

  const handleSaveData = async (result: SkoreResult, index: number) => {
    const data = formData[index];

    // Validaciones de datos del formulario
    if (data?.phone && data.phone.length < 9) {
      showWarning('El teléfono debe tener mínimo 9 dígitos');
      return;
    }

    if (data?.bankAccount && !isValidIBAN(data.bankAccount)) {
      showWarning('IBAN debe tener formato válido (ej: ES1234567890123456789012)');
      return;
    }
    
    // Crear el cliente con los datos base de Skore
    const clientData: CreateClientRequest = {
      firstName: result.nombre || 'Sin nombre',
      lastName: result.apellidos || 'Sin apellidos',
      dni: result.documento || '',
      email: result.emails && result.emails.length > 0 ? result.emails[0] : '',
      birthday: result.fecha_nacimiento || '',
      authorized: '', // String vacío en lugar de boolean
      businessName: result.cnae || '', // businessName en lugar de business
    };

    // Inicializar arrays
    const phones: string[] = [];
    const addresses: { address: string; cupsGas: string; cupsLuz: string }[] = [];
    const bankAccounts: string[] = [];
    const comments: string[] = [];

    // Añadir teléfonos de Skore (filtrar solo teléfonos válidos)
    if (result.telefonos && result.telefonos.length > 0) {
      const validPhones = result.telefonos.filter(phone => phone && phone.length >= 9);
      phones.push(...validPhones);
    } else if (result.telefono && result.telefono.length >= 9) {
      phones.push(result.telefono);
    }

    // Si no hay teléfonos válidos de Skore, usar el del formulario
    if (phones.length === 0 && data?.phone && data.phone.length >= 9) {
      phones.push(data.phone);
    } else if (data?.phone && data.phone.length >= 9) {
      phones.push(data.phone);
    }

    // Añadir dirección de Skore si existe
    if (result.dir_direccion) {
      addresses.push({
        address: `${result.dir_direccion}, ${result.dir_cp} ${result.dir_municipio}, ${result.dir_provincia}`,
        cupsGas: '',
        cupsLuz: ''
      });
    }

    // Añadir datos adicionales del formulario (ya validados)
    if (data?.address) {
      addresses.push({
        address: data.address,
        cupsGas: data.cupsGas || '',
        cupsLuz: data.cupsLuz || ''
      });
    }
    if (data?.bankAccount) bankAccounts.push(data.bankAccount);
    if (data?.comment) comments.push(data.comment);

    // Validación: debe tener al menos un teléfono válido
    if (phones.length === 0) {
      showWarning('Se requiere al menos un número de teléfono válido (mínimo 9 dígitos)');
      return;
    }

    // Asignar arrays al clientData
    clientData.phones = phones;
    clientData.addresses = addresses;
    clientData.bankAccounts = bankAccounts;
    clientData.comments = comments;

    setSavingIndex(index);
    try {
      await clientService.createClient(clientData);
      showSuccess('Cliente creado correctamente desde base de datos secundaria');

      // Limpiar formulario
      setFormData(prev => ({
        ...prev,
        [index]: {phone: '', address: '', cupsGas: '', cupsLuz: '', bankAccount: '', comment: ''}
      }));

    } catch (err: unknown) {
      // Extraer mensaje del error
      let errorMessage = 'Error al crear cliente';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data: unknown; status: number } };
        const serverMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data
          ? (axiosError.response.data as { message: string }).message
          : null;

        if (serverMessage) {
          errorMessage = serverMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      showError(errorMessage);
    } finally {
      setSavingIndex(null);
    }
  };

  if (results.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>No se encontraron datos en base de datos secundaria para "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div className={styles.resultSection}>
      <h3 className={styles.sectionTitle}>
        Base de datos secundaria ({results.length} resultado{results.length > 1 ? 's' : ''})
      </h3>
      
      {results.map((result, index) => (
        <div key={index} className={styles.skoreCard}>
          {result.telefono && !result.nombre ? (
            // Resultado de búsqueda por teléfono (formato anterior simple)
            <div className={styles.phoneResult}>
              <h5>Información de teléfono</h5>
              <p><strong>Teléfono:</strong> {result.telefono}</p>
              <p><strong>Documento:</strong> {result.documento}</p>
              <p><strong>Operador:</strong> {result.operador_actual}</p>
            </div>
          ) : (
            // Resultado de búsqueda completo (formato JSON completo)
            <div className={styles.dniResult}>
              <h5>🆔 Información de base de datos secundaria</h5>
              
              {/* Datos personales */}
              <div className={styles.dataSection}>
                <strong>Datos personales:</strong>
                <p><strong>Nombre:</strong> {result.nombre} {result.apellidos}</p>
                <p><strong>DNI:</strong> {result.documento}</p>
                <p><strong>Tipo documento:</strong> {result.tipo_documento}</p>
                <p><strong>Fecha nacimiento:</strong> {result.fecha_nacimiento}</p>
              </div>

              {/* Dirección */}
              {result.dir_direccion && (
                <div className={styles.dataSection}>
                  <strong>Dirección:</strong>
                  <p>{result.dir_direccion}</p>
                  <p>{result.dir_cp} {result.dir_municipio}, {result.dir_provincia}</p>
                  <p><strong>Comunidad:</strong> {result.comunidad_autonoma}</p>
                </div>
              )}

              {/* Teléfonos */}
              {result.telefonos && result.telefonos.length > 0 && (
                <div className={styles.dataSection}>
                  <strong>Teléfonos ({result.telefonos.length}):</strong>
                  <p>{result.telefonos.join(', ')}</p>
                </div>
              )}

              {/* Emails */}
              {result.emails && result.emails.length > 0 && (
                <div className={styles.dataSection}>
                  <strong>Emails:</strong>
                  <p>{result.emails.join(', ')}</p>
                </div>
              )}

              {/* Actividad económica */}
              {result.cnae && (
                <div className={styles.dataSection}>
                  <strong>Actividad:</strong>
                  <p><strong>CNAE:</strong> {result.cnae}</p>
                  <p>{result.cnae_descripcion}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Formulario embedded - solo para resultados completos de DNI, NO para teléfonos con operador */}
          {!(result.telefono && result.operador_actual && !result.nombre) && (
            <div className={styles.addDataSection}>
              <h4>Añadir datos</h4>
            
            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nuevo teléfono"
                value={formData[index]?.phone || ''}
                onChange={(e) => updateFormData(index, 'phone', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nueva dirección"
                value={formData[index]?.address || ''}
                onChange={(e) => updateFormData(index, 'address', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="CUPS Gas"
                value={formData[index]?.cupsGas || ''}
                onChange={(e) => updateFormData(index, 'cupsGas', e.target.value)}
              />
              <input
                className={styles.formInput}
                type="text"
                placeholder="CUPS Luz"
                value={formData[index]?.cupsLuz || ''}
                onChange={(e) => updateFormData(index, 'cupsLuz', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nueva cuenta bancaria"
                value={formData[index]?.bankAccount || ''}
                onChange={(e) => updateFormData(index, 'bankAccount', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nuevo comentario"
                value={formData[index]?.comment || ''}
                onChange={(e) => updateFormData(index, 'comment', e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveData(result, index)}
              isLoading={savingIndex === index}
              loadingText="Guardando..."
              disabled={savingIndex !== null}
              fullWidth
            >
              Guardar datos
            </Button>
          </div>
          )}
        </div>
      ))}
    </div>
  );
};