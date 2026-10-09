import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({ name: '', description: '', total_quantity: 1 });

    const submit = (e) => {
        e.preventDefault();
        post(route('inventory.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Add Equipment</h2>}>
            <Head title="Add Equipment" />
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg border bg-white p-6 shadow-sm">
                <Field label="Name" error={errors.name}>
                    <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                </Field>
                <Field label="Description" error={errors.description}>
                    <textarea rows="3" className={inputClass} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                </Field>
                <Field label="Initial quantity" error={errors.total_quantity}>
                    <input type="number" min="0" className={inputClass} value={data.total_quantity} onChange={(e) => setData('total_quantity', e.target.value)} />
                </Field>
                <div className="flex gap-2">
                    <button disabled={processing} className={btnPrimary}>Save</button>
                    <Link href={route('inventory.index')} className={btnSecondary}>Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}