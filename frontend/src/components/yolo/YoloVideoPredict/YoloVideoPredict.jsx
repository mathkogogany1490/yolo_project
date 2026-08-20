import { useCallback, useEffect, useRef, useState } from 'react';
import { predictYolo } from '../../../api/yolo';
import { RowButton } from '../RowButton';
import {
    ErrorText,
    FieldLabel,
    TextInput,
} from '../shared.styles';
import {
    ControlRow,
    DropHint,
    DropIcon,
    DropZone,
    FileName,
    HiddenFile,
    LiveBadge,
    OverlayCanvas,
    PredictRoot,
    VideoStage,
} from './YoloVideoPredict.styles';

const BOX_COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#a855f7'];

function DownloadIcon() {
    return (
        <DropIcon viewBox="0 0 48 48" aria-hidden="true">
            <path
                d="M24 6v24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M16 22l8 8 8-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 36h28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M8 42h32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </DropIcon>
    );
}

/** video 요소 박스 = 실제 화면 (height:auto, letterbox 없음) */
function syncCanvasSize(canvas, video) {
    if (!canvas || !video) return { w: 0, h: 0 };
    const w = Math.max(1, Math.round(video.clientWidth));
    const h = Math.max(1, Math.round(video.clientHeight));
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    return { w, h };
}

function drawDetections(canvas, video, detections) {
    if (!canvas || !video) return;
    const { w, h } = syncCanvasSize(canvas, video);
    if (!w || !h) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    (detections || []).forEach((det, i) => {
        const bw = det.w * w;
        const bh = det.h * h;
        const bx = det.x * w - bw / 2;
        const by = det.y * h - bh / 2;
        const color = BOX_COLORS[(det.label_id ?? i) % BOX_COLORS.length];

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);

        const label = `${det.label_name} ${Math.round((det.confidence || 0) * 100)}%`;
        ctx.font = 'bold 13px sans-serif';
        const tw = ctx.measureText(label).width + 10;
        const ty = Math.max(0, by - 20);
        ctx.fillStyle = color;
        ctx.fillRect(bx, ty, tw, 20);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, bx + 5, ty + 14);
    });
}

/** 전송용 프레임 (가로 최대 640 → 응답 빠르게) */
function captureFrameBlob(video) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return Promise.resolve(null);

    const maxW = 640;
    const scale = Math.min(1, maxW / vw);
    const tw = Math.round(vw * scale);
    const th = Math.round(vh * scale);

    const snap = document.createElement('canvas');
    snap.width = tw;
    snap.height = th;
    snap.getContext('2d').drawImage(video, 0, 0, tw, th);

    return new Promise((resolve) => snap.toBlob(resolve, 'image/jpeg', 0.8));
}

