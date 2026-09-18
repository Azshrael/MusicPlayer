import React, { useState, useRef } from 'react';
import { 
  X, 
  HardDrive, 
  FolderSearch, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  FolderPlus, 
  FileAudio, 
  Info,
  Check,
  ListMusic
} from 'lucide-react';
import { Track, ThemeSettings } from '../types';
import { 
  scanPhoneDirectoryWithPicker, 
  scanFilesFromInput, 
  verifyAndCleanTracks 
} from '../services/phoneStorageScanner';

interface StorageScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onRefreshLibrary: () => Promise<void>;
  themeSettings: ThemeSettings;
  onNotify: (msg: string) => void;
}

export const StorageScannerModal: React.FC<StorageScannerModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onRefreshLibrary,
  themeSettings,
  onNotify,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [scannedCount, setScannedCount] = useState(0);
  const [lastScanSummary, setLastScanSummary] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const accent = themeSettings.accentColor;
  const isPickerSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // 1. Scan using HTML5 showDirectoryPicker
  const handleDirectoryPickerScan = async () => {
    setIsScanning(true);
    setStatusMessage('Запрос доступа к папке...');
    setScannedCount(0);
    setLastScanSummary(null);

    try {
      const result = await scanPhoneDirectoryWithPicker((status, count) => {
        setStatusMessage(status);
        setScannedCount(count);
      });

      if (result) {
        await onRefreshLibrary();
        const summary = `Успешно добавлено ${result.addedTracks.length} треков и ${result.addedPlaylists.length} плейлистов`;
        setLastScanSummary(summary);
        onNotify(summary);
      }
    } catch (err) {
      console.error('Scan error:', err);
      // Fallback to directory input if picker fails
      if (folderInputRef.current) {
        folderInputRef.current.click();
      }
    } finally {
      setIsScanning(false);
      setStatusMessage('');
    }
  };

  // 2. Scan using input folder or files
  const handleInputFilesScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setStatusMessage('Сканирование выбранных файлов...');
    setScannedCount(0);
    setLastScanSummary(null);

    try {
      const result = await scanFilesFromInput(files, (status, count) => {
        setStatusMessage(status);
        setScannedCount(count);
      });

      await onRefreshLibrary();
      const summary = `Успешно добавлено ${result.addedTracks.length} треков и ${result.addedPlaylists.length} плейлистов`;
      setLastScanSummary(summary);
      onNotify(summary);
    } catch (err) {
      console.error('File scan error:', err);
      onNotify('Ошибка при сканировании файлов');
    } finally {
      setIsScanning(false);
      setStatusMessage('');
      if (e.target) e.target.value = '';
    }
  };

  // 3. Verify paths & clean obsolete/moved files (Requirement 4)
  const handleVerifyAndClean = async () => {
    setIsScanning(true);
    setStatusMessage('Проверка актуальности путей к файлам...');

    try {
      const { removedCount, removedTitles } = await verifyAndCleanTracks(tracks);
      await onRefreshLibrary();

      if (removedCount > 0) {
        const summary = `Удалено ${removedCount} неактуальных путей: файлы были перемещены или удалены`;
        setLastScanSummary(summary);
        onNotify(summary);
      } else {
        const summary = 'Все пути к музыкальным файлам актуальны и проверены';
        setLastScanSummary(summary);
        onNotify(summary);
      }
    } catch (err) {
      console.error('Verification error:', err);
      onNotify('Ошибка проверки путей');
    } finally {
      setIsScanning(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="storage-scanner-modal"
        className="w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Hidden inputs */}
        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: '', directory: '' } as any)}
          multiple
          className="hidden"
          onChange={handleInputFilesScan}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.m3u,.m3u8"
          className="hidden"
          onChange={handleInputFilesScan}
        />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-lg"
              style={{ backgroundColor: accent }}
            >
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Сканирование памяти телефона
              </h2>
              <p className="text-xs text-slate-400">
                Поиск треков, M3U плейлистов и проверка актуальности путей
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isScanning}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Progress Box */}
          {isScanning && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-2 animate-pulse">
              <div className="flex items-center justify-between font-bold text-sm text-white">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Идет сканирование...</span>
                </div>
                <span>{scannedCount} файлов</span>
              </div>
              <p className="text-xs text-slate-300 break-all">{statusMessage}</p>
            </div>
          )}

          {/* Result Summary */}
          {lastScanSummary && !isScanning && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{lastScanSummary}</span>
            </div>
          )}

          {/* Action 1: Scan Directory */}
          <div className="space-y-2">
            <div className="font-semibold text-white text-xs">
              1. Сканирование папок с музыкой
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={isPickerSupported ? handleDirectoryPickerScan : () => folderInputRef.current?.click()}
                disabled={isScanning}
                className="p-3 rounded-2xl text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                <FolderSearch className="w-4 h-4" />
                <span>Выбрать папку с музыкой</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <FileAudio className="w-4 h-4 text-cyan-400" />
                <span>Выбрать файлы напрямую</span>
              </button>
            </div>
          </div>

          {/* Action 2: Verify & Clean Obsolete Paths (Requirement 4) */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="font-semibold text-white text-xs flex items-center justify-between">
              <span>2. Очистка неактуальных путей (файлы перенесены/удалены)</span>
              <span className="text-slate-400 font-mono">{tracks.length} треков в базе</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Если аудиофайлы были удалены из памяти телефона или перенесены в другую папку, эта проверка автоматически удалит их из медиатеки, чтобы не создавать путаницы.
            </p>
            <button
              onClick={handleVerifyAndClean}
              disabled={isScanning || tracks.length === 0}
              className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span>Проверить и удалить неактуальные пути</span>
            </button>
          </div>

          {/* Supported Schemes Info (Requirement 5) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Поддерживаемые схемы названий файлов:</span>
            </div>
            <ul className="space-y-1 list-disc list-inside font-mono text-[10px] text-slate-300">
              <li><span className="text-white">исполнитель - название</span> (Queen - Bohemian Rhapsody)</li>
              <li><span className="text-white">исполнитель-название</span> (Queen-Bohemian Rhapsody)</li>
              <li><span className="text-white">исполнитель.название</span> (Queen.Bohemian Rhapsody)</li>
              <li><span className="text-white">исполнитель название</span> (Queen Bohemian Rhapsody)</li>
            </ul>
            <div className="text-[10px] text-slate-500 pt-1">
              Форматы: MP3, FLAC (Lossless Hi-Res), WAV, AAC, OGG, M4A, а также списки воспроизведения M3U / M3U8.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
          <span className="text-slate-400 text-xs">
            {tracks.length} треков в памяти
          </span>
          <button
            onClick={onClose}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
