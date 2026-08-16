from pathlib import Path

import cv2


def uniform_indices(total_frames: int, frame_count: int) -> list[int]:
    if frame_count < 1:
        raise ValueError("frame_count는 1 이상이어야 합니다.")
    if total_frames < 1:
        raise ValueError("영상 프레임이 없습니다.")
    if frame_count == 1:
        return [total_frames // 2]
    if frame_count >= total_frames:
        return list(range(total_frames))
    step = (total_frames - 1) / (frame_count - 1)
    return [int(round(i * step)) for i in range(frame_count)]


def _save_frame(frame, output_dir: Path, order: int) -> Path | None:
    out = output_dir / f"frame_{order:04d}.jpg"
    if cv2.imwrite(str(out), frame):
        return out
    return None


def extract_frames(
    video_path: Path,
    output_dir: Path,
    frame_count: int,
) -> tuple[int, list[Path]]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise FileNotFoundError(f"영상을 열 수 없습니다: {video_path}")

    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        wanted = uniform_indices(max(total, 1), frame_count)
        saved: list[Path] = []

        if total > 1:
            for order, idx in enumerate(wanted, start=1):
                cap.set(cv2.CAP_PROP_POS_FRAMES, float(idx))
                ok, frame = cap.read()
                if not ok or frame is None:
                    continue
                path = _save_frame(frame, output_dir, order)
                if path:
                    saved.append(path)
            if saved:
                return total, saved

        cap.release()
        cap = cv2.VideoCapture(str(video_path))
        wanted_set = set(wanted)
        order = 0
        frame_idx = 0
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                break
            if frame_idx in wanted_set:
                order += 1
                path = _save_frame(frame, output_dir, order)
                if path:
                    saved.append(path)
                if len(saved) >= len(wanted_set):
                    break
            frame_idx += 1
            total = max(total, frame_idx)
        return total, saved
    finally:
        cap.release()
