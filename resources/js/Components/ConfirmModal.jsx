import Modal from '@/Components/Modal';
import { btnPrimary, btnSecondary } from '@/Components/Field';

const dangerClass =
    'inline-flex items-center justify-center bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50';

export default function ConfirmModal({
    show,
    title,
    message,
    confirmLabel = 'Confirm',
    tone = 'primary',
    processing = false,
    onConfirm,
    onClose,
    children,
}) {
    return (
        <Modal show={show} onClose={processing ? () => {} : onClose} maxWidth="md">
            <div className="space-y-4 p-6">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                {message && <p className="text-sm text-gray-600">{message}</p>}
                {children}
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={processing} className={btnSecondary}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={tone === 'danger' ? dangerClass : btnPrimary}
                    >
                        {processing ? 'Please wait...' : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}