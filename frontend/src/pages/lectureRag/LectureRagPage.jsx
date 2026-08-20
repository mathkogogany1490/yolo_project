import { useEffect, useRef, useState } from 'react';
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

function renderSummaryChartPane(item) {
    const showTitle = Boolean(item.title) && item.type !== 'bullets' && item.type !== 'biplot';
    return (
        <>
            {showTitle ? <p className="chart-pane-title">{item.title}</p> : null}
            <ChartView chart={item} />
        </>
    );
}

function SummaryLayout({ charts }) {
    const bullets = charts.find((item) => item.type === 'bullets');
    const biplot = charts.find((item) => item.type === 'biplot');
    const eigenTable = charts.find(
        (item) => item.type === 'table' && item.columns?.some((col) => col.includes('성분 4축')),
    );
    const lengthTable = charts.find(
        (item) => item.type === 'table' && item.columns?.includes('길이'),
    );

    return (
        <>
            <div className="summary-left-column">
                {bullets ? (
                    <div className="chart-pane summary-bullets-pane">{renderSummaryChartPane(bullets)}</div>
                ) : null}
                {biplot ? (
                    <div className="chart-pane summary-biplot-pane">{renderSummaryChartPane(biplot)}</div>
                ) : null}
            </div>
            <div className="summary-right-column">
                {eigenTable ? (
                    <div className="chart-pane summary-eigen-pane">{renderSummaryChartPane(eigenTable)}</div>
                ) : null}
                {lengthTable ? (
                    <div className="chart-pane summary-length-pane">{renderSummaryChartPane(lengthTable)}</div>
                ) : null}
            </div>
        </>
    );
}

function compactHeard(text) {
    return text.replace(/\s+/g, '').replace(/[.,!?~]/g, '').toLowerCase();
}

function isVoiceStartCommand(text) {
    const compact = compactHeard(text);
    return (
        compact.includes('음성인식해주세요') ||
        compact.includes('음성인식해줘') ||
        compact.includes('음성시작해주세요') ||
        compact.includes('마이크켜주세요')
    );
}

function isCompleteCommand(text) {
    const compact = compactHeard(text);
    return (
        compact.includes('보여줘') ||
        compact.includes('보여줘요') ||
        compact.includes('보여주') ||
        compact.includes('다음그래프') ||
        compact.includes('다음화면') ||
        compact.includes('다음차트')
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
        '오티씨에이',
        '피씨에',
        '피시에',
        '피씨',
        '피시',
        'pc에이',
        'pc야',
    ];
    let next = text;
    for (const alias of [...aliases].sort((left, right) => right.length - left.length)) {
        next = next.replace(new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'PCA');
    }
    next = next.replace(/\bp\s*[.\s]*c\s*[.\s]*a\b/gi, 'PCA');
    next = next.replace(/\bpc\b/gi, 'PCA');
    next = next.replace(/보여?\s*주세[요세요]?/g, '보여 주세요');
    next = next.replace(/보여줘/g, '보여 주세요');
    return next;
}

function foldSvdHeard(text) {
    const aliases = ['에쓰브이디', '에스브이디', '에스비디', '에스브디'];
    let next = text;
    for (const alias of [...aliases].sort((left, right) => right.length - left.length)) {
        next = next.replace(new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'SVD');
    }
    next = next.replace(/\bs\s*[.\s]*v\s*[.\s]*d\b/gi, 'SVD');
    next = next.replace(/행열\s*분해/g, '행렬 분해');
    return next;
}

function foldMfHeard(text) {
    const aliases = ['엠에프', '엠 에프'];
    let next = text;
    for (const alias of [...aliases].sort((left, right) => right.length - left.length)) {
        next = next.replace(new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'MF');
    }
    next = next.replace(/\bm\s*[.\s]*f\b/gi, 'MF');
    return next;
}

