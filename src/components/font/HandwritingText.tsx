import { useEffect, useState, type ElementType, type ReactNode } from 'react'
import { useHandwritingFont, loadFontFace } from '@/hooks/useHandwritingFont'

interface HandwritingTextProps {
  fontId: string | null | undefined
  children: ReactNode
  className?: string
  as?: ElementType
}

export function HandwritingText({
  fontId,
  children,
  className,
  as: Component = 'span',
}: HandwritingTextProps) {
  const { data: font } = useHandwritingFont(fontId ?? undefined)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (font && font.status === 'ready') {
      loadFontFace(font).then(setLoaded)
    }
  }, [font])

  const style = loaded && font
    ? { fontFamily: `"${font.font_name}", cursive` }
    : undefined

  return (
    <Component className={className} style={style}>
      {children}
    </Component>
  )
}
