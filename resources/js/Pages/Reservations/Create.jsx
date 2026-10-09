import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Create({ equipment, facilities, departments }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        department_id: auth.user.department_id ?? '',
        type: 'equipment',
        equipment_id: '',
        facility_id: '',
        quantity: 1,
        date_from: '',
        date_to: '',
        purpose: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('reservations.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-gray-800">New Reservation</h2>}>
            <Head title="New Reservation" />
            <form onSubmit={submit} className="max-w-xl space-y-4 bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <Field label="Department" error={errors.department_id}>
                    <select className={inputClass} value={data.department_id} onChange={(e) => setData('department_id', e.target.value)}>
                        <option value="">Select department</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </Field>

                <Field label="What do you want to reserve?" error={errors.type}>
                    <select className={inputClass} value={data.type} onChange={(e) => setData('type', e.target.value)}>
                        <option value="equipment">Equipment</option>
                        <option value="facility">Facility</option>
                    </select>
                </Field>

                {data.type === 'equipment' ? (
                    <>
                        <Field label="Equipment" error={errors.equipment_id}>
                            <select className={inputClass} value={data.equipment_id} onChange={(e) => setData('equipment_id', e.target.value)}>
                                <option value="">Select equipment</option>
                                {equipment.map((item) => (
                                    <option key={item.id} value={item.id} disabled={item.available_quantity <= 0}>
                                        {item.name} ({item.available_quantity} available now)
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Quantity" error={errors.quantity}>
                            <input type="number" min="1" className={inputClass} value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                        </Field>
                    </>
                ) : (
                    <Field label="Facility" error={errors.facility_id}>
                        <select className={inputClass} value={data.facility_id} onChange={(e) => setData('facility_id', e.target.value)}>
                            <option value="">Select facility</option>
                            {facilities.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}{f.capacity ? ` (capacity ${f.capacity})` : ''}</option>
                            ))}
                        </select>
                    </Field>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Date and time from" error={errors.date_from}>
                        <input type="datetime-local" className={inputClass} value={data.date_from} onChange={(e) => setData('date_from', e.target.value)} />
                    </Field>
                    <Field label="Date and time to" error={errors.date_to}>
                        <input type="datetime-local" className={inputClass} value={data.date_to} onChange={(e) => setData('date_to', e.target.value)} />
                    </Field>
                </div>

                <Field label="Purpose" error={errors.purpose}>
                    <textarea rows="3" className={inputClass} value={data.purpose} onChange={(e) => setData('purpose', e.target.value)} />
                </Field>

                <p className="text-xs text-gray-500">
                    Reserving does not deduct stock. Equipment is deducted only when the admin releases it on the date of use.
                </p>

                <div className="flex gap-2">
                    <button disabled={processing} className={btnPrimary}>Submit reservation</button>
                    <Link href={route('reservations.index')} className={btnSecondary}>Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}