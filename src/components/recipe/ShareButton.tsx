import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'

interface ShareButtonProps {
  title: string
  text?: string
  url?: string
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const shareUrl = url || window.location.href

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast({ title: 'Lien copié !' })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} aria-label="Partager">
      <Share2 className="mr-1 h-4 w-4" />
      Partager
    </Button>
  )
}
