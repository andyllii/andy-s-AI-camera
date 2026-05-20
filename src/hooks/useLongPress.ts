import { useRef, useCallback } from 'react';

interface Options {
  delay?: number;
}

export function useLongPress(
  onLongPress: (e: any) => void,
  onClick?: (e: any) => void,
  options: Options = {}
) {
  const { delay = 550 } = options;
  const timeoutRef = useRef<any>(null);
  const isLongPressActive = useRef(false);
  const startCoords = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (event: any) => {
      // Ignore interactive form components
      const target = event.target as HTMLElement;
      if (
        target && 
        (target.tagName === 'TEXTAREA' || 
         target.tagName === 'INPUT' || 
         target.tagName === 'SELECT' || 
         target.tagName === 'BUTTON' || 
         target.closest('button') || 
         target.closest('.react-flow__handle'))
      ) {
        return;
      }

      // Support touch
      const isTouch = event.type.startsWith('touch');
      const point = isTouch ? event.touches[0] : event;
      
      startCoords.current = { x: point.clientX, y: point.clientY };
      isLongPressActive.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        isLongPressActive.current = true;
        // Check if device supports haptic feedback and vibrate
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          try {
            window.navigator.vibrate(40);
          } catch (e) {}
        }
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (event: any, shouldTriggerClick = true) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (shouldTriggerClick && !isLongPressActive.current && onClick) {
        onClick(event);
      }
      isLongPressActive.current = false;
    },
    [onClick]
  );

  const move = useCallback(
    (event: any) => {
      const isTouch = event.type.startsWith('touch');
      const point = isTouch ? event.touches[0] : event;
      
      const dx = Math.abs(point.clientX - startCoords.current.x);
      const dy = Math.abs(point.clientY - startCoords.current.y);
      
      // If the user moves their finger more than 10px, it is a drag, not a long press
      if (dx > 10 || dy > 10) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    },
    []
  );

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: (e: any) => clear(e),
    onMouseLeave: (e: any) => clear(e, false),
    onTouchEnd: (e: any) => clear(e),
    onTouchMove: move,
  };
}
