import React, { useState } from 'react';
import type { Client, UpdateClientData } from '../../../types';
import { clientService } from '../services/clientService';
import { Button, useToast } from '@/design-system';
import styles from './SearchResults.module.scss';

// Funciones de validación
const isValidIBAN = (iban: string): boolean => {
  if (!iban || iban === '') return true; // Opcional
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}[A-Z0-9]{1,9}$/i.test(iban);
};

interface CrmResultsProps {
  clients: Client[];
  searchTerm: string;
}

export const CrmResults: React.FC<CrmResultsProps> = ({
  clients,
  searchTerm
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [formData, setFormData] = useState<{[key: string]: {phone: string, address: string, cupsGas: string, cupsLuz: string, bankAccount: string, comment: string}}>({});
  const [savingClientId, setSavingClientId] = useState<string | null>(null);

  const updateFormData = (clientId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId] || {phone: '', address: '', cupsGas: '', cupsLuz: '', bankAccount: '', comment: ''},
        [field]: value
      }
    }));
  };

  const handleSaveData = async (client: Client) => {
    const data = formData[client.id];

    if (!data) {
      return;
    }

    const payload: Record<string, unknown> = {};
    
    // Añadir campos si están presentes (el backend validará)
    if (data.phone) {
      if (data.phone.length < 9) {
        showWarning('El teléfono debe tener mínimo 9 dígitos');
        return;
      }
      payload.phones = [data.phone];
    }

    if (data.address) {
      payload.addresses = [{
        address: data.address,
        cupsGas: data.cupsGas,
        cupsLuz: data.cupsLuz
      }];
    }

    if (data.bankAccount) {
      if (!isValidIBAN(data.bankAccount)) {
        showWarning('IBAN debe tener formato válido (ej: ES1234567890123456789012)');
        return;
      }
      payload.bankAccounts = [data.bankAccount];
    }

    if (data.comment) payload.comments = [data.comment];

    // Verificar que hay al menos un campo rellenado
    const hasData = data.phone || data.address || data.bankAccount || data.comment;
    if (!hasData) {
      showWarning('Debe llenar al menos un campo');
      return;
    }

    setSavingClientId(client.id);
    try {
      await clientService.updateClient(client.id, payload as UpdateClientData);
      showSuccess('Datos añadidos correctamente');

      // Limpiar formulario
      setFormData(prev => ({
        ...prev,
        [client.id]: {phone: '', address: '', cupsGas: '', cupsLuz: '', bankAccount: '', comment: ''}
      }));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al añadir datos';
      showError(errorMessage);
    } finally {
      setSavingClientId(null);
    }
  };
  if (clients.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>No se encontraron clientes en base de datos primaria para "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div className={styles.resultSection}>
      <h3 className={styles.sectionTitle}>
        Base de datos primaria ({clients.length} resultado{clients.length > 1 ? 's' : ''})
      </h3>
      
      {clients.map((client, index) => (
        <div 
          key={client.id || index} 
          className={styles.clientCard}
        >
          <div className={styles.clientHeader}>
            <h5>{client.firstName} {client.lastName}</h5>
          </div>
          
          <div className={styles.clientDetails}>
            <p><strong>DNI:</strong> {client.dni}</p>
            <p><strong>Email:</strong> {client.email || 'No registrado'}</p>
            <p><strong>Teléfonos:</strong> {client.phones.join(', ') || 'No registrados'}</p>
            
            {/* Direcciones detalladas */}
            <div className={styles.addressSection}>
              <strong>Direcciones ({client.addresses.length}):</strong>
              {client.addresses.length > 0 ? (
                <ul className={styles.addressList}>
                  {client.addresses.map((address, i) => (
                    <li key={i} className={styles.addressItem}>
                      <span>{address.address}</span>
                      {(address.cupsGas || address.cupsLuz) && (
                        <div className={styles.cupsInfo}>
                          {address.cupsGas && <span>Gas: {address.cupsGas}</span>}
                          {address.cupsLuz && <span>Luz: {address.cupsLuz}</span>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span>No registradas</span>
              )}
            </div>

            {client.birthday && <p><strong>Fecha nacimiento:</strong> {client.birthday}</p>}
            {client.authorized && <p><strong>Persona autorizada:</strong> {client.authorized}</p>}
            {client.businessName && <p><strong>Empresa:</strong> {client.businessName}</p>}
            
            {/* Cuentas bancarias */}
            {client.bankAccounts.length > 0 && (
              <div>
                <strong>Cuentas bancarias:</strong>
                <ul>
                  {client.bankAccounts.map((bank, bankIndex) => (
                    <li key={bankIndex}>{bank}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Comentarios */}
            {client.comments.length > 0 && (
              <div>
                <strong>Comentarios:</strong>
                <ul>
                  {client.comments.map((comment, commentIndex) => (
                    <li key={commentIndex}>{comment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Formulario embedded para cada cliente */}
          <div className={styles.addDataSection}>
            <h4>Añadir datos</h4>
            
            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nuevo teléfono"
                value={formData[client.id]?.phone || ''}
                onChange={(e) => updateFormData(client.id, 'phone', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nueva dirección"
                value={formData[client.id]?.address || ''}
                onChange={(e) => updateFormData(client.id, 'address', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="CUPS Gas"
                value={formData[client.id]?.cupsGas || ''}
                onChange={(e) => updateFormData(client.id, 'cupsGas', e.target.value)}
              />
              <input
                className={styles.formInput}
                type="text"
                placeholder="CUPS Luz"
                value={formData[client.id]?.cupsLuz || ''}
                onChange={(e) => updateFormData(client.id, 'cupsLuz', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nueva cuenta bancaria"
                value={formData[client.id]?.bankAccount || ''}
                onChange={(e) => updateFormData(client.id, 'bankAccount', e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Nuevo comentario"
                value={formData[client.id]?.comment || ''}
                onChange={(e) => updateFormData(client.id, 'comment', e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveData(client)}
              isLoading={savingClientId === client.id}
              loadingText="Guardando..."
              disabled={savingClientId !== null}
              fullWidth
            >
              Guardar datos
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};