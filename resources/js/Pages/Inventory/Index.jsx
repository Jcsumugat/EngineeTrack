import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import ConfirmModal from '@/Components/ConfirmModal';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Index({ items, filters }) {
    const [q, setQ] = useState(filters?.q || '');
    const [target, setTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const form = useForm({ quantity: 1, reason: '' });

    const search = (e) => {
        e.preventDefault();
        router.get(route('inventory.index'), { q }, { preserveState: true });
    };

    const closeModal = () => {
        setTarget(null);
        form.reset();
        form.clearErrors();
    };

    const submitStock = (e) => {
        e.preventDefault();
        form.post(route('inventory.stock', target.id), { onSuccess: closeModal });
    };

    const confirmDelete = () => {
        router.delete(route('inventory.destroy', deleteTarget.id), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Inventory</h2>
                    <Link href={route('inventory.create')} className={btnPrimary}>Add Equipment</Link>
                </div>
            }
        >
            <Head title="Inventory" />

            <form onSubmit={search} className="mb-4 flex gap-2">
                <input className={inputClass + ' max-w-xs'} placeholder="Search equipment" value={q} onChange={(e) => setQ(e.target.value)} />
                <button className={btnPrimary}>Search</button>
            </form>

            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Total Qty</th>
                            <th className="px-4 py-3">Borrowed</th>
                            <th className="px-4 py-3">Available</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.data.map((item) => {
                            const borrowed = Number(item.out_quantity || 0);
                            const available = item.available_quantity ?? item.total_quantity - borrowed;
                            return (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        <Link href={route('inventory.show', item.id)} className="text-blue-700 hover:underline">{item.name}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{item.description}</td>
                                    <td className="px-4 py-3">{item.total_quantity}</td>
                                    <td className="px-4 py-3">{borrowed}</td>
                                    <td className={'px-4 py-3 font-semibold ' + (available <= 0 ? 'text-red-600' : 'text-green-700')}>
                                        {available}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700')}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="space-x-3 px-4 py-3 text-right">
                                        <button onClick={() => setTarget(item)} className="text-blue-700 hover:underline">Add stock</button>
                                        <Link href={route('inventory.edit', item.id)} className="text-blue-700 hover:underline">Edit</Link>
                                        <button onClick={() => setDeleteTarget(item)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                        {items.data.length === 0 && (
                            <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-500">No equipment found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={items.links} />

            <ConfirmModal
                show={!!deleteTarget}
                title={`Delete "${deleteTarget?.name}"?`}
                message="If this equipment has borrowing or reservation history, it will be deactivated instead of deleted so the records are kept."
                confirmLabel="Delete"
                tone="danger"
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setDeleteTarget(null)}
            />

            <Modal show={!!target} onClose={closeModal} maxWidth="md">
                <form onSubmit={submitStock} className="space-y-4 p-6">
                    <h3 className="text-lg font-semibold text-gray-800">Add stock: {target?.name}</h3>
                    <Field label="Quantity to add" error={form.errors.quantity}>
                        <input type="number" min="1" className={inputClass} value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} />
                    </Field>
                    <Field label="Reason (optional)" error={form.errors.reason}>
                        <input className={inputClass} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={closeModal} className={btnSecondary}>Cancel</button>
                        <button disabled={form.processing} className={btnPrimary}>Add stock</button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}