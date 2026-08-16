import { RowButton } from '../RowButton';
import { EmptyHint, SectionTitle } from '../shared.styles';
import {
    AnnotationItem,
    AnnotationList,
    EditHint,
    ItemActions,
} from './YoloAnnotationList.styles';

export function YoloAnnotationList({
                                       annotations = [],
                                       selectedAnnotationId = null,
                                       editingAnnotationId = null,
                                       onSelect,
                                       onEdit,
                                       onCancelEdit,
                                       onApplyLabel,
                                       onDelete,
                                       isUpdating = false,
                                       isDeleting = false,
                                   }) {
    return (
        <>
            <SectionTitle>박스 라벨링 목록 (삽입 · 수정 · 삭제)</SectionTitle>
            {annotations.length === 0 ? (
                <EmptyHint>프레임에 박스를 그리면 목록에 표시됩니다.</EmptyHint>
            ) : (
                <AnnotationList>
                    {annotations.map((item) => {
                        const isEditing = editingAnnotationId === item.id;
                        const isSelected = selectedAnnotationId === item.id;
                        return (
                            <AnnotationItem
                                key={item.id}
                                $editing={isEditing}
                                $selected={isSelected && !isEditing}
                                onClick={() => onSelect?.(item)}
                            >
                <span>
                  {item.label_name} · ({item.x.toFixed(2)}, {item.y.toFixed(2)})
                </span>
                                <ItemActions onClick={(e) => e.stopPropagation()}>
                                    {isEditing ? (
                                        <>
                                            <EditHint>캔버스 드래그로 박스 수정</EditHint>
                                            <RowButton
                                                type="button"
                                                $edit
                                                disabled={isUpdating}
                                                onClick={() => onApplyLabel?.(item)}
                                            >
                                                라벨 적용
                                            </RowButton>
                                            <RowButton type="button" disabled={isUpdating} onClick={onCancelEdit}>
                                                취소
                                            </RowButton>
                                        </>
                                    ) : (
                                        <>
                                            <RowButton
                                                type="button"
                                                $edit
                                                disabled={isDeleting || isUpdating}
                                                onClick={() => onEdit?.(item)}
                                            >
                                                수정
                                            </RowButton>
                                            <RowButton
                                                type="button"
                                                $danger
                                                disabled={isDeleting || isUpdating}
                                                onClick={() => onDelete?.(item)}
                                            >
                                                삭제
                                            </RowButton>
                                        </>
                                    )}
                                </ItemActions>
                            </AnnotationItem>
                        );
                    })}
                </AnnotationList>
            )}
        </>
    );
}

export default YoloAnnotationList;