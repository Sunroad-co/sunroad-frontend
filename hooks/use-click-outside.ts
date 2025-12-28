import { useEffect, RefObject, useRef } from 'react'

/**
 * Reusable hook to handle clicks outside of specified elements
 * @param refs - Array of refs to check (click is considered "outside" if not inside any of these)
 * @param handler - Callback to execute when click is outside
 * @param enabled - Whether the hook is enabled (default: true)
 */
export function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  handler: (event: MouseEvent) => void,
  enabled: boolean = true
) {
  // Store refs in a ref to avoid dependency issues
  const refsRef = useRef(refs)
  refsRef.current = refs

  // Store handler in a ref to avoid dependency issues
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      
      // Check if click is inside any of the provided refs
      const isInside = refsRef.current.some(ref => {
        return ref.current && ref.current.contains(target)
      })

      // If click is outside all refs, call handler
      if (!isInside) {
        handlerRef.current(event)
      }
    }

    // Use mousedown to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [enabled])
}
