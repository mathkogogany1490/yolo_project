import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChartView from '../../components/lectureRag/ChartView';
import '../../components/lectureRag/lectureRag.css';
import {
    fetchLectureDataset,
    fetchLectureState,
    sendLectureTurn,
} from '../../api/lectureRag';

function detachRecognizer(rec) {
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.onstart = null;
    try {
        rec.abort();
    } catch {
        try {
            rec.stop();
        } catch {
            /* already stopped */
        }
    }
}

function isVoiceStartCommand(text) {
    const compact = text.replace(/\s+/g, '').replace(/[.,!?~]/g, '').toLowerCase();
    return (
        compact.includes('음성인식해주세요') ||
        compact.includes('음성인식해줘') ||
        compact.includes('음성시작해 주세요'.replace(/\s+/g, '')) ||
        compact.includes('마이크켜주세요')
    );
}

function foldPcaHeard(text) {
    const aliases = [
        '피씨에이',
        '피시에이',
        '피스이에이',
        '피시아이',
        '피씨아이',
        '비씨에이',
        '티씨에이',
        '피씨에',
        '피시에',
    ];
    let next = text;
    for (const alias of [...aliases].sort((left, right) => right.length - left.length)) {
        next = next.replace(new RegExp(alias, 'gi'), 'PCA');
    }
    next = next.replace(/\bp\s*[.\s]*c\s*[.\s]*a\b/gi, 'PCA');
    next = next.replace(/\bpc\b/gi, 'PCA');
    return next;
}

function layoutCharts(charts, scene) {
    if (scene === 'iris_data') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const dataTable = charts.find((item) => item.type === 'table' && item.title.includes('원본'));
        const countsTable = charts.find((item) => item.type === 'table' && item.title.includes('품종'));
        const ordered = [bullets, dataTable, countsTable].filter(Boolean);
        if (bullets && dataTable && countsTable) {
            return { layout: 'iris', charts: ordered };
        }
    }
    if (scene === 'iris_cov_eigen') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const heatmap = charts.find((item) => item.type === 'heatmap');
        const table = charts.find((item) => item.type === 'table');
        const ordered = [bullets, heatmap, table].filter(Boolean);
        if (bullets && heatmap && table) {
            return { layout: 'iris-cov', charts: ordered };
        }
    }
    if (scene === 'iris_pca_2d' || scene === 'iris_lda') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const scatter = charts.find((item) => item.type === 'scatter');
        const table = charts.find((item) => item.type === 'table');
        const ordered = [bullets, scatter, table].filter(Boolean);
        if (bullets && scatter && table) {
            return { layout: 'iris-pca', charts: ordered };
        }
    }
    if (scene === 'summary') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const biplot = charts.find((item) => item.type === 'biplot');
        const explain = charts.find((item) => item.type === 'table');
        const ordered = [bullets, biplot, explain].filter(Boolean);
        if (bullets && biplot) {
            return { layout: 'summary', charts: ordered };
        }
    }
    if (scene !== 'eigen_demo') {
        return { layout: 'default', charts };
    }
    const bullets = charts.find((item) => item.type === 'bullets');
    const scatter = charts.find((item) => item.type === 'eigen_scatter');
    const table = charts.find((item) => item.type === 'table');
    const ordered = [bullets, scatter, table].filter(Boolean);
    if (scatter && table) {
        return { layout: 'eigen', charts: ordered.length > 0 ? ordered : charts };
    }
    return { layout: 'default', charts };
}

