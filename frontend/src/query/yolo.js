import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createYoloAnnotation,
    createYoloLabel,
    deleteYoloAnnotation,
    deleteYoloLabel,
    extractYoloFrames,
    listYoloAnnotations,
    listYoloFrames,
    listYoloLabels,
    predictYolo,
    predictYoloVideo,
    resolveYoloLabel,
    trainYoloModel,
    updateYoloAnnotation,
    updateYoloLabel,
} from '../api/yolo';

export const yoloKeys = {
    all: ['yolo'],
    labels: () => [...yoloKeys.all, 'labels'],
    frames: (sessionId) => [...yoloKeys.all, 'frames', sessionId],
    annotations: (sessionId, frame) => [
        ...yoloKeys.all,
        'annotations',
        sessionId,
        frame ?? null,
    ],
    extract: () => [...yoloKeys.all, 'extract'],
    train: () => [...yoloKeys.all, 'train'],
    predictVideo: () => [...yoloKeys.all, 'predict', 'video'],
};

/* ---------- Queries (조회) ---------- */

export function useYoloLabelsQuery(options = {}) {
    return useQuery({
        queryKey: yoloKeys.labels(),
        queryFn: listYoloLabels,
        ...options,
    });
}

export function useYoloFramesQuery(sessionId, options = {}) {
    return useQuery({
        queryKey: yoloKeys.frames(sessionId),
        queryFn: () => listYoloFrames(sessionId),
        enabled: Boolean(sessionId),
        ...options,
    });
}

export function useYoloAnnotationsQuery(sessionId, frame, options = {}) {
    return useQuery({
        queryKey: yoloKeys.annotations(sessionId, frame),
        queryFn: () => listYoloAnnotations(sessionId, frame ? { frame } : {}),
        enabled: Boolean(sessionId),
        ...options,
    });
}

/* ---------- Mutations ---------- */

export function useCreateYoloLabelMutation(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;
    return useMutation({
        mutationFn: createYoloLabel,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: yoloKeys.labels() });
            onSuccess?.(...args);
        },
        ...rest,
    });
}

export function useUpdateYoloLabelMutation(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;
    return useMutation({
        mutationFn: ({ labelId, body }) => updateYoloLabel(labelId, body),
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: yoloKeys.labels() });
            onSuccess?.(...args);
        },
        ...rest,
    });
}

export function useDeleteYoloLabelMutation(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;
    return useMutation({
        mutationFn: deleteYoloLabel,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: yoloKeys.labels() });
            onSuccess?.(...args);
        },
        ...rest,
    });
}

export function useResolveYoloLabelMutation(options = {}) {
    return useMutation({
        mutationFn: resolveYoloLabel,
        ...options,
    });
}

/** mutate({ file, frameCount }) → { session_id, frames, ... } */
export function useExtractYoloFramesMutation(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;
    return useMutation({
        mutationKey: yoloKeys.extract(),
        mutationFn: ({ file, frameCount }) => extractYoloFrames(file, frameCount),
        onSuccess: (data, ...args) => {
            if (data?.session_id) {
                queryClient.invalidateQueries({ queryKey: yoloKeys.frames(data.session_id) });
            }
            onSuccess?.(data, ...args);
        },
        ...rest,
    });
}

function invalidateAnnotations(queryClient, sessionId) {
    queryClient.invalidateQueries({
        queryKey: [...yoloKeys.all, 'annotations', sessionId],
    });
}

export function useCreateYoloAnnotationMutation(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;
    return useMutation({
        mutationFn: createYoloAnnotation,
        onSuccess: (data, variables, ...args) => {
            invalidateAnnotations(queryClient, variables.session_id);
            onSuccess?.(data, variables, ...args);
        },
        ...rest,
    });
}

export function useUpdateYoloAnnotationMutation(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;
    return useMutation({
        mutationFn: ({ sessionId, annotationId, body }) =>
            updateYoloAnnotation(sessionId, annotationId, body),
        onSuccess: (data, variables, ...args) => {
            invalidateAnnotations(queryClient, variables.sessionId);
            onSuccess?.(data, variables, ...args);
        },
        ...rest,
    });
}

export function useDeleteYoloAnnotationMutation(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...rest } = options;
    return useMutation({
        mutationFn: ({ sessionId, annotationId }) =>
            deleteYoloAnnotation(sessionId, annotationId),
        onSuccess: (data, variables, ...args) => {
            invalidateAnnotations(queryClient, variables.sessionId);
            onSuccess?.(data, variables, ...args);
        },
        ...rest,
    });
}

/** mutate({ epochs, device, ... }) → { checkpoint_path, ... } */
export function useTrainYoloModelMutation(options = {}) {
    return useMutation({
        mutationKey: yoloKeys.train(),
        mutationFn: trainYoloModel,
        ...options,
    });
}

/** mutate({ file, conf, device }) → YoloVideoPredictResponse */
export function usePredictYoloVideoMutation(options = {}) {
    return useMutation({
        mutationKey: yoloKeys.predictVideo(),
        mutationFn: ({ file, ...opts }) => predictYoloVideo(file, opts),
        ...options,
    });
}

/** (선택) 이미지 predict */
export function usePredictYoloMutation(options = {}) {
    return useMutation({
        mutationFn: ({ file, ...opts }) => predictYolo(file, opts),
        ...options,
    });
}