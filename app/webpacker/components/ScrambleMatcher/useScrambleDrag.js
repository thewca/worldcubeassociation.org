import { useState, useCallback } from 'react';

export default function useScrambleDrag(onMove) {
  const [currentDragStart, setCurrentDragStart] = useState(null);
  const [currentDragIndex, setCurrentDragIndex] = useState(null);

  const onBeforeDragStart = useCallback(({ source }) => {
    setCurrentDragStart(source?.index);
    setCurrentDragIndex(source?.index);
  }, []);

  const onDragEnd = useCallback(({ source, destination }) => {
    setCurrentDragStart(null);
    setCurrentDragIndex(null);
    if (destination) {
      onMove(source.index, destination.index);
    }
  }, [onMove]);

  const onDragUpdate = useCallback(({ destination }) => {
    setCurrentDragIndex(destination?.index);
  }, []);

  const dragDistance = currentDragIndex === null ? 0 : currentDragIndex - currentDragStart;
  const dragDirection = Math.sign(dragDistance);

  const computeOnDragIndex = useCallback((elIndex, isDragging = false) => {
    if (isDragging) return currentDragIndex;

    const start = Math.min(currentDragStart, currentDragIndex);
    const end = Math.max(currentDragStart, currentDragIndex);

    if (elIndex >= start && elIndex <= end) {
      return elIndex - dragDirection;
    }
    return elIndex;
  }, [currentDragStart, currentDragIndex, dragDirection]);

  return {
    onBeforeDragStart,
    onDragUpdate,
    onDragEnd,
    computeOnDragIndex,
  };
}