function paneClass(layout, item) {
    if (layout === 'eigen' && item.type === 'bullets') return 'chart-pane eigen-bullets-pane';
    if (layout === 'eigen' && item.type === 'table') return 'chart-pane eigen-table-pane';
    if (layout === 'eigen' && item.type === 'eigen_scatter') return 'chart-pane eigen-graph-pane';
    if (layout === 'summary' && item.type === 'bullets') return 'chart-pane summary-bullets-pane';
    if (layout === 'summary' && item.type === 'biplot') return 'chart-pane summary-biplot-pane';
    if (layout === 'summary' && item.type === 'table') return 'chart-pane summary-explain-pane';
    if (layout === 'iris-pca' && item.type === 'bullets') return 'chart-pane iris-pca-bullets-pane';
    if (layout === 'iris-pca' && item.type === 'scatter') return 'chart-pane iris-pca-scatter-pane';
    if (layout === 'iris-pca' && item.type === 'table') return 'chart-pane iris-pca-table-pane';
    if (layout === 'iris-cov' && item.type === 'bullets') return 'chart-pane iris-cov-bullets-pane';
    if (layout === 'iris-cov' && item.type === 'heatmap') return 'chart-pane iris-cov-heatmap-pane';
    if (layout === 'iris-cov' && item.type === 'table') return 'chart-pane iris-cov-eigen-pane';
    if (layout === 'iris' && item.type === 'bullets') return 'chart-pane iris-bullets-pane';
    if (layout === 'iris' && item.type === 'table' && item.title.includes('원본')) {
        return 'chart-pane iris-data-pane';
    }
    if (layout === 'iris' && item.type === 'table' && item.title.includes('품종')) {
        return 'chart-pane iris-counts-pane';
    }
    return 'chart-pane';
}

const SCENE_IDS = new Set([
    'intro',
    'eigen_demo',
    'iris_data',
    'iris_cov_eigen',
    'iris_pca_2d',
    'iris_lda',
    'summary',
]);

