import { useEffect, useRef, useState } from 'react';
import './ImageViewerModal.css';

type Props = {
    open: boolean;
    src: string;
    alt?: string;
    onClose: () => void;
};

export const ImageViewerModal = ({ open, src, alt, onClose }: Props) => {
    const [zoom, setZoom] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const dragging = useRef(false);
    const start = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!open) return;
        setZoom(1);
        setPos({ x: 0, y: 0 });
    }, [open]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => Math.min(4, Math.max(1, +(z + delta).toFixed(2))));
    };

    const onMouseDown = (e: React.MouseEvent) => {
        dragging.current = true;
        start.current = { x: e.clientX, y: e.clientY };
        startPos.current = { ...pos };
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragging.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        setPos({ x: startPos.current.x + dx, y: startPos.current.y + dy });
    };

    const onMouseUp = () => {
        dragging.current = false;
    };

    // Touch (mobile)
    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        dragging.current = true;
        start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        startPos.current = { ...pos };
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!dragging.current || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - start.current.x;
        const dy = e.touches[0].clientY - start.current.y;
        setPos({ x: startPos.current.x + dx, y: startPos.current.y + dy });
    };

    const onTouchEnd = () => {
        dragging.current = false;
    };

    return (
        <div className="iv-backdrop" onClick={onClose}>
            <div className="iv-modal" onClick={(e) => e.stopPropagation()}>
                <div className="iv-topbar">
                    <div className="iv-actions">
                        <button className="btn-ghost" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}>−</button>
                        <div className="iv-zoom">{Math.round(zoom * 100)}%</div>
                        <button className="btn-ghost" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}>+</button>
                        <button className="btn-ghost" onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }); }}>Reset</button>
                    </div>

                    <button className="btn-ghost" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div
                    className="iv-stage"
                    onWheel={onWheel}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <img
                        className="iv-img"
                        src={src}
                        alt={alt || 'image'}
                        draggable={false}
                        style={{
                            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                            cursor: zoom > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'default'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};