export function YoloVideoPredict() {
    const videoInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const sourceUrlRef = useRef('');
    const liveRef = useRef(true);
    const confRef = useRef(0.05);
    const detectionsRef = useRef([]);
    const loopIdRef = useRef(0);

    const [videoName, setVideoName] = useState('');
    const [sourceVideoUrl, setSourceVideoUrl] = useState('');
    const [conf, setConf] = useState('0.05');
    const [dragging, setDragging] = useState(false);
    const [liveOn, setLiveOn] = useState(true);
    const [error, setError] = useState('');
    const [lastCount, setLastCount] = useState(0);

    useEffect(() => {
        confRef.current = Number(conf) || 0.05;
    }, [conf]);
    useEffect(() => {
        liveRef.current = liveOn;
    }, [liveOn]);

    const redraw = useCallback(() => {
        drawDetections(canvasRef.current, videoRef.current, detectionsRef.current);
    }, []);

    useEffect(() => {
        return () => {
            loopIdRef.current += 1;
            if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !sourceVideoUrl) return undefined;

        video.src = sourceVideoUrl;
        video.load();

        const onReady = () => {
            syncCanvasSize(canvasRef.current, video);
            redraw();
            video.play().catch(() => {});
        };

        const ro = new ResizeObserver(() => redraw());
        ro.observe(video);
        video.addEventListener('loadeddata', onReady);
        video.addEventListener('seeked', redraw);
        window.addEventListener('resize', redraw);

        return () => {
            ro.disconnect();
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('seeked', redraw);
            window.removeEventListener('resize', redraw);
        };
    }, [sourceVideoUrl, redraw]);

    useEffect(() => {
        if (!liveOn || !sourceVideoUrl) {
            loopIdRef.current += 1;
            detectionsRef.current = [];
            setLastCount(0);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return undefined;
        }

        const myId = ++loopIdRef.current;
        let active = true;

        const tick = async () => {
            while (active && liveRef.current && loopIdRef.current === myId) {
                const video = videoRef.current;
                if (!video || video.readyState < 2) {
                    await new Promise((r) => setTimeout(r, 100));
                    continue;
                }

                try {
                    const blob = await captureFrameBlob(video);
                    if (!blob || !active || loopIdRef.current !== myId) break;

                    const file = new File([blob], 'live-frame.jpg', {
                        type: 'image/jpeg',
                    });
                    const result = await predictYolo(file, {
                        conf: confRef.current,
                        device: 'auto',
                    });

                    if (!active || loopIdRef.current !== myId || !liveRef.current) break;

                    const detections = result?.detections ?? [];
                    detectionsRef.current = detections;
                    setLastCount(detections.length);
                    setError('');
                    drawDetections(canvasRef.current, videoRef.current, detections);
                } catch (err) {
                    if (active && loopIdRef.current === myId) {
                        setError(err?.message || '실시간 탐지 실패');
                    }
                    await new Promise((r) => setTimeout(r, 300));
                }
            }
        };

        tick();

        return () => {
            active = false;
            loopIdRef.current += 1;
        };
    }, [liveOn, sourceVideoUrl]);

    const handleVideoSelect = (file) => {
        if (!file || !file.type.startsWith('video/')) return;

        if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
        const url = URL.createObjectURL(file);
        sourceUrlRef.current = url;

        detectionsRef.current = [];
        setVideoName(file.name);
        setSourceVideoUrl(url);
        setLiveOn(true);
        setError('');
        setLastCount(0);
    };

    return (
        <PredictRoot>
            {!sourceVideoUrl ? (
                <DropZone
                    $dragging={dragging}
                    onClick={() => videoInputRef.current?.click()}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setDragging(false);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        handleVideoSelect(e.dataTransfer.files?.[0]);
                    }}
                >
                    <HiddenFile
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                            handleVideoSelect(e.target.files?.[0]);
                            e.target.value = '';
                        }}
                    />
                    <DownloadIcon />
                    <DropHint>영상을 여기에 놓거나 클릭하여 가져오기</DropHint>
                </DropZone>
            ) : (
                <>
                    <VideoStage>
                        <video
                            ref={videoRef}
                            style={{
                                display: 'block',
                                width: '100%',
                                height: 'auto',
                                background: '#0f172a',
                            }}
                            controls
                            playsInline
                            muted
                            preload="auto"
                        />
                        <OverlayCanvas ref={canvasRef} />
                    </VideoStage>

                    <ControlRow>
                        <FieldLabel>
                            confidence
                            <TextInput
                                type="number"
                                min={0.01}
                                max={1}
                                step={0.01}
                                value={conf}
                                onChange={(e) => setConf(e.target.value)}
                            />
                        </FieldLabel>
                        <RowButton type="button" onClick={() => videoInputRef.current?.click()}>
                            영상 변경
                        </RowButton>
                        <RowButton type="button" onClick={() => setLiveOn((v) => !v)}>
                            {liveOn ? '박스 끄기' : '박스 켜기'}
                        </RowButton>
                        <LiveBadge $on={liveOn}>
                            {liveOn ? `박스 ON · ${lastCount}` : '박스 OFF'}
                        </LiveBadge>
                        <HiddenFile
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                                handleVideoSelect(e.target.files?.[0]);
                                e.target.value = '';
                            }}
                        />
                    </ControlRow>
                    {videoName ? <FileName>{videoName}</FileName> : null}
                </>
            )}

            {error ? <ErrorText>{error}</ErrorText> : null}
        </PredictRoot>
    );
}

export default YoloVideoPredict;
