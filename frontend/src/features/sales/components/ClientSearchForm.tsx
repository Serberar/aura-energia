/* src/features/sales/components/ClientSearchForm.tsx */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import type { AddressInfo } from '@/types/sales';
import { clientService } from '@/features/clientes/services/clientService';
import { deduplicateCrmClients } from '@/features/clientes/utils/clientDeduplication';
import styles from './ClientSearchForm.module.css';

interface ClientSearchFormProps {
  onClientSelected: (clientData: ClientFormData) => void;
  initialData?: ClientFormData;
}

export interface ClientFormData {
  clientId: string;
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  phones: string[];
  bankAccounts: string[];
  address: AddressInfo;
  birthday?: string;
  businessName?: string;
  authorized?: string;
}

type Mode = 'search' | 'manual';

const emptyFormData = () => ({
  clientId: '',
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  phones: [''],
  addresses: [] as AddressInfo[],
  birthday: '',
  businessName: '',
  authorized: '',
  bankAccounts: [''],
});

const ClientSearchForm = ({ onClientSelected, initialData }: ClientSearchFormProps) => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('search');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('phone') ?? '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [foundClient, setFoundClient] = useState<any | null>(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);

  const [isConfirmed, setIsConfirmed] = useState(false);

  const [formData, setFormData] = useState<any>(
    initialData || emptyFormData()
  );

  // Llegamos aquí desde el cierre de una llamada con "Venta cerrada": buscamos
  // directamente al cliente por el teléfono que acaba de llamar.
  useEffect(() => {
    const phone = searchParams.get('phone');
    if (phone) handleSearch(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cambiar a modo manual ────────────────────────────────────────────────
  const switchToManual = () => {
    setMode('manual');
    setFoundClient(null);
    setFormData(emptyFormData());
    setSelectedAddressIndex(0);
    setIsConfirmed(false);
    setSearchError(null);
  };

  // ── Volver a búsqueda ────────────────────────────────────────────────────
  const switchToSearch = () => {
    setMode('search');
    setFoundClient(null);
    setFormData(emptyFormData());
    setSelectedAddressIndex(0);
    setIsConfirmed(false);
    setSearchError(null);
  };

  // ── Búsqueda en el sistema ───────────────────────────────────────────────
  const handleSearch = async (termOverride?: string) => {
    const term = termOverride ?? searchTerm;
    if (!term.trim()) {
      setSearchError('Ingrese un DNI o teléfono');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setIsConfirmed(false);

    try {
      const result = await clientService.searchClient(term.trim());
      const rawClients = Array.isArray(result) ? result : [result];

      if (!rawClients.length || !rawClients[0]) {
        setSearchError('No se encontraron clientes con ese criterio');
        return;
      }

      const deduplicatedClients = deduplicateCrmClients(rawClients);
      const client = deduplicatedClients[0];

      setFoundClient(client);

      setFormData({
        clientId: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        dni: client.dni,
        email: client.email || '',
        phones: client.phones?.length ? [...client.phones] : [''],
        addresses: client.addresses?.length ? [...client.addresses] : [],
        birthday: client.birthday || '',
        businessName: client.businessName || '',
        authorized: client.authorized || '',
        bankAccounts: client.bankAccounts?.length ? [client.bankAccounts[0]] : [''],
      });

      setSelectedAddressIndex(0);

    } catch (error: any) {
      setSearchError(error?.message || 'Cliente no encontrado');
      setFoundClient(null);
    } finally {
      setIsSearching(false);
    }
  };

  // ── Handlers del formulario ──────────────────────────────────────────────
  const handleChange = (field: keyof ClientFormData) => (e: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: e.target.value }));
    setIsConfirmed(false);
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...(formData.phones || [''])];
    newPhones[index] = value;
    setFormData((prev: any) => ({ ...prev, phones: newPhones }));
    setIsConfirmed(false);
  };

  const handleAddressChange = (index: number, field: keyof AddressInfo, value: string) => {
    const newAddresses = [...(formData.addresses || [])];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, addresses: newAddresses }));
    setIsConfirmed(false);
  };

  // ── Confirmar cliente ────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (mode === 'search' && !formData.clientId) {
      setSearchError('Debe buscar y seleccionar un cliente primero');
      return;
    }

    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.dni?.trim()) {
      setSearchError('Nombre, apellidos y DNI son obligatorios');
      return;
    }

    if (!formData.email?.trim()) {
      setSearchError('El email es obligatorio');
      return;
    }

    if (!formData.phones || formData.phones.every((p: string) => !p.trim())) {
      setSearchError('El teléfono es obligatorio');
      return;
    }

    if (!formData.bankAccounts || formData.bankAccounts.every((a: string) => !a.trim())) {
      setSearchError('La cuenta bancaria es obligatoria');
      return;
    }

    const selectedAddress = (formData.addresses || [])[selectedAddressIndex] || null;

    if (!selectedAddress) {
      setSearchError('Debe añadir una dirección de suministro');
      return;
    }

    if (!selectedAddress.address?.trim()) {
      setSearchError('La dirección es obligatoria');
      return;
    }

    const hasCupsLuz = selectedAddress.cupsLuz?.trim();
    const hasCupsGas = selectedAddress.cupsGas?.trim();
    if (!hasCupsLuz && !hasCupsGas) {
      setSearchError('Debe proporcionar al menos un CUPS (Luz o Gas)');
      return;
    }

    setSearchError(null);
    setIsConfirmed(true);

    onClientSelected({
      ...formData,
      address: selectedAddress,
    } as ClientFormData);
  };

  const showForm = mode === 'manual' || (mode === 'search' && foundClient);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Cliente</h3>

      {isConfirmed && (
        <div className={styles.confirmedBadge}>
          {mode === 'manual' ? 'Cliente manual confirmado ✓' : 'Cliente confirmado ✓'}
        </div>
      )}

      {/* ── MODO BÚSQUEDA ── */}
      {mode === 'search' && (
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <div className={styles.searchInputWrapper}>
              <Input
                label="Buscar cliente por DNI o Teléfono"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsConfirmed(false);
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
                }}
                placeholder="Ej: 12345678A o 612345678"
                fullWidth
              />
              <button type="button" className={styles.manualLink} onClick={switchToManual}>
                ¿No aparece o los datos están mal? Introducir manualmente
              </button>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSearch()}
              disabled={isSearching}
              className={styles.searchButton}
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {searchError && !foundClient && <p className={styles.error}>{searchError}</p>}
        </div>
      )}

      {/* ── MODO MANUAL — banner ── */}
      {mode === 'manual' && (
        <div className={styles.manualBanner}>
          <span className={styles.manualBannerText}>
            ✎ Introduciendo datos manualmente
          </span>
          <button type="button" className={styles.backToSearchLink} onClick={switchToSearch}>
            ← Volver a búsqueda
          </button>
        </div>
      )}

      {/* ── FORMULARIO ── */}
      {showForm && (
        <div className={styles.formSection}>

          <div className={styles.row}>
            <Input fullWidth label="Nombre *" value={formData.firstName} onChange={handleChange('firstName')} />
            <Input fullWidth label="Apellidos *" value={formData.lastName} onChange={handleChange('lastName')} />
          </div>

          <div className={styles.row}>
            <Input fullWidth label="DNI/NIF *" value={formData.dni} onChange={handleChange('dni')} />
            <Input fullWidth label="Email *" value={formData.email} onChange={handleChange('email')} />
          </div>

          {/* Teléfono */}
          <div className={styles.arraySection}>
            <label className={styles.arrayLabel}>Teléfono *</label>
            <Input
              type="tel"
              fullWidth
              value={formData.phones[0]}
              onChange={(e) => handlePhoneChange(0, e.target.value)}
            />
          </div>

          {/* Cuenta bancaria */}
          <div className={styles.arraySection}>
            <label className={styles.arrayLabel}>Cuenta bancaria *</label>
            <Input
              fullWidth
              placeholder="ES00 0000 0000 0000 0000 0000"
              value={formData.bankAccounts[0] || ''}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  bankAccounts: [e.target.value],
                }))
              }
            />
          </div>

          {/* Direcciones */}
          <div className={styles.arraySection}>
            <label className={styles.arrayLabel}>Dirección de suministro * (mínimo un CUPS)</label>

            {(formData.addresses || []).length === 0 ? (
              <div className={styles.noAddresses}>
                <p className={styles.noAddressesText}>
                  {mode === 'manual'
                    ? 'Añade la dirección de suministro del cliente'
                    : 'No hay direcciones registradas para este cliente'}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFormData((prev: any) => ({
                      ...prev,
                      addresses: [{ address: '', cupsLuz: '', cupsGas: '' }],
                    }));
                    setSelectedAddressIndex(0);
                    setIsConfirmed(false);
                  }}
                >
                  + Añadir dirección
                </Button>
              </div>
            ) : (
              <>
                {(formData.addresses || []).map((address: AddressInfo, index: number) => (
                  <div key={index} className={styles.addressGroup}>
                    {(formData.addresses || []).length > 1 && (
                      <div className={styles.addressSelectRow}>
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={selectedAddressIndex === index}
                          onChange={() => {
                            setSelectedAddressIndex(index);
                            setIsConfirmed(false);
                          }}
                        />
                        <span>Seleccionar esta dirección</span>
                      </div>
                    )}

                    <Input
                      fullWidth
                      label="Dirección *"
                      value={address.address}
                      onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                    />
                    <div className={styles.row}>
                      <Input
                        fullWidth
                        label="CUPS Luz"
                        value={address.cupsLuz || ''}
                        onChange={(e) => handleAddressChange(index, 'cupsLuz', e.target.value)}
                      />
                      <Input
                        fullWidth
                        label="CUPS Gas"
                        value={address.cupsGas || ''}
                        onChange={(e) => handleAddressChange(index, 'cupsGas', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => {
                    setFormData((prev: any) => ({
                      ...prev,
                      addresses: [...(prev.addresses || []), { address: '', cupsLuz: '', cupsGas: '' }],
                    }));
                    setIsConfirmed(false);
                  }}
                >
                  + Añadir otra dirección
                </Button>
              </>
            )}
          </div>

          {/* BOTÓN CONFIRMAR */}
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleConfirm}
            disabled={isConfirmed}
          >
            {isConfirmed
              ? (mode === 'manual' ? 'Cliente manual confirmado ✓' : 'Cliente confirmado ✓')
              : (mode === 'manual' ? 'Confirmar datos manuales' : 'Confirmar Cliente')}
          </Button>

          {searchError && <p className={styles.error}>{searchError}</p>}
        </div>
      )}
    </div>
  );
};

export default ClientSearchForm;
