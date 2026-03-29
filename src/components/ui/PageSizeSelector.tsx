import { useRef, useState, useEffect, useCallback } from 'react'

interface PageSizeSelectorProps {
  pageSize: number
  onChange: (size: number) => void
  options?: number[]
}

export default function PageSizeSelector({
  pageSize,
  onChange,
  options = [10, 25, 50],
}: PageSizeSelectorProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const [slider, setSlider] = useState<{ left: number; width: number } | null>(null)

  const updateSlider = useCallback(() => {
    const track = trackRef.current
    const activeBtn = btnRefs.current.get(pageSize)
    if (!track || !activeBtn) return

    const trackRect = track.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()

    setSlider({
      left: btnRect.left - trackRect.left,
      width: btnRect.width,
    })
  }, [pageSize])

  useEffect(() => {
    updateSlider()
  }, [updateSlider])

  useEffect(() => {
    const observer = new ResizeObserver(updateSlider)
    if (trackRef.current) observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [updateSlider])

  return (
    <div
      ref={trackRef}
      className="hidden sm:inline-flex relative items-center bg-gray-200 rounded-full p-0.5 shrink-0"
    >
      {slider && (
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-white shadow-sm rounded-full pointer-events-none"
          style={{
            left: slider.left,
            width: slider.width,
            height: 'calc(100% - 4px)',
            transition: 'left 250ms cubic-bezier(0.25, 0.1, 0.25, 1), width 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        />
      )}
      {options.map((opt) => (
        <button
          key={opt}
          ref={(el) => { if (el) btnRefs.current.set(opt, el); else btnRefs.current.delete(opt) }}
          type="button"
          onClick={() => { if (opt !== pageSize) onChange(opt) }}
          className={`
            relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200
            ${opt === pageSize
              ? 'text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
            }
          `.trim()}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
