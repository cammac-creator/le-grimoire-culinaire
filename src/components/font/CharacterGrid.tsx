import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { FRENCH_CHARSET } from '@/types'
import type { CroppedGlyph } from '@/lib/character-extractor'

interface CharacterGridProps {
  glyphs: Map<string, CroppedGlyph>
  validated: Set<string>
  onToggle: (char: string) => void
}

const CATEGORIES = [
  { label: 'Minuscules', chars: 'abcdefghijklmnopqrstuvwxyz'.split('') },
  { label: 'Majuscules', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { label: 'Chiffres', chars: '0123456789'.split('') },
  { label: 'Accents', chars: 'éèêëàâùûôîïçÉÈÊËÀÂÙÛÔÎÏÇ'.split('') },
  { label: 'Ponctuation', chars: `.,;:!?'-"()`.split('') },
]

export function CharacterGrid({ glyphs, validated, onToggle }: CharacterGridProps) {
  const coverage = useMemo(() => {
    const total = FRENCH_CHARSET.length
    const found = FRENCH_CHARSET.filter((c) => glyphs.has(c) && validated.has(c)).length
    return { found, total }
  }, [glyphs, validated])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Cliquez sur un caractère pour le valider ou l'invalider
        </p>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {coverage.found}/{coverage.total} caractères
        </span>
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">{cat.label}</h4>
          <div className="flex flex-wrap gap-2">
            {cat.chars.map((char) => {
              const glyph = glyphs.get(char)
              const isValidated = validated.has(char)
              const isMissing = !glyph

              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => !isMissing && onToggle(char)}
                  disabled={isMissing}
                  className={cn(
                    'flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 transition-colors',
                    isMissing && 'cursor-default border-dashed border-border bg-muted/30',
                    !isMissing && isValidated && 'border-primary bg-primary/5 hover:bg-primary/10',
                    !isMissing && !isValidated && 'border-destructive/50 bg-destructive/5 hover:bg-destructive/10'
                  )}
                  title={isMissing ? `"${char}" non détecté` : `"${char}" — ${isValidated ? 'validé' : 'invalidé'}`}
                >
                  {glyph ? (
                    <img
                      src={glyph.dataUrl}
                      alt={char}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <span className="text-lg text-muted-foreground/40">{char}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
