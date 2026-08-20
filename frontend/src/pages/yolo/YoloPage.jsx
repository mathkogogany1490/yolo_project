import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    YoloAnnotationCanvas,
    YoloAnnotationList,
    YoloFrameExtract,
    YoloFrameStrip,
    YoloLabelPicker,
    YoloStepTabs,
    YoloTrainPanel,
    YoloVideoPredict,
} from '../../components/yolo';
import { ErrorText, PanelSection } from '../../components/yolo/shared.styles';
import { RowButton } from '../../components/yolo/RowButton';
import {
    useCreateYoloAnnotationMutation,
    useCreateYoloLabelMutation,
    useDeleteYoloAnnotationMutation,
    useDeleteYoloLabelMutation,
    useExtractYoloFramesMutation,
    useTrainYoloModelMutation,
    useUpdateYoloAnnotationMutation,
    useYoloAnnotationsQuery,
    useYoloLabelsQuery,
} from '../../query/yolo';
import { GlassPanel, PageRoot } from './YoloPage.styles';

export function YoloPage() {
    const [searchParams] = useSearchParams();
    const scene = searchParams.get('scene') || 'detect-train';

    const [step, setStep] = useState(1);
    const [sessionId, setSessionId] = useState('');
    const [frames, setFrames] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState('');
    const [frameCount, setFrameCount] = useState(8);
    const [videoName, setVideoName] = useState('');
    const [labelName, setLabelName] = useState('');
    const [activeLabelName, setActiveLabelName] = useState('');
    const [editingAnnotationId, setEditingAnnotationId] = useState(null);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [epochs, setEpochs] = useState(10);
    const [trainResult, setTrainResult] = useState(null);
    const [localError, setLocalError] = useState('');
    const [registerError, setRegisterError] = useState('');

    const labelsQuery = useYoloLabelsQuery();
    const extractMutation = useExtractYoloFramesMutation();
    const createLabelMutation = useCreateYoloLabelMutation();
    const deleteLabelMutation = useDeleteYoloLabelMutation();
    const annotationsQuery = useYoloAnnotationsQuery(sessionId, selectedFrame, {
        enabled: Boolean(sessionId && selectedFrame),
    });
    const createAnnotation = useCreateYoloAnnotationMutation();
    const updateAnnotation = useUpdateYoloAnnotationMutation();
    const deleteAnnotation = useDeleteYoloAnnotationMutation();
    const trainMutation = useTrainYoloModelMutation();

    const registeredLabels = labelsQuery.data?.labels ?? [];
    const annotations = annotationsQuery.data?.items ?? [];

    const buildLabelPayload = () => {
        const label = registeredLabels.find((item) => item.name === activeLabelName);
        return label ? { label_id: label.id } : { name: activeLabelName };
    };

    if (scene === 'predict') {
        return (
            <PageRoot>
                <GlassPanel>
                    <YoloVideoPredict />
                </GlassPanel>
            </PageRoot>
        );
    }

    return (
        <PageRoot>
            <GlassPanel>
                <YoloStepTabs step={step} onStepChange={setStep} />

                {step === 1 && (
                    <YoloFrameExtract
                        frameCount={frameCount}
                        onFrameCountChange={setFrameCount}
                        videoName={videoName}
                        isPending={extractMutation.isPending}
                        error={localError || (extractMutation.isError ? extractMutation.error.message : null)}
                        sessionId={sessionId}
                        frameTotal={frames.length}
                        onVideoSelect={(file) => {
                            setVideoName(file.name);
                            setTrainResult(null);
                            extractMutation.mutate(
                                { file, frameCount: Number(frameCount) || 8 },
                                {
                                    onSuccess: (data) => {
                                        setSessionId(data.session_id);
                                        setFrames(data.frames ?? []);
                                        setSelectedFrame(data.frames?.[0]?.filename ?? '');
                                        setStep(2);
                                        setLocalError('');
                                    },
                                    onError: (err) => setLocalError(err.message),
                                },
                            );
                        }}
                    />
                )}

                {step === 2 && (
                    <PanelSection>
                        {!sessionId ? (
                            <ErrorText>먼저 ① 추출을 하세요.</ErrorText>
                        ) : (
                            <>
                                <YoloLabelPicker
                                    labelName={labelName}
                                    onLabelNameChange={setLabelName}
                                    onRegister={() => {
                                        const name = labelName.trim();
                                        if (!name) return setRegisterError('라벨 이름을 입력하세요.');
                                        createLabelMutation.mutate(
                                            { name },
                                            {
                                                onSuccess: (label) => {
                                                    setActiveLabelName(label.name);
                                                    setLabelName('');
                                                    setRegisterError('');
                                                },
                                                onError: (err) => setRegisterError(err.message),
                                            },
                                        );
                                    }}
                                    isRegistering={createLabelMutation.isPending}
                                    registerError={registerError}
                                    registeredLabels={registeredLabels}
                                    activeLabelName={activeLabelName}
                                    onActiveLabelChange={setActiveLabelName}
                                    onDeleteLabel={(label) =>
                                        deleteLabelMutation.mutate(label.id, {
                                            onSuccess: () => {
                                                if (activeLabelName === label.name) setActiveLabelName('');
                                            },
                                        })
                                    }
                                    deletingLabelId={deleteLabelMutation.isPending ? deleteLabelMutation.variables : null}
                                />
                                <YoloFrameStrip
                                    sessionId={sessionId}
                                    frames={frames}
                                    selectedFrame={selectedFrame}
                                    onSelectFrame={(frame) => {
                                        setSelectedFrame(frame);
                                        setEditingAnnotationId(null);
                                        setSelectedAnnotationId(null);
                                    }}
                                />
                                <YoloAnnotationCanvas
                                    sessionId={sessionId}
                                    selectedFrame={selectedFrame}
                                    annotations={annotations}
                                    selectedAnnotationId={selectedAnnotationId}
                                    editingAnnotationId={editingAnnotationId}
                                    onSelectAnnotation={(item) => setSelectedAnnotationId(item.id)}
                                    onCreateBox={(yolo) => {
                                        if (!activeLabelName) {
                                            setLocalError('라벨을 선택하세요.');
                                            return;
                                        }
                                        setLocalError('');
                                        createAnnotation.mutate(
                                            {
                                                session_id: sessionId,
                                                frame: selectedFrame,
                                                ...buildLabelPayload(),
                                                ...yolo,
                                            },
                                            {
                                                onError: (err) => setLocalError(err.message),
                                            },
                                        );
                                    }}
                                    onUpdateBox={(annotationId, yolo) => {
                                        updateAnnotation.mutate({
                                            sessionId,
                                            annotationId,
                                            body: { ...buildLabelPayload(), ...yolo },
                                        });
                                    }}
                                />
                                {localError && <ErrorText>{localError}</ErrorText>}
                                <YoloAnnotationList
                                    annotations={annotations}
                                    selectedAnnotationId={selectedAnnotationId}
                                    editingAnnotationId={editingAnnotationId}
                                    onSelect={(item) => setSelectedAnnotationId(item.id)}
                                    onEdit={(item) => {
                                        setSelectedAnnotationId(item.id);
                                        setEditingAnnotationId(item.id);
                                        setActiveLabelName(item.label_name);
                                    }}
                                    onCancelEdit={() => setEditingAnnotationId(null)}
                                    onApplyLabel={(item) =>
                                        updateAnnotation.mutate({
                                            sessionId,
                                            annotationId: item.id,
                                            body: buildLabelPayload(),
                                        })
                                    }
                                    onDelete={(item) =>
                                        deleteAnnotation.mutate({ sessionId, annotationId: item.id })
                                    }
                                    isUpdating={updateAnnotation.isPending}
                                    isDeleting={deleteAnnotation.isPending}
                                />
                                {annotations.length > 0 && (
                                    <RowButton type="button" onClick={() => setStep(3)}>
                                        라벨링 완료 → ③ 훈련
                                    </RowButton>
                                )}
                            </>
                        )}
                    </PanelSection>
                )}

                {step === 3 && (
                    <YoloTrainPanel
                        epochs={epochs}
                        onEpochsChange={setEpochs}
                        isPending={trainMutation.isPending}
                        error={trainMutation.isError ? trainMutation.error.message : null}
                        result={trainResult}
                        onTrain={() =>
                            trainMutation.mutate(
                                {
                                    session_ids: sessionId ? [sessionId] : undefined,
                                    epochs: Number(epochs) || 10,
                                    device: 'auto',
                                },
                                { onSuccess: setTrainResult },
                            )
                        }
                    />
                )}
            </GlassPanel>
        </PageRoot>
    );
}

export default YoloPage;