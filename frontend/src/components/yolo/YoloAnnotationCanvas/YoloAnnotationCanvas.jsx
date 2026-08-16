import { useCallback, useEffect, useRef, useState } from 'react';
import { yoloFrameImageUrl } from '../../../api/yolo';
import {
    clientToNatural,
    getImageMetrics,
    pixelRectToYolo,
    pixelToDisplayRect,
    yoloToDisplayRect,
} from '../yoloBoxUtils';
import { BoxLabel, BoxLayer, BoxRect, CanvasWrap } from './YoloAnnotationCanvas.styles';

export function YoloAnnotationCanvas({
                                         sessionId,
                                         selectedFrame,
                                         annotations = [],
                                         selectedAnnotationId = null,
                                         editingAnnotationId = null,
                                         onSelectAnnotation,
                                         onCreateBox,
                                         onUpdateBox,
                                     }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const dragRef = useRef(null);
    const metricsRef = useRef(null);
    const callbacksRef = useRef({});
    const [draftRect, setDraftRect] = useState(null);
    const [imageMetrics, setImageMetrics] = useState(null);

    callbacksRef.current = {
        editingAnnotationId,
        onCreateBox,
        onUpdateBox,
    };

    const syncImageMetrics = useCallback(() => {
        const metrics = imgRef.current && getImageMetrics(imgRef.current);
        if (metrics && metrics.drawW > 0 && metrics.drawH > 0) {
            metricsRef.current = metrics;
            setImageMetrics(metrics);
            return metrics;
        }
        return null;
    }, []);

    useEffect(() => {
        setDraftRect(null);
        dragRef.current = null;
    }, [selectedFrame, sessionId]);

    useEffect(() => {
        window.addEventListener('resize', syncImageMetrics);
        return () => window.removeEventListener('resize', syncImageMetrics);
    }, [syncImageMetrics]);

    const finishDrag = useCallback(() => {
        const metrics = metricsRef.current;
        const drag = dragRef.current;
        dragRef.current = null;
        setDraftRect(null);

        if (!drag || !metrics) return;

        const yolo = pixelRectToYolo(
            drag.start.x,
            drag.start.y,
            drag.current.x,
            drag.current.y,
            metrics.naturalWidth,
            metrics.naturalHeight,
        );
        if (!yolo) return;

        const { editingAnnotationId: editingId, onCreateBox: create, onUpdateBox: update } =
            callbacksRef.current;

        if (editingId) update?.(editingId, yolo);
        else create?.(yolo);
    }, []);

    const handlePointerDown = (e) => {
        if (e.button != null && e.button !== 0) return;
        const m = syncImageMetrics();
        if (!m || !canvasRef.current) return;

        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = canvasRef.current.getBoundingClientRect();
        const start = clientToNatural(e.clientX, e.clientY, rect, m);
        dragRef.current = { start, current: start };
        setDraftRect(null);
    };

    const handlePointerMove = (e) => {
        const m = metricsRef.current;
        if (!dragRef.current || !m || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const current = clientToNatural(e.clientX, e.clientY, rect, m);
        dragRef.current.current = current;

        const { start } = dragRef.current;
        const display = pixelToDisplayRect(start.x, start.y, current.x, current.y, m);
        if (display.w > 2 && display.h > 2) setDraftRect(display);
    };

    const handlePointerUp = (e) => {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        finishDrag();
    };

    if (!sessionId || !selectedFrame) return null;
    const metrics = imageMetrics || metricsRef.current;

    return (
        <CanvasWrap
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <img
                ref={imgRef}
                src={yoloFrameImageUrl(sessionId, selectedFrame)}
                alt={selectedFrame}
                draggable={false}
                onLoad={syncImageMetrics}
            />
            {metrics && (
                <BoxLayer>
                    {annotations.map((box) => {
                        const rect = yoloToDisplayRect(box, metrics);
                        return (
                            <BoxRect
                                key={box.id}
                                $editing={editingAnnotationId === box.id}
                                $selected={selectedAnnotationId === box.id}
                                style={{
                                    left: rect.x,
                                    top: rect.y,
                                    width: rect.w,
                                    height: rect.h,
                                }}
                            >
                                <BoxLabel>{box.label_name}</BoxLabel>
                            </BoxRect>
                        );
                    })}
                    {draftRect && (
                        <BoxRect
                            $draft
                            style={{
                                left: draftRect.x,
                                top: draftRect.y,
                                width: draftRect.w,
                                height: draftRect.h,
                            }}
                        />
                    )}
                </BoxLayer>
            )}
        </CanvasWrap>
    );
}

export default YoloAnnotationCanvas;