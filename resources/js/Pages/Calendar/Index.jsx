import { useCallback, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import { btnSecondary } from '@/Components/Field';
import { fmt } from '@/utils';
import { Head } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const theme = {
    '--fc-button-bg-color': '#1e40af',
    '--fc-button-border-color': '#1e40af',
    '--fc-button-hover-bg-color': '#1e3a8a',
    '--fc-button-hover-border-color': '#1e3a8a',
    '--fc-button-active-bg-color': '#172554',
    '--fc-button-active-border-color': '#172554',
    '--fc-today-bg-color': 'transparent',
    '--fc-border-color': '#e5e7eb',
    '--fc-neutral-bg-color': '#f9fafb',
};

const css = `
.et-cal .fc { font-family: inherit; }
.et-cal .fc-theme-standard td,
.et-cal .fc-theme-standard th,
.et-cal .fc-theme-standard .fc-scrollgrid { border-color: #e5e7eb; }
.et-cal .fc-scrollgrid { border-radius: 8px; overflow: hidden; }

/* Toolbar */
.et-cal .fc-toolbar { margin-bottom: 1.1rem !important; }
.et-cal .fc-toolbar-title { font-size: 1.35rem; font-weight: 800; color: #1e3a8a; letter-spacing: -0.01em; }
.et-cal .fc-button { border-radius: 6px; font-weight: 600; font-size: .8rem; text-transform: capitalize; box-shadow: none !important; padding: .4rem .8rem; }
.et-cal .fc-button:disabled { opacity: .45; }
.et-cal .fc-button-group > .fc-button { border-radius: 0; }
.et-cal .fc-button-group > .fc-button:first-child { border-radius: 6px 0 0 6px; }
.et-cal .fc-button-group > .fc-button:last-child { border-radius: 0 6px 6px 0; }

/* Weekday header: solid, no gradient */
.et-cal .fc-col-header-cell { background: #1e40af; border-color: #1e40af; }
.et-cal .fc-col-header-cell-cushion { color: #fff; font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 10px 4px; }

/* Day cells: plain white, no tint */
.et-cal .fc-daygrid-day { background: #fff; transition: background-color .15s; }
.et-cal .fc-daygrid-day:hover { background: #f8fafc; }
.et-cal .fc-day-other { background: #fafafa; }
.et-cal .fc-day-other .day-num { color: #9ca3af; font-weight: 500; }
.et-cal .fc-daygrid-day-top { flex-direction: row; }
.et-cal .fc-daygrid-day-number { padding: 6px 8px; text-decoration: none; }

.et-cal .day-num { display: inline-flex; align-items: center; gap: 6px; font-size: .8rem; font-weight: 600; color: #374151; }
.et-cal .day-dot { width: 6px; height: 6px; border-radius: 9999px; display: inline-block; }
.et-cal .day-dot.reserve { background: #2563eb; }
.et-cal .day-dot.borrow { background: #16a34a; }

/* Today */
.et-cal .fc-day-today { background: #fff !important; box-shadow: inset 0 0 0 2px #93c5fd; }
.et-cal .fc-day-today .day-num { color: #fff; background: #1e40af; padding: 1px 8px; border-radius: 9999px; }

/* Events: soft pills with a colored left edge */
.et-cal .fc-event { cursor: pointer; border-radius: 4px; border: 0 !important; box-shadow: none; transition: transform .1s, box-shadow .1s; }
.et-cal .fc-event:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(15, 23, 42, .15); }
.et-cal .fc-daygrid-event { padding: 2px 6px; margin-top: 2px; font-size: .75rem; }
.et-cal .fc-direction-ltr .fc-daygrid-event.fc-event-start { margin-left: 6px; }
.et-cal .fc-direction-ltr .fc-daygrid-event.fc-event-end { margin-right: 6px; }
.et-cal .ev-reserve { --c: #2563eb; --bg: #dbeafe; --tx: #1e3a8a; }
.et-cal .ev-borrow  { --c: #16a34a; --bg: #dcfce7; --tx: #14532d; }
.et-cal .ev-reserve, .et-cal .ev-borrow {
    background: var(--bg) !important;
    border: 0 solid var(--c) !important;
    border-left-width: 1px !important;
    border-right-width: 1px !important;
    color: var(--tx) !important;
}
.et-cal .fc-event-main { color: inherit; text-align: center; }
.et-cal .fc-event-main > div { justify-content: center; }

.et-cal .fc-more-link { font-size: .72rem; font-weight: 700; color: #1e40af; margin-left: 6px; }
.et-cal .fc-timegrid-slot { height: 2.6em; }
.et-cal .fc-popover { border-radius: 8px; box-shadow: 0 10px 25px rgba(15, 23, 42, .15); border-color: #e5e7eb; }
.et-cal .fc-popover-header { background: #f3f4f6; font-weight: 700; color: #1f2937; }
`;

// Static options live outside the component so their references never change.
const plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];
const headerToolbar = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
};
const buttonText = { today: 'Today', month: 'Month', week: 'Week', day: 'Day' };
const eventTimeFormat = { hour: 'numeric', minute: '2-digit', meridiem: 'short' };

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const typeOf = (e) => e.extendedProps?.type ?? (e.color === '#16a34a' ? 'borrowing' : 'reservation');

function eventClassNames(arg) {
    const type = arg.event.extendedProps?.type;
    return [type === 'borrowing' ? 'ev-borrow' : 'ev-reserve'];
}

