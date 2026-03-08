import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'
import { useLocale } from '@/hooks/useLocale'

interface ShareButtonProps {
  title: string
  text?: string
  url?: string
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const { t } = useLocale()
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
      toast({ title: t('recipe.linkCopied') })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} aria-label={t('recipe.share')}>
      <Share2 className="mr-1 h-4 w-4" />
      {t('recipe.share')}
    </Button>
  )
}
