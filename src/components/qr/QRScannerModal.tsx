import React, { useEffect, useState } from 'react';
import { X, QrCode, Smartphone, Check, Copy } from 'lucide-react';
import { generateQRCodeDataUrl } from '../../lib/qr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchMobile?: () => void;
  formId?: string;
  caseId?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onLaunchMobile,
  formId = 'form_hh_round2',
  caseId
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?mode=mobile&form=${formId}${caseId ? `&case=${caseId}` : ''}`
    : 'https://ais-dev-5qfwsip3f4ltmre5osmeqs-335003039437.europe-west3.run.app?mode=mobile';

  useEffect(() => {
    if (isOpen) {
      generateQRCodeDataUrl(targetUrl).then(setQrDataUrl);
    }
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900">Pair Field Device</h3>
              <p className="text-[11px] text-slate-500">Scan to launch CMRG Collect</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Generated QR Code */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="CMRG Collect QR Code"
              className="w-48 h-48 rounded-lg shadow-xs"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
              Generating QR Code...
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-2">
            Open camera on Android or iPhone to load forms & offline cache
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onLaunchMobile?.();
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open in Browser Mobile Simulator</span>
          </button>

          <button
            onClick={copyUrl}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Direct Mobile Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
