import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks/reduxHooks';
import { clientService } from '../../features/clientes/services/clientService';
import callsApi from '../../features/calls/services/callsApi';
import styles from './EditClientsPage.module.scss';
import type { Address, Client } from '../../types';

export default function EditClientsPage() {
  const auth = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [searchPhone, setSearchPhone]   = useState('');
  const [clientData, setClientData]     = useState<Client | null>(null);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [callingPhone, setCallingPhone] = useState<string | null>(null);

  const handleCall = useCallback(async (phone: string) => {
    if (!phone || callingPhone) return;
    setCallingPhone(phone);
    try {
      await callsApi.post('/calls/initiate', {
        clientPhone: phone,
        clientId:    clientData?.id,
      });
    } catch {
      // El widget de llamada recibirá el evento vía WS
    } finally {
      setTimeout(() => setCallingPhone(null), 3000);
    }
  }, [callingPhone, clientData?.id]);

  useEffect(() => {
    const dni = searchParams.get('dni');
    if (!dni) return;
    setSearchPhone(dni);
    clientService.searchClient(dni).then((clients) => {
      if (Array.isArray(clients)) {
        if (clients.length > 0) setClientData(clients[0]);
        else setError('No se encontró ningún cliente con ese DNI');
      } else {
        setClientData(clients);
      }
    }).catch((err: { response?: { data?: { error?: string; message?: string } }; message?: string }) => {
      setError(err.response?.data?.error || err.message || 'Error al buscar cliente');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    setError('');
    setSuccess('');
    setClientData(null);

    if (!searchPhone) {
      setError('Introduce un número de teléfono o DNI');
      return;
    }

    try {
      const clients = await clientService.searchClient(searchPhone);

      if (Array.isArray(clients)) {
        if (clients.length > 0) {
          setClientData(clients[0]);
        } else {
          setError('No se encontró ningún cliente con ese teléfono o DNI');
        }
      } else {
        setClientData(clients);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || 'Error al buscar cliente');
    }
  };

  const handleChange = (field: keyof Client, value: string | string[] | Address[]) => {
    if (!clientData) return;
    setClientData({ ...clientData, [field]: value });
  };

  // Teléfonos
  const handlePhoneChange = (index: number, value: string) => {
    if (!clientData) return;
    const updatedPhones = [...clientData.phones];
    updatedPhones[index] = value;
    setClientData({ ...clientData, phones: updatedPhones });
  };

  const handleAddPhone = () => {
    if (!clientData) return;
    setClientData({ ...clientData, phones: [...clientData.phones, ''] });
  };

  const handleRemovePhone = (index: number) => {
    if (!clientData) return;
    const updated = clientData.phones.filter((_, i) => i !== index);
    setClientData({ ...clientData, phones: updated });
  };

  // Direcciones
  const handleAddressChange = (index: number, field: keyof Address, value: string) => {
    if (!clientData) return;
    const updated = [...clientData.addresses];
    updated[index] = { ...updated[index], [field]: value };
    setClientData({ ...clientData, addresses: updated });
  };

  const handleAddAddress = () => {
    if (!clientData) return;
    setClientData({
      ...clientData,
      addresses: [...clientData.addresses, { address: '', cupsGas: '', cupsLuz: '' }],
    });
  };

  const handleRemoveAddress = (index: number) => {
    if (!clientData) return;
    const updated = clientData.addresses.filter((_, i) => i !== index);
    setClientData({ ...clientData, addresses: updated });
  };

  // Cuentas bancarias
  const handleBankAccountChange = (index: number, value: string) => {
    if (!clientData) return;
    const updated = [...(clientData.bankAccounts || [])];
    updated[index] = value;
    setClientData({ ...clientData, bankAccounts: updated });
  };

  const handleAddBankAccount = () => {
    if (!clientData) return;
    setClientData({
      ...clientData,
      bankAccounts: [...(clientData.bankAccounts || []), ''],
    });
  };

  const handleRemoveBankAccount = (index: number) => {
    if (!clientData || !clientData.bankAccounts) return;
    const updated = clientData.bankAccounts.filter((_, i) => i !== index);
    setClientData({ ...clientData, bankAccounts: updated });
  };

  // Comentarios
  const handleCommentChange = (index: number, value: string) => {
    if (!clientData) return;
    const updated = [...(clientData.comments || [])];
    updated[index] = value;
    setClientData({ ...clientData, comments: updated });
  };

  const handleAddComment = () => {
    if (!clientData) return;
    setClientData({
      ...clientData,
      comments: [...(clientData.comments || []), ''],
    });
  };

  const handleRemoveComment = (index: number) => {
    if (!clientData || !clientData.comments) return;
    const updated = clientData.comments.filter((_, i) => i !== index);
    setClientData({ ...clientData, comments: updated });
  };

  // Guardar cliente
  const handleSave = async () => {
    if (!clientData) return;
    setError('');
    setSuccess('');

    try {
      const updatedClient = await clientService.updateClient(clientData.id, clientData);

      setClientData(updatedClient);
      setSuccess('Cliente editado correctamente');

      setTimeout(() => {
        handleClear();
      }, 2000);
    } catch (err) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          };
        };
        message?: string;
      };

      // Si hay errores de validación detallados, mostrarlos
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        const errorMessages = error.response.data.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError(error.response?.data?.message || error.message || 'Error al actualizar cliente');
      }
    }
  };

  const handleClear = () => {
    setSearchPhone('');
    setClientData(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Editar cliente</h1>
      <p className={styles.welcome}>Bienvenido, {auth.user?.firstName ?? 'Usuario'}</p>

      <hr className={styles.hr} />

      {/* Buscar cliente */}
      <div className={styles.section}>
        <h2>Buscar cliente</h2>
        <div className={styles.searchContainer}>
          <input
            className={styles.searchInput}
            placeholder="Número de teléfono o DNI"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
          />
          <div className={styles.buttonGroup}>
            <button className={`${styles.button} ${styles.search}`} onClick={handleSearch}>
              Buscar
            </button>
            <button className={`${styles.button} ${styles.clear}`} onClick={handleClear}>
              Limpiar
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </div>

      {/* Editar cliente */}
      {clientData && (
        <div className={styles.section}>
          <h3>Editar cliente</h3>

          {/* Campos básicos */}
          <div className={styles.field}>
            <label>Nombre</label>
            <input
              className={styles.input}
              value={clientData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Apellidos</label>
            <input
              className={styles.input}
              value={clientData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>DNI</label>
            <input
              className={styles.input}
              value={clientData.dni}
              onChange={(e) => handleChange('dni', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <input
              className={styles.input}
              value={clientData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Fecha de nacimiento</label>
            <input
              type="date"
              className={styles.input}
              value={clientData.birthday}
              onChange={(e) => handleChange('birthday', e.target.value)}
            />
          </div>

          {/* Opcionales */}
          <div className={styles.field}>
            <label>Persona autorizada</label>
            <input
              className={styles.input}
              value={clientData.authorized || ''}
              onChange={(e) => handleChange('authorized', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Empresa</label>
            <input
              className={styles.input}
              value={clientData.businessName || ''}
              onChange={(e) => handleChange('businessName', e.target.value)}
            />
          </div>

          {/* Teléfonos */}
          <div className={styles.subsection}>
            <h4>Teléfonos</h4>
            {clientData.phones.map((p, i) => (
              <div key={i} className={styles.row}>
                <input
                  className={styles.input}
                  value={p}
                  onChange={(e) => handlePhoneChange(i, e.target.value)}
                />
                <button
                  className={`${styles.button} ${styles.call}`}
                  onClick={() => handleCall(p)}
                  disabled={!p || !!callingPhone}
                  title={`Llamar a ${p}`}
                >
                  {callingPhone === p ? '⏳ Llamando…' : '📞 Llamar'}
                </button>
                <button
                  className={`${styles.button} ${styles.remove}`}
                  onClick={() => handleRemovePhone(i)}
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button className={`${styles.button} ${styles.add}`} onClick={handleAddPhone}>
              Añadir teléfono
            </button>
          </div>

          {/* Direcciones */}
          <div className={styles.subsection}>
            <h4>Direcciones</h4>
            {clientData.addresses.map((addr, i) => (
              <div key={i} className={styles.addressBlock}>
                <input
                  className={styles.input}
                  placeholder="Dirección"
                  value={addr.address}
                  onChange={(e) => handleAddressChange(i, 'address', e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="CUPS Gas"
                  value={addr.cupsGas}
                  onChange={(e) => handleAddressChange(i, 'cupsGas', e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="CUPS Luz"
                  value={addr.cupsLuz}
                  onChange={(e) => handleAddressChange(i, 'cupsLuz', e.target.value)}
                />
                <button
                  className={`${styles.button} ${styles.remove}`}
                  onClick={() => handleRemoveAddress(i)}
                >
                  Eliminar dirección
                </button>
              </div>
            ))}
            <button className={`${styles.button} ${styles.add}`} onClick={handleAddAddress}>
              Añadir dirección
            </button>
          </div>

          {/* Cuentas bancarias */}
          <div className={styles.subsection}>
            <h4>Cuentas bancarias</h4>
            {(clientData.bankAccounts || []).map((b, i) => (
              <div key={i} className={styles.row}>
                <input
                  className={styles.input}
                  value={b}
                  onChange={(e) => handleBankAccountChange(i, e.target.value)}
                />
                <button
                  className={`${styles.button} ${styles.remove}`}
                  onClick={() => handleRemoveBankAccount(i)}
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button className={`${styles.button} ${styles.add}`} onClick={handleAddBankAccount}>
              Añadir cuenta
            </button>
          </div>

          {/* Comentarios */}
          <div className={styles.subsection}>
            <h4>Comentarios</h4>
            {(clientData.comments || []).map((c, i) => (
              <div key={i} className={styles.row}>
                <input
                  className={styles.input}
                  value={c}
                  onChange={(e) => handleCommentChange(i, e.target.value)}
                />
                <button
                  className={`${styles.button} ${styles.remove}`}
                  onClick={() => handleRemoveComment(i)}
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button className={`${styles.button} ${styles.add}`} onClick={handleAddComment}>
              Añadir comentario
            </button>
          </div>

          <div className={styles.buttonSave}>
            <button className={`${styles.button} ${styles.search}`} onClick={handleSave}>
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
