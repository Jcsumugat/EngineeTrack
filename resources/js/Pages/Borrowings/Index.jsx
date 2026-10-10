import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import ActionMenu from '@/Components/ActionMenu';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { fmt } from '@/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

const ACTIONS = {
    approve: {
        route: 'borrowings.approve',
        title: 'Approve this borrow request?',
        label: 'Approve',
        tone: 'primary',
        message: (b) =>
            `${b.quantity} x ${b.equipment?.name} will be held for ${b.user?.name}. Stock only goes down when you release it.`,
    },
    disapprove: {
        route: 'borrowings.disapprove',
        title: 'Disapprove this borrow request?',
        label: 'Disapprove',
        tone: 'danger',
        message: (b) => `The request of ${b.user?.name} for ${b.quantity} x ${b.equipment?.name} will be declined.`,
    },
    release: {
        route: 'borrowings.release',
        title: 'Release this equipment?',
        label: 'Release',
        tone: 'primary',
        message: (b) =>
            `${b.quantity} x ${b.equipment?.name} will be handed to ${b.user?.name} and deducted from available stock.`,
    },
};

// Damaged units that have not been replaced yet
const outstanding = (b) => Number(b.damaged_quantity ?? 0) - Number(b.replaced_quantity ?? 0);

function Detail({ label, children, wide = false }) {
    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{children || <span className="text-gray-400">-</span>}</dd>
        </div>
    );
}