function foldTransformerHeard(text) {
    const aliases = ['트랜스퍼머', '트랜스포마', '트랜스포머'];
    let next = text;
    for (const alias of [...aliases].sort((left, right) => right.length - left.length)) {
        next = next.replace(new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'Transformer');
    }
    next = next.replace(/어탠션|어텐숀|어텐션/g, 'Attention');
    next = next.replace(/쿼리\s*,?\s*키/g, 'Query Key');
    next = next.replace(/query\s*,?\s*key/gi, 'Query Key');
    return next;
}

function foldHeard(text) {
    return foldTransformerHeard(foldMfHeard(foldSvdHeard(foldPcaHeard(text))));
}

const HEARD_HINTS = [
    '보여줘',
    '보여줘요',
    'pca',
    '피씨',
    '피시',
    '비씨',
    '주성분',
    '고유',
    '고윳',
    '붓꽃',
    '아이리스',
    '공분산',
    '선형',
    '판별',
    'lda',
    '요약',
    '바이플롯',
    '예측',
    'svd',
    '에스브이디',
    '에스비디',
    '특이값',
    '영화평점',
    '평점',
    '행렬분해',
    '행렬 분해',
    'mf',
    '엠에프',
    '임베딩',
    'embedding',
    '계산',
    '구조도',
    'transformer',
    '트랜스포머',
    'query',
    'key',
    '쿼리',
    'attention',
    '어텐션',
];

