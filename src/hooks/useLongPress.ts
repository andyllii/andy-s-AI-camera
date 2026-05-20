import { useRef, useCallback, useEffect } from 'react';

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
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const start = (event: PointerEvent | TouchEvent) => {
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

      let clientX = 0;
      let clientY = 0;
      if (event instanceof PointerEvent) {
          clientX = event.clientX;
          clientY = event.clientY;
      } else if (event instanceof TouchEvent) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
      }
      
      startCoords.current = { x: clientX, y: clientY };
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
    };

    const clear = (event: Event, shouldTriggerClick = true) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (shouldTriggerClick && !isLongPressActive.current && onClick) {
        onClick(event);
      }
      isLongPressActive.current = false;
    };

    const clearNoTrigger = (event: Event) => clear(event, false);

    const move = (event: PointerEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if (event instanceof PointerEvent) {
          clientX = event.clientX;
          clientY = event.clientY;
      } else if (event instanceof TouchEvent && event.touches.length > 0) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
      } else {
          return;
      }
      
      const dx = Math.abs(clientX - startCoords.current.x);
      const dy = Math.abs(clientY - startCoords.current.y);
      
      // If the user moves their finger more than 10px, it is a drag, not a long press
      if (dx > 10 || dy > 10) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    const handleContextMenu = (e: Event) => {
       // Only block context menu if we just completed a long press
       if (isLongPressActive.current) {
           e.preventDefault();
       }
    };

    // Use capture phase to ensure we intercept it BEFORE react-flow cancels anything
    el.addEventListener('pointerdown', start as EventListener, { capture: true });
    el.addEventListener('pointerup', clear as EventListener, { capture: true });
    el.addEventListener('pointercancel', clearNoTrigger as EventListener, { capture: true });
    el.addEventListener('pointerleave', clearNoTrigger as EventListener, { capture: true });
    el.addEventListener('pointermove', move as EventListener, { capture: true });
    
    // Also bind touch events specifically as fallback/double assurance on iOS
    el.addEventListener('touchstart', start as EventListener, { capture: true, passive: true });
    el.addEventListener('touchend', clear as EventListener, { capture: true });
    el.addEventListener('touchmove', move as EventListener, { capture: true, passive: true });
    el.addEventListener('touchcancel', clearNoTrigger as EventListener, { capture: true });

    el.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      el.removeEventListener('pointerdown', start as EventListener, { capture: true });
      el.removeEventListener('pointerup', clear as EventListener, { capture: true });
      el.removeEventListener('pointercancel', clearNoTrigger as EventListener, { capture: true });
      el.removeEventListener('pointerleave', clearNoTrigger as EventListener, { capture: true });
      el.removeEventListener('pointermove', move as EventListener, { capture: true });

      el.removeEventListener('touchstart', start as EventListener, { capture: true });
      el.removeEventListener('touchend', clear as EventListener, { capture: true });
      el.removeEventListener('touchmove', move as EventListener, { capture: true });
      el.removeEventListener('touchcancel', clearNoTrigger as EventListener, { capture: true });

      el.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, [onLongPress, onClick, delay]);

  return { ref: elementRef };
}
