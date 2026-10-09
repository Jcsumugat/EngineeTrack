import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ facility }) {
    const { data, setData, put, processing, errors } = useForm({
        name: facility.name,
        description: facility.description || '',
        capacity: facility.capacity ?? '',
        is_active: !!facility.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('facilities.update', facility.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Edit Facility</h2>}>
            <Head title="Edit Facility" />
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg border bg-white p-6 shadow-sm">
                <Field label="Name" error={errors.name}>
                    <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                </Field>
                <Field label="Description" error={errors.description}>
                    <textarea rows="3" className={inputClass} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                </Field>
                <Field label="Capacity" error={errors.capacity}>
                    <input type="number" min="1" className={inputClass} value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-700 focus:ring-blue-600" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                    Active (available for reservation)
                </label>
                <div className="flex gap-2">
                    <button disabled={processing} className={btnPrimary}>Update</button>
                    <Link href={route('facilities.index')} className={btnSecondary}>Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}