function renderEvent(arg) {
    const p = arg.event.extendedProps || {};
    const label = p.item
        ? p.item + (p.kind === 'Equipment' && p.quantity > 1 ? ` ×${p.quantity}` : '')
        : arg.event.title;
    return (
        <div className="flex w-full items-center gap-1 overflow-hidden whitespace-nowrap">
            {arg.timeText && <span className="font-semibold opacity-80">{arg.timeText}</span>}
            <span className="truncate font-medium">{label}</span>
        </div>
    );
}

function Row({ label, children }) {
    if (children === null || children === undefined || children === '') return null;
    return (
        <div className="grid grid-cols-3 gap-2 py-2 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="col-span-2 font-medium text-gray-900">{children}</dd>
        </div>
    );
}

export default function Index() {
    const [events, setEvents] = useState([]);
    const [selected, setSelected] = useState(null);
    const lastJson = useRef('');

    // Stable reference (empty deps) so FullCalendar does not treat it as a new event source.
    const loadEvents = useCallback((info, success, failure) => {
        const params = new URLSearchParams({ start: info.startStr, end: info.endStr });
        fetch(route('calendar.events') + '?' + params.toString(), {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((r) => r.json())
            .then((data) => {
                success(data);
                // Only update React state when the data actually changed.
                const json = JSON.stringify(data);
                if (json !== lastJson.current) {
                    lastJson.current = json;
                    setEvents(data);
                }
            })
            .catch(failure);
    }, []);

    // Which days contain a borrowing and/or a reservation (for the dots on each day)
    const dayMap = useMemo(() => {
        const map = {};
        events.forEach((e) => {
            const type = typeOf(e);
            const s = new Date(e.start);
            const en = e.end ? new Date(e.end) : s;
            if (isNaN(s) || isNaN(en)) return;
            const d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
            const last = new Date(en.getFullYear(), en.getMonth(), en.getDate());
            for (let i = 0; d <= last && i < 62; i++) {
                const k = dayKey(d);
                map[k] = { ...(map[k] || {}), [type]: true };
                d.setDate(d.getDate() + 1);
            }
        });
        return map;
    }, [events]);

    const dayCellContent = useCallback((arg) => {
        const m = dayMap[dayKey(arg.date)] || {};
        return (
            <span className="day-num">
                {arg.dayNumberText}
                {m.reservation && <span className="day-dot reserve" title="Reservation" />}
                {m.borrowing && <span className="day-dot borrow" title="Borrowing" />}
            </span>
        );
    }, [dayMap]);

    const onEventClick = useCallback((info) => {
        info.jsEvent.preventDefault();
        const e = info.event;
        setSelected({
            title: e.title,
            start: e.start,
            end: e.end,
            color: e.backgroundColor,
            ...e.extendedProps,
        });
    }, []);

    const isBorrowing = selected?.type === 'borrowing' || selected?.color === '#16a34a';

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-gray-800">Calendar</h2>}>
            <Head title="Calendar" />
            <style>{css}</style>

            <div className="mb-4 flex flex-wrap items-center gap-5 text-sm text-gray-700">
                <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm border-l-4 border-blue-600 bg-blue-100" /> Reservations
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm border-l-4 border-green-600 bg-green-100" /> Borrowings
                </span>
                <span className="text-gray-500">Dots mark days with activity. Click an entry to see its details.</span>
            </div>

            <div className="et-cal rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200" style={theme}>
                <FullCalendar
                    plugins={plugins}
                    initialView="dayGridMonth"
                    headerToolbar={headerToolbar}
                    buttonText={buttonText}
                    events={loadEvents}
                    eventContent={renderEvent}
                    eventClassNames={eventClassNames}
                    eventClick={onEventClick}
                    dayCellContent={dayCellContent}
                    eventTimeFormat={eventTimeFormat}
                    dayMaxEvents={3}
                    navLinks
                    nowIndicator
                    height="auto"
                />
            </div>

            <Modal show={!!selected} onClose={() => setSelected(null)} maxWidth="md">
                {selected && (
                    <div>
                        <div className={'px-6 py-4 text-white ' + (isBorrowing ? 'bg-green-700' : 'bg-blue-800')}>
                            <div className="text-xs font-semibold uppercase tracking-widest opacity-80">
                                {isBorrowing ? 'Borrowing' : 'Reservation'}
                            </div>
                            <h3 className="text-lg font-bold">{selected.item ?? selected.title}</h3>
                        </div>

                        <dl className="divide-y divide-gray-100 px-6 py-2">
                            <Row label="Type">{selected.kind}</Row>
                            {selected.kind === 'Equipment' && <Row label="Quantity">{selected.quantity}</Row>}
                            <Row label="Requested by">{selected.requester}</Row>
                            <Row label="Department">{selected.department}</Row>
                            <Row label="Status">{selected.status && <StatusBadge status={selected.status} />}</Row>
                            <Row label={isBorrowing ? 'Borrowed' : 'From'}>{fmt(selected.from ?? selected.start)}</Row>
                            <Row label={isBorrowing ? 'Due' : 'To'}>{fmt(selected.to ?? selected.end)}</Row>
                            <Row label="Purpose">{selected.purpose}</Row>
                        </dl>

                        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                            <button type="button" onClick={() => setSelected(null)} className={btnSecondary}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}