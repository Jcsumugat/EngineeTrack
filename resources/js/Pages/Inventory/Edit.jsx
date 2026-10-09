import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ equipment }) {
    const { data, setData, put, processing, errors } = useForm({
        name: equipment.name,
        description: equipment.description || '',
        is_active: !!equipment.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('inventory.update', equipment.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Edit Equipment</h2>}>
            <Head title="Edit Equipment" />
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg border bg-white p-6 shadow-sm">
                <Field label="Name" error={errors.name}>
                    <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                </Field>
                <Field label="Description" error={errors.description}>
                    <textarea rows="3" className={inputClass} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-700 focus:ring-blue-600" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                    Active (available for reservation and borrowing)
                </label>
                <p className="text-xs text-gray-500">Current stock: {equipment.total_quantity}. Use "Add stock" on the Inventory page to increase it.</p>
                <div className="flex gap-2">
                    <button disabled={processing} className={btnPrimary}>Update</button>
                    <Link href={route('inventory.index')} className={btnSecondary}>Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}