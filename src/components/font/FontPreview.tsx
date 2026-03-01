import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { loadFontFace } from '@/hooks/useHandwritingFont'
import type { HandwritingFont } from '@/types'

const DEFAULT_TEXT = 'Voix ambiguë d\'un cœur qui, au zéphyr, préfère les jattes de kiwis.'

interface FontPreviewProps {
  font: HandwritingFont
}

export function FontPreview({ font }: FontPreviewProps) {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadFontFace(font).then(setLoaded)
  }, [font])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aperçu — {font.font_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tapez du texte pour l'aperçu..."
          className="min-h-[60px]"
        />

        <div
          className="min-h-[120px] rounded-lg border border-border bg-card p-6 text-2xl leading-relaxed"
          style={loaded ? { fontFamily: `"${font.font_name}", cursive` } : undefined}
        >
          {text || DEFAULT_TEXT}
        </div>

        {!loaded && font.status === 'ready' && (
          <p className="text-sm text-muted-foreground">Chargement de la police...</p>
        )}

        <div className="flex justify-end">
          <Button asChild>
            <Link to="/my-recipes">
              <BookOpen className="mr-2 h-4 w-4" />
              Aller à mes recettes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
