import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import Field, { inputClass, btnPrimary } from '@/Components/Field';
import { fmt } from '@/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';

const itemName = (r) => r.equipment?.name ?? r.facility?.name;

const ACTIONS = {
    approve: {
        route: 'reservations.approve',
        title: 'Approve this reservation?',
        label: 'Approve',
        tone: 'primary',
        message: (r) => `${r.user?.name}'s reservation for ${itemName(r)} will be approved.`,
    },
    disapprove: {
        route: 'reservations.disapprove',
        title: 'Disapprove this reservation?',
        label: 'Disapprove',
        tone: 'danger',
        message: (r) => `${r.user?.name}'s reservation for ${itemName(r)} will be declined.`,
    },
    release: {
        route: 'reservations.release',
        title: 'Release this reservation?',
        label: 'Release',
        tone: 'primary',
        message: (r) =>
            r.equipment_id
                ? `${r.quantity} x ${itemName(r)} will be handed out and deducted from available stock.`
                : `${itemName(r)} will be marked as in use.`,
    },
    complete: {
        route: 'reservations.complete',
        title: 'Mark as completed?',
        label: 'Complete',
        tone: 'primary',
        message: (r) => `The use of ${itemName(r)} will be marked as completed.`,
    },
    cancel: {
        route: 'reservations.cancel',
        title: 'Cancel this reservation?',
        label: 'Yes, cancel it',
        tone: 'danger',
        message: (r) => `The reservation for ${itemName(r)} will be cancelled. This cannot be undone.`,
    },
};

export default function Index({ reservations }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role === 'admin';
    const [confirm, setConfirm] = useState(null); // { action, item }
    const [remarks, setRemarks] = useState('');
    const [busy, setBusy] = useState(false);

    const open = (action, item) => {
        setRemarks('');
        setConfirm({ action, item });
    };

    const runConfirmed = () => {
        const cfg = ACTIONS[confirm.action];
        const data = confirm.action === 'disapprove' ? { remarks } : {};
        router.patch(route(cfg.route, confirm.item.id), data, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => {
                setBusy(false);
                setConfirm(null);
            },
        });
    };

    const link = 'text-blue-700 hover:underline';
    const cfg = confirm ? ACTIONS[confirm.action] : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Reservations</h2>
                    <Link href={route('reservations.create')} className={btnPrimary}>New Reservation</Link>
                </div>
            }
        >
            <Head title="Reservations" />

            <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                        <tr>
                            {isAdmin && <th className="px-4 py-3">Requested by</th>}
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">From</th>
                            <th className="px-4 py-3">To</th>
                            <th className="px-4 py-3">Purpose</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reservations.data.map((r) => (
                            <tr key={r.id}>
                                {isAdmin && (
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{r.user?.name}</div>
                                        <div className="text-xs text-gray-500">{r.department?.name ?? r.user?.department?.name}</div>
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{r.equipment?.name ?? r.facility?.name}</div>
                                    <div className="text-xs text-gray-500">{r.equipment_id ? 'Equipment' : 'Facility'}</div>
                                    {!isAdmin && (
                                        <div className="text-xs text-gray-500">{r.department?.name}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3">{r.quantity}</td>
                                <td className="px-4 py-3">{fmt(r.date_from)}</td>
                                <td className="px-4 py-3">{fmt(r.date_to)}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.purpose}
                                    {r.remarks && <div className="text-xs text-red-600">Remarks: {r.remarks}</div>}
                                </td>
                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                                    {isAdmin && r.status === 'pending' && (
                                        <>
                                            <button onClick={() => open('approve', r)} className={link}>Approve</button>
                                            <button onClick={() => open('disapprove', r)} className="text-red-600 hover:underline">Disapprove</button>
                                        </>
                                    )}
                                    {isAdmin && r.status === 'approved' && (
                                        <button onClick={() => open('release', r)} className={link}>Release</button>
                                    )}
                                    {isAdmin && r.status === 'released' && r.facility_id && (
                                        <button onClick={() => open('complete', r)} className={link}>Complete</button>
                                    )}
                                    {['pending', 'approved'].includes(r.status) && (
                                        <button onClick={() => open('cancel', r)} className="text-gray-600 hover:underline">Cancel</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reservations.data.length === 0 && (
                            <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-500">No reservations yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={reservations.links} />

            <ConfirmModal
                show={!!confirm}
                title={cfg?.title}
                message={confirm ? cfg.message(confirm.item) : ''}
                confirmLabel={cfg?.label}
                tone={cfg?.tone}
                processing={busy}
                onConfirm={runConfirmed}
                onClose={() => setConfirm(null)}
            >
                {confirm?.action === 'disapprove' && (
                    <Field label="Reason for disapproval (optional)">
                        <textarea
                            rows="3"
                            className={inputClass}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </Field>
                )}
            </ConfirmModal>
        </AuthenticatedLayout>
    );
}