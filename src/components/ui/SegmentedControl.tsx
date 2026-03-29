import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'

interface SegmentOption {
  value: string
  label?: string
  icon?: ReactNode
}

type SegmentedControlSize = 'sm' | 'md'

interface SegmentedControlProps {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  size?: SegmentedControlSize
  className?: string
}

const sizeStyles: Record<SegmentedControlSize, { track: string; segment: string; text: string; padding: string }> = {
  sm: {
    track: 'h-9 rounded-full',
    segment: 'px-4 rounded-full gap-1.5',
    text: 'text-xs',
    padding: '3px',
  },
  md: {
    track: 'h-11 rounded-full',
    segment: 'px-5 rounded-full gap-2',
    text: 'text-sm',
    padding: '2px',
  },
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const segmentRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number } | null>(null)

  const styles = sizeStyles[size]

  const updateSlider = useCallback(() => {
    const track = trackRef.current
    const activeBtn = segmentRefs.current.get(value)
    if (!track || !activeBtn) return

    const trackRect = track.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()

    setSliderStyle({
      left: btnRect.left - trackRect.left,
      width: btnRect.width,
    })
  }, [value])

  useEffect(() => {
    updateSlider()
  }, [updateSlider, options])

  useEffect(() => {
    const observer = new ResizeObserver(updateSlider)
    if (trackRef.current) observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [updateSlider])

  const setSegmentRef = useCallback((el: HTMLButtonElement | null, optValue: string) => {
    if (el) {
      segmentRefs.current.set(optValue, el)
    } else {
      segmentRefs.current.delete(optValue)
    }
  }, [])

  return (
    <div
      ref={trackRef}
      className={`
        relative inline-grid items-center bg-gray-200
        ${styles.track}
        ${className}
      `.trim()}
      style={{
        padding: styles.padding,
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      }}
    >
      {/* Sliding active tile */}
      {sliderStyle && (
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-white shadow-sm rounded-full"
          style={{
            left: sliderStyle.left,
            width: sliderStyle.width,
            height: `calc(100% - ${parseInt(styles.padding) * 2}px)`,
            transition: 'left 250ms cubic-bezier(0.25, 0.1, 0.25, 1), width 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        />
      )}

      {/* Segments */}
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            ref={(el) => setSegmentRef(el, option.value)}
            type="button"
            onClick={() => {
              if (!isActive) onChange(option.value)
            }}
            className={`
              relative z-10 flex items-center justify-center
              h-full select-none cursor-pointer
              font-medium transition-colors duration-200
              ${styles.segment}
              ${styles.text}
              ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}
            `.trim()}
          >
            {option.icon && (
              <span className={`flex items-center shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'} transition-colors duration-200`}>
                {option.icon}
              </span>
            )}
            {option.label && <span>{option.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
