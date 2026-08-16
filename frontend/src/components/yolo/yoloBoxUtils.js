export const YOLO_STEPS = [
    { id: 1, label: '① 프레임 추출' },
    { id: 2, label: '② 박스 라벨링' },
    { id: 3, label: '③ YOLO 훈련' },
];

export function getImageMetrics(img) {
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    if (!naturalWidth || !naturalHeight) return null;
    const scale = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
    const drawW = naturalWidth * scale;
    const drawH = naturalHeight * scale;
    return {
        naturalWidth,
        naturalHeight,
        offsetX: (clientWidth - drawW) / 2,
        offsetY: (clientHeight - drawH) / 2,
        drawW,
        drawH,
    };
}

export function clientToNatural(clientX, clientY, containerRect, metrics) {
    const x = clientX - containerRect.left - metrics.offsetX;
    const y = clientY - containerRect.top - metrics.offsetY;
    return {
        x: Math.min(metrics.naturalWidth, Math.max(0, (x / metrics.drawW) * metrics.naturalWidth)),
        y: Math.min(metrics.naturalHeight, Math.max(0, (y / metrics.drawH) * metrics.naturalHeight)),
    };
}

export function pixelRectToYolo(x1, y1, x2, y2, width, height) {
    const left = Math.max(0, Math.min(x1, x2));
    const top = Math.max(0, Math.min(y1, y2));
    const right = Math.min(width, Math.max(x1, x2));
    const bottom = Math.min(height, Math.max(y1, y2));
    const w = right - left;
    const h = bottom - top;
    if (w < 2 || h < 2) return null;
    return {
        x: Math.min(1, Math.max(0, (left + w / 2) / width)),
        y: Math.min(1, Math.max(0, (top + h / 2) / height)),
        w: Math.min(1, w / width),
        h: Math.min(1, h / height),
    };
}

export function pixelToDisplayRect(x1, y1, x2, y2, metrics) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    return {
        x: left * (metrics.drawW / metrics.naturalWidth) + metrics.offsetX,
        y: top * (metrics.drawH / metrics.naturalHeight) + metrics.offsetY,
        w: Math.abs(x2 - x1) * (metrics.drawW / metrics.naturalWidth),
        h: Math.abs(y2 - y1) * (metrics.drawH / metrics.naturalHeight),
    };
}

export function yoloToDisplayRect(box, metrics) {
    const { naturalWidth: nw, naturalHeight: nh, drawW, drawH, offsetX, offsetY } = metrics;
    const w = box.w * nw * (drawW / nw);
    const h = box.h * nh * (drawH / nh);
    return {
        x: box.x * nw * (drawW / nw) - w / 2 + offsetX,
        y: box.y * nh * (drawH / nh) - h / 2 + offsetY,
        w,
        h,
    };
}