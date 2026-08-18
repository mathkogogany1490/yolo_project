import { apiRequest } from './client';

export function fetchLectureDataset() {
    return apiRequest('/lecture/dataset');
}

export function fetchLectureState() {
    return apiRequest('/lecture/state');
}

export function sendLectureTurn(text, currentScene, fromMenu = false) {
    return apiRequest('/lecture/turn', {
        method: 'POST',
        body: {
            text,
            current_scene: currentScene,
            from_menu: fromMenu,
        },
    });
}
