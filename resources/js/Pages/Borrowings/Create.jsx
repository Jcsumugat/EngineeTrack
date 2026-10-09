import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Create({ equipment, departments }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        department_id: auth.user.department_id ?? '',
        equipment_id: '',
        quantity: 1,
        due_at: '',
        purpose: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('borrowings.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-gray-800">New Borrow Request</h2>}>
            <Head title="New Borrow Request" />
            <form onSubmit={submit} className="max-w-xl space-y-4 bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <Field label="Department" error={errors.department_id}>
                    <select className={inputClass} value={data.department_id} onChange={(e) => setData('department_id', e.target.value)}>
                        <option value="">Select department</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </Field>
                <Field label="Equipment" error={errors.equipment_id}>
                    <select className={inputClass} value={data.equipment_id} onChange={(e) => setData('equipment_id', e.target.value)}>
                        <option value="">Select equipment</option>
                        {equipment.map((item) => (
                            <option key={item.id} value={item.id} disabled={item.available_quantity <= 0}>
                                {item.name} ({item.available_quantity} available)
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Quantity" error={errors.quantity}>
                    <input type="number" min="1" className={inputClass} value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                </Field>
                <Field label="Expected return (date and time)" error={errors.due_at}>
                    <input type="datetime-local" className={inputClass} value={data.due_at} onChange={(e) => setData('due_at', e.target.value)} />
                </Field>
                <Field label="Purpose" error={errors.purpose}>
                    <textarea rows="3" className={inputClass} value={data.purpose} onChange={(e) => setData('purpose', e.target.value)} />
                </Field>
                <div className="flex gap-2">
                    <button disabled={processing} className={btnPrimary}>Submit request</button>
                    <Link href={route('borrowings.index')} className={btnSecondary}>Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}