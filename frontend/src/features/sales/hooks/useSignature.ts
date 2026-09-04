/* src/features/sales/hooks/useSignature.ts */

import { useState } from 'react';
import type { SignatureRequest } from '@/types/sales';
import { sendContract, resendContract, cancelSignature } from '../services/signatureService';

interface UseSignatureReturn {
  loading: boolean;
  error: string | null;
  send: (saleId: string, signerEmail: string, templateId?: string) => Promise<SignatureRequest | null>;
  resend: (saleId: string, signerEmail?: string) => Promise<SignatureRequest | null>;
  cancel: (saleId: string) => Promise<boolean>;
}

export function useSignature(): UseSignatureReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (saleId: string, signerEmail: string, templateId?: string): Promise<SignatureRequest | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await sendContract(saleId, signerEmail, templateId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar el contrato';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resend = async (saleId: string, signerEmail?: string): Promise<SignatureRequest | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await resendContract(saleId, signerEmail);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reenviar el contrato';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (saleId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await cancelSignature(saleId);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cancelar la solicitud de firma';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, send, resend, cancel };
}
