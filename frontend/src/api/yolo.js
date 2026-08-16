import { API_BASE_URL, apiRequest } from './client';

/**
 * backend /yolo (yolo_router) 연결
 *
 * Labels: GET/POST /labels, PUT/DELETE /labels/{id}, POST /labels/resolve
 * Frames: POST /frames/extract, GET /frames/{session_id}, GET .../file/{filename}
 * Annotations: GET/POST/PUT/DELETE /annotations...
 * Train/Predict: POST /train, POST /predict, POST /predict/video, GET /predict/video/{job_id}/file
 */

export function yoloFrameImageUrl(sessionId, filename) {
    return `${API_BASE_URL}/yolo/frames/${encodeURIComponent(sessionId)}/file/${encodeURIComponent(filename)}`;
}

export function yoloPredictVideoUrl(jobId) {
    return `${API_BASE_URL}/yolo/predict/video/${encodeURIComponent(jobId)}/file`;
}

function buildPredictFormData(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conf', String(options.conf ?? 0.25));
    formData.append('device', options.device ?? 'auto');
    return formData;
}

export function yoloHealth() {
    return apiRequest('/yolo/health');
}

export function listYoloLabels() {
    return apiRequest('/yolo/labels');
}

export function createYoloLabel(body) {
    return apiRequest('/yolo/labels', { method: 'POST', body });
}

export function resolveYoloLabel(body) {
    return apiRequest('/yolo/labels/resolve', { method: 'POST', body });
}

export function updateYoloLabel(labelId, body) {
    return apiRequest(`/yolo/labels/${labelId}`, { method: 'PUT', body });
}

export function deleteYoloLabel(labelId) {
    return apiRequest(`/yolo/labels/${labelId}`, { method: 'DELETE' });
}

/** 영상 균등 추출 — Form: file, frame_count */
export function extractYoloFrames(file, frameCount) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('frame_count', String(frameCount));
    return apiRequest('/yolo/frames/extract', { method: 'POST', body: formData });
}

export function listYoloFrames(sessionId) {
    return apiRequest(`/yolo/frames/${encodeURIComponent(sessionId)}`);
}

export function listYoloAnnotations(sessionId, options = {}) {
    const params = new URLSearchParams();
    if (options.frame) params.set('frame', options.frame);
    const query = params.toString();
    return apiRequest(
        `/yolo/annotations/${encodeURIComponent(sessionId)}${query ? `?${query}` : ''}`,
    );
}

export function createYoloAnnotation(body) {
    return apiRequest('/yolo/annotations', { method: 'POST', body });
}

export function updateYoloAnnotation(sessionId, annotationId, body) {
    return apiRequest(
        `/yolo/annotations/${encodeURIComponent(sessionId)}/${encodeURIComponent(annotationId)}`,
        { method: 'PUT', body },
    );
}

export function deleteYoloAnnotation(sessionId, annotationId) {
    return apiRequest(
        `/yolo/annotations/${encodeURIComponent(sessionId)}/${encodeURIComponent(annotationId)}`,
        { method: 'DELETE' },
    );
}

/** body: { session_ids?, epochs?, imgsz?, batch?, val_ratio?, device? } */
export function trainYoloModel(body = {}) {
    return apiRequest('/yolo/train', { method: 'POST', body });
}

/** 이미지 탐지 — Form: file, conf, device */
export function predictYolo(file, options = {}) {
    return apiRequest('/yolo/predict', {
        method: 'POST',
        body: buildPredictFormData(file, options),
    });
}

/** 영상 탐지 — 결과는 yoloPredictVideoUrl(job_id)로 재생 */
export function predictYoloVideo(file, options = {}) {
    return apiRequest('/yolo/predict/video', {
        method: 'POST',
        body: buildPredictFormData(file, options),
    });
}