export function LectureRagPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dataset, setDataset] = useState(null);
    const [turn, setTurn] = useState(null);
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState('');
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const sceneRef = useRef('intro');
    const recRef = useRef(null);
    const listeningRef = useRef(false);
    const requestRef = useRef(0);
    const chartGridRef = useRef(null);
    const handledSceneRef = useRef(null);
    const requestedScene = searchParams.get('scene');

    useEffect(() => {
        const initialScene = searchParams.get('scene') || null;
        Promise.all([fetchLectureDataset(), fetchLectureState()])
            .then(([info, state]) => {
                setDataset(info);
                setTurn(state);
                sceneRef.current = state.scene;
                handledSceneRef.current = state.scene;
                if (initialScene && SCENE_IDS.has(initialScene) && initialScene !== state.scene) {
                    handledSceneRef.current = initialScene;
                    void applyTurn(initialScene, true);
                }
            })
            .catch(() => {
                setNotice('백엔드에 연결하지 못했습니다. FastAPI가 8000 포트에서 실행 중인지 확인하세요.');
            });
    }, []);

    useEffect(() => {
        if (!requestedScene || !SCENE_IDS.has(requestedScene)) return;
        if (handledSceneRef.current === requestedScene) return;
        if (sceneRef.current === requestedScene) {
            handledSceneRef.current = requestedScene;
            return;
        }
        handledSceneRef.current = requestedScene;
        void applyTurn(requestedScene, true);
    }, [requestedScene]);

    useEffect(() => () => {
        listeningRef.current = false;
        detachRecognizer(recRef.current);
        recRef.current = null;
    }, []);

    async function applyTurn(text, fromMenu = false) {
        const cleaned = foldPcaHeard(text.trim());
        if (!cleaned) return;
        if (!fromMenu && isVoiceStartCommand(cleaned)) {
            setDraft('');
            setInterim('');
            if (listeningRef.current) {
                setNotice('이미 음성 인식 중입니다.');
                return;
            }
            startListening();
            return;
        }
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        setBusy(true);
        setNotice('');
        try {
            const next = await sendLectureTurn(cleaned, sceneRef.current, fromMenu);
            if (requestId !== requestRef.current) return;
            const info = await fetchLectureDataset();
            if (requestId !== requestRef.current) return;
            sceneRef.current = next.scene;
            handledSceneRef.current = next.scene;
            setTurn(next);
            setDataset(info);
            setDraft('');
            setInterim('');
        } catch {
            if (requestId !== requestRef.current) return;
            setNotice('화면을 바꾸지 못했습니다. 백엔드가 8000 포트에서 실행 중인지 확인하세요.');
        } finally {
            if (requestId === requestRef.current) setBusy(false);
        }
    }

    async function startListening() {
        if (listeningRef.current) {
            setNotice('이미 음성 인식 중입니다.');
            return;
        }

        const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Ctor) {
            setNotice('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge에서 열어 주세요.');
            return;
        }
        if (!window.isSecureContext) {
            setNotice('음성 인식은 localhost 또는 https에서만 동작합니다.');
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setNotice('이 브라우저에서는 마이크를 사용할 수 없습니다.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
        } catch {
            setNotice('마이크 권한이 필요합니다. 주소창 왼쪽에서 마이크를 허용해 주세요.');
            return;
        }

        detachRecognizer(recRef.current);

        const rec = new Ctor();
        rec.lang = 'ko-KR';
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        recRef.current = rec;
        listeningRef.current = true;

        rec.onstart = () => {
            setListening(true);
            setNotice('마이크가 켜졌습니다. PCA 보여 주세요처럼 말씀해 주세요.');
        };

        rec.onresult = (event) => {
            let live = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const piece = event.results[i][0].transcript.trim();
                if (!piece) continue;
                if (event.results[i].isFinal) {
                    setInterim('');
                    void applyTurn(piece);
                } else {
                    live += piece;
                }
            }
            if (live) setInterim(live);
        };

        rec.onerror = (event) => {
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }
            listeningRef.current = false;
            detachRecognizer(recRef.current);
            recRef.current = null;
            setListening(false);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setNotice('마이크 사용이 거부되었습니다. Chrome 주소창에서 마이크를 허용해 주세요.');
                return;
            }
            if (event.error === 'network') {
                setNotice('음성 인식 서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
                return;
            }
            setNotice(`음성 인식 오류: ${event.error}`);
        };

        rec.onend = () => {
            if (!listeningRef.current) {
                setListening(false);
                return;
            }
            window.setTimeout(() => {
                if (!listeningRef.current || recRef.current !== rec) return;
                try {
                    rec.start();
                } catch {
                    listeningRef.current = false;
                    detachRecognizer(recRef.current);
                    recRef.current = null;
                    setListening(false);
                    setNotice('음성 인식이 중단되었습니다. 음성 버튼을 다시 눌러 주세요.');
                }
            }, 300);
        };

        try {
            rec.start();
        } catch {
            listeningRef.current = false;
            detachRecognizer(rec);
            recRef.current = null;
            setListening(false);
            setNotice('음성 인식을 시작하지 못했습니다. Chrome에서 다시 눌러 주세요.');
        }
    }

    function stopListening() {
        listeningRef.current = false;
        detachRecognizer(recRef.current);
        recRef.current = null;
        setListening(false);
        setInterim('');
    }

    const rawCharts =
        turn?.charts && turn.charts.length > 0
            ? turn.charts.filter((item) => item.type !== 'none')
            : turn?.chart && turn.chart.type !== 'none'
              ? [turn.chart]
              : [];
    const { layout, charts: visibleCharts } = layoutCharts(rawCharts, turn?.scene);
    const isEigenLayout = layout === 'eigen';
    const isIrisLayout = layout === 'iris';
    const isIrisCovLayout = layout === 'iris-cov';
    const isIrisPcaLayout = layout === 'iris-pca';
    const isSummaryLayout = layout === 'summary';

    useLayoutEffect(() => {
        if (!isSummaryLayout) return;
        const grid = chartGridRef.current;
        if (!grid) return;

        const align = () => {
            const pane = grid.querySelector('.summary-biplot-pane');
            const pc1 = grid.querySelector('.summary-biplot-pane .biplot-x-label');
            const items = grid.querySelectorAll('.summary-bullets-pane .intro-summary-list li');
            const arrowItem = Array.from(items).find((el) => (el.textContent ?? '').startsWith('화살표'));
            if (!pane || !pc1 || !arrowItem) return;

            pane.style.setProperty('--biplot-shift', '0px');
            const range = document.createRange();
            range.selectNodeContents(arrowItem);
            const rects = Array.from(range.getClientRects());
            if (rects.length === 0) return;
            const textRight = Math.max(...rects.map((rect) => rect.right));
            const pc1Left = pc1.getBoundingClientRect().left;
            pane.style.setProperty('--biplot-shift', `${Math.round(textRight - pc1Left) - 54}px`);
        };

        align();
        const observer = new ResizeObserver(align);
        observer.observe(grid);
        window.addEventListener('resize', align);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', align);
        };
    }, [isSummaryLayout, visibleCharts]);

    const gridClass =
        visibleCharts.length > 1
            ? isEigenLayout
                ? 'chart-grid eigen-layout'
                : isSummaryLayout
                  ? 'chart-grid summary-layout'
                  : isIrisPcaLayout
                    ? 'chart-grid iris-pca-layout'
                    : isIrisCovLayout
                      ? 'chart-grid iris-cov-layout'
                      : isIrisLayout
                        ? 'chart-grid iris-layout'
                        : 'chart-grid'
            : 'chart-frame';

    return (
        <div className="lecture-rag-shell">
            <main className="stage">
                <div className="stage-body">
                    {notice ? <p className="lecture-notice">{notice}</p> : null}
                    {turn?.heard ? <p className="stage-heard">들은 말 · {turn.heard}</p> : null}
                    {turn?.explanation ? <p className="stage-caption">{turn.explanation}</p> : null}
                    {visibleCharts.length > 0 ? (
                        <div ref={chartGridRef} className={gridClass}>
                            {visibleCharts.map((item, index) => (
                                <div
                                    key={`${item.type}-${item.title}-${index}`}
                                    className={paneClass(layout, item)}
                                >
                                    {(visibleCharts.length > 1 ||
                                        isEigenLayout ||
                                        isIrisLayout ||
                                        isIrisCovLayout ||
                                        isIrisPcaLayout ||
                                        isSummaryLayout) &&
                                    item.type !== 'bullets' ? (
                                        <p className="chart-pane-title">{item.title}</p>
                                    ) : null}
                                    {(isEigenLayout ||
                                        isIrisLayout ||
                                        isIrisCovLayout ||
                                        isIrisPcaLayout ||
                                        (isSummaryLayout && item.variant !== 'intro')) &&
                                    item.type === 'bullets' ? (
                                        <p className="chart-pane-title">{item.title}</p>
                                    ) : null}
                                    <ChartView chart={item} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="talk-card">
                            <h3>{turn?.title}</h3>
                            <p>{turn?.explanation ?? '왼쪽 장면을 선택하거나 아래에 말씀해 주세요.'}</p>
                        </div>
                    )}
                </div>

                <footer className="stage-footer">
                    <button
                        type="button"
                        className={listening ? 'lecture-btn listening' : 'lecture-btn'}
                        onClick={() => void (listening ? stopListening() : startListening())}
                    >
                        {listening ? '듣는 중' : '음성'}
                    </button>
                    <input
                        className="lecture-input"
                        value={listening ? interim || draft : draft}
                        readOnly={listening}
                        placeholder={listening ? '듣고 있습니다…' : '무엇을 보여 줄지 입력하세요'}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') void applyTurn(draft);
                        }}
                    />
                    <button
                        type="button"
                        className="lecture-btn primary"
                        disabled={busy}
                        onClick={() => void applyTurn(draft)}
                    >
                        {busy ? '...' : '전송'}
                    </button>
                </footer>
            </main>
        </div>
    );
}

export default LectureRagPage;