function pickHeard(result) {
    let best = result[0]?.transcript ?? '';
    let bestScore = -1;
    for (let i = 0; i < result.length; i += 1) {
        const text = result[i].transcript ?? '';
        const compact = compactHeard(text);
        const hints = HEARD_HINTS.filter((hint) => compact.includes(hint)).length;
        const score = hints * 2 + (result[i].confidence || 0);
        if (score > bestScore) {
            bestScore = score;
            best = text;
        }
    }
    return best.trim();
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
        const heatmap = charts.find((item) => item.type === 'heatmap');
        const table = charts.find((item) => item.type === 'table');
        const ordered = [heatmap, table].filter(Boolean);
        if (heatmap && table) {
            return { layout: 'iris-cov', charts: ordered };
        }
    }
    if (scene === 'iris_pca_2d') {
        const scatter = charts.find((item) => item.type === 'scatter');
        const table = charts.find((item) => item.type === 'table');
        const ordered = [scatter, table].filter(Boolean);
        if (scatter && table) {
            return { layout: 'iris-pca', charts: ordered };
        }
    }
    if (scene === 'iris_lda') {
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
        const eigenTable = charts.find(
            (item) => item.type === 'table' && item.columns?.some((col) => col.includes('성분 4축')),
        );
        const lengthTable = charts.find(
            (item) => item.type === 'table' && item.columns?.includes('길이'),
        );
        const ordered = [bullets, biplot, eigenTable, lengthTable].filter(Boolean);
        if (bullets && biplot && eigenTable && lengthTable) {
            return { layout: 'summary', charts: ordered };
        }
    }
    if (scene === 'mf_embedding') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const pdf = charts.find(
            (item) => item.type === 'distribution_line' && item.variant === 'pdf',
        );
        const class1 = charts.find((item) => item.type === 'table' && item.title === '클래스1 임베딩');
        const class2 = charts.find((item) => item.type === 'table' && item.title === '클래스2 임베딩');
        const ordered = [bullets, pdf, class1, class2].filter(Boolean);
        if (bullets && pdf && class1 && class2) {
            return { layout: 'mf-embedding', charts: ordered };
        }
    }
    if (scene === 'mf_model') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const movieW = charts.find((item) => item.type === 'table' && item.title === '영화 A 임베딩 × W');
        const userW = charts.find((item) => item.type === 'table' && item.title === '홍길동 임베딩 × W');
        const dot = charts.find((item) => item.type === 'table' && item.title === '내적 → 예측 평점과 오차');
        const ordered = [bullets, movieW, userW, dot].filter(Boolean);
        if (bullets && movieW && userW && dot) {
            return { layout: 'mf-model', charts: ordered };
        }
    }
    if (scene === 'mf_training') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const diagram = charts.find((item) => item.type === 'mf_network');
        const ordered = [bullets, diagram].filter(Boolean);
        if (bullets && diagram) {
            return { layout: 'mf-network', charts: ordered };
        }
    }
    if (scene === 'mf_ratings') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const ratings = charts.find(
            (item) => item.type === 'table' && item.title === '영화 × 고객 평점 테이블',
        );
        const movieEmb = charts.find((item) => item.type === 'table' && item.title === '영화 임베딩');
        const customerEmb = charts.find((item) => item.type === 'table' && item.title === '고객 임베딩');
        const ordered = [bullets, ratings, movieEmb, customerEmb].filter(Boolean);
        if (bullets && ratings && movieEmb && customerEmb) {
            return { layout: 'mf-ratings', charts: ordered };
        }
    }
    if (scene === 'tf_attention') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const ratings = charts.find(
            (item) => item.type === 'table' && item.title === '영화 × 고객 평점 테이블',
        );
        const query = charts.find((item) => item.type === 'table' && String(item.title).startsWith('Query Q'));
        const key = charts.find((item) => item.type === 'table' && String(item.title).startsWith('Key K'));
        const ordered = [bullets, ratings, query, key].filter(Boolean);
        if (bullets && ratings && query && key) {
            return { layout: 'tf-qk', charts: ordered };
        }
    }
    if (scene === 'tf_multihead') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const softmax = charts.find(
            (item) => item.type === 'table' && String(item.title).startsWith('softmax'),
        );
        const attn = charts.find(
            (item) => item.type === 'table' && String(item.title).startsWith('Attention'),
        );
        const ordered = [bullets, softmax, attn].filter(Boolean);
        if (bullets && softmax && attn) {
            return { layout: 'tf-attention', charts: ordered };
        }
    }
    if (scene === 'tf_encoder') {
        const bullets = charts.find(
            (item) => item.type === 'bullets' && item.title === 'Embedding',
        );
        const embeddingTable = charts.find(
            (item) => item.type === 'table' && item.title === 'Query · Key 임베딩 값',
        );
        const valueTable = charts.find(
            (item) => item.type === 'table' && item.title === '객체 임베딩 × 가중치',
        );
        const valueEmbeddingTable = charts.find(
            (item) => item.type === 'table' && item.title === 'Value 임베딩 값',
        );
        const ordered = [bullets, embeddingTable, valueTable, valueEmbeddingTable].filter(Boolean);
        if (bullets && embeddingTable && valueTable && valueEmbeddingTable) {
            return { layout: 'tf-embedding', charts: ordered };
        }
    }
    if (scene === 'tf_diagram') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const diagram = charts.find((item) => item.type === 'tf_network');
        const ordered = [bullets, diagram].filter(Boolean);
        if (bullets && diagram) {
            return { layout: 'tf-network', charts: ordered };
        }
    }
    if (scene === 'svd_ratings') {
        const bullets = charts.find((item) => item.type === 'bullets');
        const table = charts.find((item) => item.type === 'table');
        const ordered = [bullets, table].filter(Boolean);
        if (bullets && table) {
            return { layout: 'svd-ratings', charts: ordered };
        }
    }
    if (scene === 'svd_decompose') {
        return { layout: 'svd-decompose', charts };
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
    if (layout === 'summary' && item.type === 'table' && item.columns?.includes('길이')) {
        return 'chart-pane summary-length-pane';
    }
    if (layout === 'summary' && item.type === 'table') return 'chart-pane summary-eigen-pane';
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
    if (layout === 'mf-embedding' && item.type === 'bullets') return 'chart-pane mf-embedding-bullets-pane';
    if (layout === 'mf-embedding' && item.type === 'distribution_line' && item.variant === 'pdf') {
        return 'chart-pane mf-embedding-pdf-pane';
    }
    if (layout === 'mf-embedding' && item.type === 'table' && item.title === '클래스1 임베딩') {
        return 'chart-pane mf-embedding-class1-pane';
    }
    if (layout === 'mf-embedding' && item.type === 'table' && item.title === '클래스2 임베딩') {
        return 'chart-pane mf-embedding-class2-pane';
    }
    if (layout === 'mf-model' && item.type === 'bullets') return 'chart-pane mf-model-bullets-pane';
    if (layout === 'mf-model' && item.type === 'table' && item.title === '영화 A 임베딩 × W') {
        return 'chart-pane mf-model-movie-pane';
    }
    if (layout === 'mf-model' && item.type === 'table' && item.title === '홍길동 임베딩 × W') {
        return 'chart-pane mf-model-user-pane';
    }
    if (layout === 'mf-model' && item.type === 'table' && item.title === '내적 → 예측 평점과 오차') {
        return 'chart-pane mf-model-dot-pane';
    }
    if (layout === 'mf-network' && item.type === 'bullets') return 'chart-pane mf-network-bullets-pane';
    if (layout === 'mf-network' && item.type === 'mf_network') {
        return 'chart-pane mf-network-diagram-pane';
    }
    if (layout === 'mf-ratings' && item.type === 'bullets') return 'chart-pane mf-ratings-bullets-pane';
    if (layout === 'mf-ratings' && item.type === 'table' && item.title === '영화 × 고객 평점 테이블') {
        return 'chart-pane mf-ratings-table-pane';
    }
    if (layout === 'mf-ratings' && item.type === 'table' && item.title === '영화 임베딩') {
        return 'chart-pane mf-ratings-movie-embed-pane';
    }
    if (layout === 'mf-ratings' && item.type === 'table' && item.title === '고객 임베딩') {
        return 'chart-pane mf-ratings-customer-embed-pane';
    }
    if (layout === 'tf-qk' && item.type === 'bullets') return 'chart-pane tf-qk-bullets-pane';
    if (layout === 'tf-qk' && item.type === 'table' && item.title === '영화 × 고객 평점 테이블') {
        return 'chart-pane tf-qk-ratings-pane';
    }
    if (layout === 'tf-qk' && item.type === 'table' && String(item.title).startsWith('Query Q')) {
        return 'chart-pane tf-qk-query-pane';
    }
    if (layout === 'tf-qk' && item.type === 'table' && String(item.title).startsWith('Key K')) {
        return 'chart-pane tf-qk-key-pane';
    }
    if (layout === 'tf-attention' && item.type === 'bullets') return 'chart-pane tf-attention-bullets-pane';
    if (layout === 'tf-attention' && item.type === 'table' && String(item.title).startsWith('softmax')) {
        return 'chart-pane tf-attention-softmax-pane';
    }
    if (layout === 'tf-attention' && item.type === 'table' && String(item.title).startsWith('Attention')) {
        return 'chart-pane tf-attention-table-pane';
    }
    if (layout === 'tf-embedding' && item.type === 'bullets') {
        return 'chart-pane tf-embedding-pane tf-embedding-left-pane';
    }
    if (layout === 'tf-embedding' && item.type === 'table' && item.title === 'Query · Key 임베딩 값') {
        return 'chart-pane tf-embedding-pane tf-embedding-left-bottom-pane';
    }
    if (layout === 'tf-embedding' && item.type === 'table' && item.title === '객체 임베딩 × 가중치') {
        return 'chart-pane tf-embedding-pane tf-embedding-right-top-pane';
    }
    if (layout === 'tf-embedding' && item.type === 'table' && item.title === 'Value 임베딩 값') {
        return 'chart-pane tf-embedding-pane tf-embedding-right-bottom-pane';
    }
    if (layout === 'tf-network' && item.type === 'bullets') return 'chart-pane tf-network-bullets-pane';
    if (layout === 'tf-network' && item.type === 'tf_network') {
        return 'chart-pane tf-network-diagram-pane';
    }
    if (layout === 'svd-ratings' && item.type === 'bullets') return 'chart-pane svd-ratings-bullets-pane';
    if (layout === 'svd-ratings' && item.type === 'table') return 'chart-pane svd-ratings-table-pane';
    if (layout === 'svd-decompose' && item.type === 'matrix_product' && item.variant === 'predict') {
        return 'chart-pane svd-decompose-table-pane svd-predict-pane';
    }
    if (layout === 'svd-decompose' && item.type === 'matrix_product') {
        return 'chart-pane svd-decompose-table-pane svd-verify-pane';
    }
    if (layout === 'svd-decompose') return 'chart-pane svd-decompose-table-pane';
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
    'svd_intro',
    'svd_ratings',
    'svd_decompose',
    'svd_summary',
    'mf_intro',
    'mf_embedding',
    'mf_ratings',
    'mf_model',
    'mf_training',
    'mf_summary',
    'tf_intro',
    'tf_attention',
    'tf_multihead',
    'tf_encoder',
    'tf_diagram',
    'tf_summary',
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
    const pendingHeardRef = useRef('');
    const heardTimerRef = useRef(0);
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
        window.clearTimeout(heardTimerRef.current);
        detachRecognizer(recRef.current);
        recRef.current = null;
    }, []);

    async function applyTurn(text, fromMenu = false) {
        const cleaned = foldHeard(text.trim());
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
        rec.maxAlternatives = 3;
        recRef.current = rec;
        listeningRef.current = true;
        pendingHeardRef.current = '';
        window.clearTimeout(heardTimerRef.current);

        rec.onstart = () => {
            setListening(true);
            setNotice('마이크가 켜졌습니다. PCA / SVD / MF / Transformer 보여 주세요처럼 말씀해 주세요.');
        };

        rec.onresult = (event) => {
            let live = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const piece = pickHeard(event.results[i]);
                if (!piece) continue;
                if (event.results[i].isFinal) {
                    pendingHeardRef.current = `${pendingHeardRef.current} ${piece}`.trim();
                    setInterim(pendingHeardRef.current);
                    window.clearTimeout(heardTimerRef.current);
                    const waitMs = isCompleteCommand(pendingHeardRef.current) ? 350 : 1100;
                    heardTimerRef.current = window.setTimeout(() => {
                        const heard = pendingHeardRef.current.trim();
                        pendingHeardRef.current = '';
                        setInterim('');
                        if (heard) void applyTurn(heard);
                    }, waitMs);
                } else {
                    live += piece;
                }
            }
            if (live) {
                setInterim(`${pendingHeardRef.current} ${live}`.trim());
            }
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
        window.clearTimeout(heardTimerRef.current);
        const heard = pendingHeardRef.current.trim();
        pendingHeardRef.current = '';
        detachRecognizer(recRef.current);
        recRef.current = null;
        setListening(false);
        setInterim('');
        if (heard) void applyTurn(heard);
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
    const isSvdRatingsLayout = layout === 'svd-ratings';
    const isMfRatingsLayout = layout === 'mf-ratings';
    const isMfModelLayout = layout === 'mf-model';
    const isMfNetworkLayout = layout === 'mf-network';
    const isTfQkLayout = layout === 'tf-qk';
    const isTfAttentionLayout = layout === 'tf-attention';
    const isTfEmbeddingLayout = layout === 'tf-embedding';
    const isTfNetworkLayout = layout === 'tf-network';
    const isMfEmbeddingLayout = layout === 'mf-embedding';

    const useGridLayout =
        visibleCharts.length > 1 ||
        isTfEmbeddingLayout ||
        isTfQkLayout ||
        isTfAttentionLayout;

    const gridClass =
        useGridLayout
            ? isEigenLayout
                ? 'chart-grid eigen-layout'
                : isSummaryLayout
                  ? 'chart-grid summary-layout'
                  : isMfEmbeddingLayout
                    ? 'chart-grid mf-embedding-layout'
                    : isMfModelLayout
                      ? 'chart-grid mf-model-layout'
                    : isMfNetworkLayout
                      ? 'chart-grid mf-network-layout'
                    : isMfRatingsLayout
                      ? 'chart-grid mf-ratings-layout'
                    : isTfQkLayout
                      ? 'chart-grid tf-qk-layout'
                    : isTfAttentionLayout
                      ? 'chart-grid tf-attention-layout'
                    : isTfEmbeddingLayout
                      ? 'chart-grid tf-embedding-layout'
                    : isTfNetworkLayout
                      ? 'chart-grid tf-network-layout'
                    : isSvdRatingsLayout
                    ? 'chart-grid svd-ratings-layout'
                    : layout === 'svd-decompose'
                    ? 'chart-grid svd-decompose-layout'
                    : isIrisPcaLayout
                    ? 'chart-grid iris-pca-layout'
                    : isIrisCovLayout
                      ? 'chart-grid iris-cov-layout'
                      : isIrisLayout
                        ? 'chart-grid iris-layout'
                        : 'chart-grid'
            : 'chart-frame';

    const isTfCompactShell =
        turn?.scene === 'tf_attention' ||
        turn?.scene === 'tf_multihead' ||
        turn?.scene === 'tf_encoder';
    const isTfEmbeddingShell = turn?.scene === 'tf_encoder';

    return (
        <div
            className={
                turn?.scene === 'svd_decompose'
                    ? 'lecture-rag-shell lecture-rag-shell--svd-decompose'
                    : isTfEmbeddingShell
                      ? 'lecture-rag-shell lecture-rag-shell--tf-compact lecture-rag-shell--tf-embedding-shell'
                    : isTfCompactShell
                      ? 'lecture-rag-shell lecture-rag-shell--tf-compact'
                      : 'lecture-rag-shell'
            }
        >
            <main className="stage">
                <div className="stage-body">
                    {notice ? <p className="lecture-notice">{notice}</p> : null}
                    {turn?.explanation ? <p className="stage-caption">{turn.explanation}</p> : null}
                    {(isEigenLayout || isIrisLayout || isIrisCovLayout || isIrisPcaLayout || turn?.scene === 'svd_decompose') && turn?.title ? (
                        <h2 className="scene-heading">{turn.title}</h2>
                    ) : isEigenLayout || isIrisLayout || isIrisCovLayout || isIrisPcaLayout ? (
                        <h2 className="scene-heading">
                            {isEigenLayout
                                ? '고유값과 고유벡터의 의미'
                                : isIrisLayout
                                  ? 'Iris(붓꽃) 데이터'
                                  : isIrisPcaLayout
                                    ? '차원 축소 선형 변환(PCA)'
                                    : '붓꽃의 공분산과 고유값 및 고유벡터'}
                        </h2>
                    ) : null}
                    {visibleCharts.length > 0 ? (
                        <div ref={chartGridRef} className={gridClass}>
                            {isSummaryLayout ? (
                                <SummaryLayout charts={visibleCharts} />
                            ) : (
                                visibleCharts.map((item, index) => (
                                    <div
                                        key={`${item.type}-${item.title}-${index}`}
                                        className={paneClass(layout, item)}
                                    >
                                        {(visibleCharts.length > 1 ||
                                            isEigenLayout ||
                                            isIrisCovLayout ||
                                            isIrisPcaLayout ||
                                            isMfEmbeddingLayout ||
                                            isMfRatingsLayout ||
                                            isMfModelLayout ||
                                            isMfNetworkLayout ||
                                            isTfQkLayout ||
                                            isTfAttentionLayout ||
                                            isTfEmbeddingLayout ||
                                            isTfNetworkLayout) &&
                                        item.type !== 'bullets' &&
                                        item.type !== 'matrix_pair' &&
                                        item.type !== 'matrix_product' &&
                                        item.type !== 'matrix_equation' &&
                                        item.type !== 'mf_network' &&
                                        item.type !== 'tf_network' &&
                                        !isIrisLayout &&
                                        item.title ? (
                                            <p className="chart-pane-title">{item.title}</p>
                                        ) : null}
                                        {(isIrisCovLayout) &&
                                        item.type === 'bullets' &&
                                        item.title ? (
                                            <p className="chart-pane-title">{item.title}</p>
                                        ) : null}
                                        <ChartView chart={item} />
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="talk-card">
                            <h3>{turn?.title}</h3>
                            <p>{turn?.explanation ?? '왼쪽 메뉴에서 선택하거나 아래에 말씀해 주세요.'}</p>
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
