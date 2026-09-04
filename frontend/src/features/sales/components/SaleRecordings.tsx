/**
 * Componente para gestionar grabaciones de una venta
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Recording } from '@/types/sales';
import {
  listRecordings,
  uploadRecording,
  downloadRecording,
  deleteRecording,
  isAudio,
  isVideo,
} from '../services/recordingService';
import { formatFileSize } from '@/utils/crm/formatters';
import { logger } from '@/utils/logger';
import Button from '@/design-system/components/Button';
import styles from './SaleRecordings.module.scss';

interface SaleRecordingsProps {
  saleId: string;
  readonly?: boolean;
}

const SaleRecordings = ({ saleId, readonly = false }: SaleRecordingsProps) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar grabaciones
  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listRecordings(saleId);
      setRecordings(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las grabaciones');
      logger.error('Error al cargar grabaciones', err as Error, { saleId });
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Handlers de drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    // Validar tipo
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setError('Solo se permiten archivos de audio o video');
      return;
    }

    // Validar tamaño (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('El archivo no puede superar los 100MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const newRecording = await uploadRecording(saleId, file, setUploadProgress);
      setRecordings((prev) => [newRecording, ...prev]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Error al subir la grabación');
      logger.error('Error al subir grabación', err as Error, { saleId });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      await downloadRecording(saleId, recording.id, recording.filename);
    } catch (err) {
      setError('Error al descargar la grabación');
      logger.error('Error al descargar grabación', err as Error, { saleId });
    }
  };

  const handleDelete = async (recording: Recording) => {
    if (!confirm(`¿Estás seguro de eliminar "${recording.filename}"?`)) {
      return;
    }

    try {
      await deleteRecording(saleId, recording.id);
      setRecordings((prev) => prev.filter((r) => r.id !== recording.id));
    } catch (err) {
      setError('Error al eliminar la grabación');
      logger.error('Error al eliminar grabación', err as Error, { saleId });
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getFileIcon = (mimeType: string) => {
    if (isAudio(mimeType)) return '🎵';
    if (isVideo(mimeType)) return '🎬';
    return '📁';
  };

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Grabaciones</h4>

      {/* Zona de upload */}
      {!readonly && (
        <div
          className={`${styles.dropzone} ${dragActive ? styles.active : ''} ${uploading ? styles.uploading : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
            disabled={uploading}
          />

          {uploading ? (
            <div className={styles.uploadProgress}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
              </div>
              <span>{uploadProgress}%</span>
            </div>
          ) : (
            <>
              <span className={styles.dropzoneIcon}>📤</span>
              <p>Arrastra archivos aquí o haz clic para seleccionar</p>
              <span className={styles.dropzoneHint}>Audio o video (máx. 100MB)</span>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Lista de grabaciones */}
      {loading ? (
        <div className={styles.loading}>Cargando grabaciones...</div>
      ) : recordings.length === 0 ? (
        <div className={styles.empty}>No hay grabaciones para esta venta</div>
      ) : (
        <ul className={styles.list}>
          {recordings.map((recording) => (
            <li key={recording.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemIcon}>{getFileIcon(recording.mimeType)}</span>
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>{recording.filename}</span>
                  <span className={styles.itemMeta}>
                    {formatFileSize(recording.size)} • {formatDate(recording.createdAt)}
                  </span>
                </div>
              </div>

              <div className={styles.itemActions}>
                <Button variant="secondary" size="sm" onClick={() => handleDownload(recording)}>
                  Descargar
                </Button>
                {!readonly && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(recording)}>
                    Eliminar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SaleRecordings;
