import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Three-line (hamburger) dropdown for table row actions.
 *
 * items: array of { label, onClick, tone?: 'danger' }.
 * Falsy entries are ignored, so you can write: cond && { label, onClick }.
 *
 * The menu is rendered in a portal with fixed positioning so the table's
 * overflow-x-auto wrapper can never clip it.
 */
export default function ActionMenu({ items = [], label = 'Actions' }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    const visible = items.filter(Boolean);

    // Position under the button, right-aligned; flip above if there is no room.
    useLayoutEffect(() => {
        if (!open || !btnRef.current || !menuRef.current) return;
        const b = btnRef.current.getBoundingClientRect();
        const mh = menuRef.current.offsetHeight;
        const mw = menuRef.current.offsetWidth;

        let top = b.bottom + 4;
        if (top + mh > window.innerHeight - 8) top = Math.max(8, b.top - mh - 4);

        const left = Math.min(Math.max(8, b.right - mw), window.innerWidth - mw - 8);
        setPos({ top, left });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        const onDown = (e) => {
            if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
            close();
        };
        const onKey = (e) => e.key === 'Escape' && close();

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    if (visible.length === 0) return null;

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                className={'inline-flex h-8 w-8 items-center justify-center border text-blue-800 transition ' +
                    (open
                        ? 'border-blue-700 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-blue-700 hover:bg-blue-50')}
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    style={{ position: 'fixed', top: pos.top, left: pos.left }}
                    className="z-50 min-w-[10rem] border border-gray-200 bg-white py-1 text-left shadow-lg ring-1 ring-black/5"
                >
                    {visible.map((it) => (
                        <button
                            key={it.label}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                it.onClick();
                            }}
                            className={'block w-full px-4 py-2 text-left text-sm ' +
                                (it.tone === 'danger'
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800')}
                        >
                            {it.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}