export default function Index({ borrowings }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role === 'admin';
    const [target, setTarget] = useState(null);
    const [replaceTarget, setReplaceTarget] = useState(null);
    const [confirm, setConfirm] = useState(null); // { action, item }
    const [busy, setBusy] = useState(false);
    const [details, setDetails] = useState(null);
    const form = useForm({ is_damaged: false, damaged_quantity: 0, damage_note: '' });
    const replaceForm = useForm({ replaced_quantity: 1, replacement_note: '' });

    const runConfirmed = () => {
        const cfg = ACTIONS[confirm.action];
        router.patch(route(cfg.route, confirm.item.id), {}, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => {
                setBusy(false);
                setConfirm(null);
            },
        });
    };

    const close = () => {
        setTarget(null);
        form.reset();
        form.clearErrors();
    };

    const submitReturn = (e) => {
        e.preventDefault();
        form.patch(route('borrowings.return', target.id), { preserveScroll: true, onSuccess: close });
    };

    const openReplace = (b) => {
        replaceForm.clearErrors();
        replaceForm.setData({ replaced_quantity: outstanding(b), replacement_note: '' });
        setReplaceTarget(b);
    };

    const closeReplace = () => {
        setReplaceTarget(null);
        replaceForm.reset();
        replaceForm.clearErrors();
    };

    const submitReplace = (e) => {
        e.preventDefault();
        replaceForm.patch(route('borrowings.replace', replaceTarget.id), {
            preserveScroll: true,
            onSuccess: closeReplace,
        });
    };

    const rowActions = (b) => [
        { label: 'View details', onClick: () => setDetails(b) },
        isAdmin && b.status === 'pending' && { label: 'Approve', onClick: () => setConfirm({ action: 'approve', item: b }) },
        isAdmin && b.status === 'pending' && { label: 'Disapprove', onClick: () => setConfirm({ action: 'disapprove', item: b }), tone: 'danger' },
        isAdmin && b.status === 'approved' && { label: 'Release', onClick: () => setConfirm({ action: 'release', item: b }) },
        isAdmin && b.status === 'released' && { label: 'Return', onClick: () => setTarget(b) },
        isAdmin && b.status === 'returned' && outstanding(b) > 0 && { label: 'Replace', onClick: () => openReplace(b) },
    ];

    const cfg = confirm ? ACTIONS[confirm.action] : null;
    const d = details;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Borrowings</h2>
                    <Link href={route('borrowings.create')} className={btnPrimary}>New Borrow Request</Link>
                </div>
            }
        >
            <Head title="Borrowings" />

            <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                        <tr>
                            {isAdmin && <th className="px-4 py-3">Borrower</th>}
                            <th className="px-4 py-3">Equipment</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">Borrowed</th>
                            <th className="px-4 py-3">Due</th>
                            <th className="px-4 py-3">Returned</th>
                            <th className="px-4 py-3">Condition</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {borrowings.data.map((b) => (
                            <tr key={b.id}>
                                {isAdmin && (
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{b.user?.name}</div>
                                        <div className="text-xs text-gray-500">{b.department?.name ?? b.user?.department?.name}</div>
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{b.equipment?.name}</div>
                                    {!isAdmin && (
                                        <div className="text-xs text-gray-500">{b.department?.name}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3">{b.quantity}</td>
                                <td className="px-4 py-3">{fmt(b.borrowed_at)}</td>
                                <td className="px-4 py-3">{fmt(b.due_at)}</td>
                                <td className="px-4 py-3">{fmt(b.returned_at)}</td>
                                <td className="px-4 py-3">
                                    {b.status === 'returned' ? (
                                        b.is_damaged ? (
                                            <div>
                                                <span className="text-red-600">{b.damaged_quantity} damaged</span>
                                                {Number(b.replaced_quantity) > 0 && (
                                                    <div className="text-xs font-semibold text-green-700">
                                                        {b.replaced_quantity} replaced
                                                        {outstanding(b) === 0 && ' (complete)'}
                                                    </div>
                                                )}
                                                {outstanding(b) > 0 && Number(b.replaced_quantity) > 0 && (
                                                    <div className="text-xs text-amber-600">{outstanding(b)} still to replace</div>
                                                )}
                                                {b.damage_note && <div className="text-xs text-gray-600">{b.damage_note}</div>}
                                            </div>
                                        ) : (
                                            <span className="text-green-700">Good</span>
                                        )
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <ActionMenu items={rowActions(b)} />
                                </td>
                            </tr>
                        ))}
                        {borrowings.data.length === 0 && (
                            <tr><td colSpan={isAdmin ? 9 : 8} className="px-4 py-6 text-center text-gray-500">No borrowings yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={borrowings.links} />

            {/* View details */}
            <Modal show={!!d} onClose={() => setDetails(null)} maxWidth="lg">
                {d && (
                    <div>
                        <div className="flex items-start justify-between bg-gradient-to-r from-blue-900 to-blue-600 px-6 py-4 text-white">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                                    Borrowing #{d.id}
                                </div>
                                <h3 className="mt-1 text-lg font-bold">{d.equipment?.name}</h3>
                            </div>
                            <StatusBadge status={d.status} />
                        </div>

                        <dl className="grid gap-4 p-6 sm:grid-cols-2">
                            <Detail label="Borrower">
                                {d.user?.name}
                                {d.user?.email && <div className="text-xs text-gray-500">{d.user.email}</div>}
                            </Detail>
                            <Detail label="Department">{d.department?.name ?? d.user?.department?.name}</Detail>
                            <Detail label="Equipment">{d.equipment?.name}</Detail>
                            <Detail label="Quantity">{d.quantity}</Detail>
                            <Detail label="Purpose" wide>{d.purpose}</Detail>
                            <Detail label="Submitted on">{fmt(d.created_at)}</Detail>
                            <Detail label="Reviewed by">
                                {d.reviewer?.name}
                                {d.reviewed_at && <div className="text-xs text-gray-500">{fmt(d.reviewed_at)}</div>}
                            </Detail>
                            <Detail label="Released by">
                                {d.releaser?.name}
                                {d.released_at && <div className="text-xs text-gray-500">{fmt(d.released_at)}</div>}
                            </Detail>
                            <Detail label="Borrowed on">{fmt(d.borrowed_at)}</Detail>
                            <Detail label="Due on">{fmt(d.due_at)}</Detail>
                            <Detail label="Returned on">{fmt(d.returned_at)}</Detail>
                            <Detail label="Received by">{d.receiver?.name}</Detail>

                            {d.status === 'returned' && (
                                <Detail label="Condition on return" wide>
                                    {d.is_damaged ? (
                                        <div>
                                            <span className="font-semibold text-red-600">{d.damaged_quantity} damaged</span>
                                            {Number(d.replaced_quantity) > 0 && (
                                                <span className="ml-2 font-semibold text-green-700">
                                                    {d.replaced_quantity} replaced
                                                    {outstanding(d) === 0 && ' (complete)'}
                                                </span>
                                            )}
                                            {outstanding(d) > 0 && (
                                                <span className="ml-2 text-amber-600">{outstanding(d)} still to replace</span>
                                            )}
                                            {d.damage_note && <div className="mt-1 text-gray-600">{d.damage_note}</div>}
                                            {d.replacement_note && (
                                                <div className="mt-1 text-gray-600">Replacement note: {d.replacement_note}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="font-semibold text-green-700">Good condition</span>
                                    )}
                                </Detail>
                            )}
                        </dl>

                        <div className="flex justify-end border-t border-gray-100 px-6 py-3">
                            <button type="button" onClick={() => setDetails(null)} className={btnSecondary}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                show={!!confirm}
                title={cfg?.title}
                message={confirm ? cfg.message(confirm.item) : ''}
                confirmLabel={cfg?.label}
                tone={cfg?.tone}
                processing={busy}
                onConfirm={runConfirmed}
                onClose={() => setConfirm(null)}
            />

            {/* Return modal */}
            <Modal show={!!target} onClose={close} maxWidth="md">
                <form onSubmit={submitReturn} className="space-y-4 p-6">
                    <h3 className="text-lg font-bold text-gray-800">
                        Receive return: {target?.equipment?.name} (x{target?.quantity})
                    </h3>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            className="border-gray-300 text-blue-700 focus:ring-blue-700"
                            checked={form.data.is_damaged}
                            onChange={(e) => form.setData('is_damaged', e.target.checked)}
                        />
                        Some items are broken or damaged
                    </label>

                    {form.data.is_damaged && (
                        <>
                            <Field label={`Damaged quantity (max ${target?.quantity})`} error={form.errors.damaged_quantity}>
                                <input
                                    type="number" min="0" max={target?.quantity}
                                    className={inputClass}
                                    value={form.data.damaged_quantity}
                                    onChange={(e) => form.setData('damaged_quantity', e.target.value)}
                                />
                            </Field>
                            <Field label="Note" error={form.errors.damage_note}>
                                <textarea
                                    rows="3" className={inputClass}
                                    value={form.data.damage_note}
                                    onChange={(e) => form.setData('damage_note', e.target.value)}
                                />
                            </Field>
                            <p className="text-xs text-red-600">Damaged units are removed from the total stock.</p>
                        </>
                    )}

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={close} className={btnSecondary}>Cancel</button>
                        <button disabled={form.processing} className={btnPrimary}>Confirm return</button>
                    </div>
                </form>
            </Modal>

            {/* Replacement modal */}
            <Modal show={!!replaceTarget} onClose={closeReplace} maxWidth="md">
                {replaceTarget && (
                    <form onSubmit={submitReplace} className="space-y-4 p-6">
                        <h3 className="text-lg font-bold text-gray-800">
                            Replace damaged items: {replaceTarget.equipment?.name}
                        </h3>

                        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 text-center text-xs ring-1 ring-gray-200">
                            <div>
                                <div className="text-lg font-bold text-red-600">{replaceTarget.damaged_quantity}</div>
                                Damaged
                            </div>
                            <div>
                                <div className="text-lg font-bold text-green-700">{replaceTarget.replaced_quantity ?? 0}</div>
                                Already replaced
                            </div>
                            <div>
                                <div className="text-lg font-bold text-amber-600">{outstanding(replaceTarget)}</div>
                                Still to replace
                            </div>
                        </div>

                        <p className="text-sm text-gray-600">
                            {replaceTarget.user?.name} brings new units to replace the damaged ones.
                        </p>

                        <Field label={`Replacement quantity (max ${outstanding(replaceTarget)})`} error={replaceForm.errors.replaced_quantity}>
                            <input
                                type="number" min="1" max={outstanding(replaceTarget)}
                                className={inputClass}
                                value={replaceForm.data.replaced_quantity}
                                onChange={(e) => replaceForm.setData('replaced_quantity', e.target.value)}
                            />
                        </Field>
                        <Field label="Note (optional)" error={replaceForm.errors.replacement_note}>
                            <textarea
                                rows="2" className={inputClass}
                                value={replaceForm.data.replacement_note}
                                onChange={(e) => replaceForm.setData('replacement_note', e.target.value)}
                            />
                        </Field>

                        <p className="text-xs text-green-700">
                            The replacement is added back to the total stock and recorded in the equipment stock log.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeReplace} className={btnSecondary}>Cancel</button>
                            <button disabled={replaceForm.processing} className={btnPrimary}>Confirm replacement</button>
                        </div>
                    </form>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}