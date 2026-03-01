import { Share2, Copy, MessageCircle, Send, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/useToast'

interface ShareMenuProps {
  title: string
  text?: string
  url?: string
}

export function ShareMenu({ title, text, url }: ShareMenuProps) {
  const shareUrl = url || window.location.href
  const shareText = text ? `${title} - ${text}` : title

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text, url: shareUrl })
    } catch {
      // User cancelled
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast({ title: 'Lien copié !' })
  }

  if (typeof navigator.share === 'function') {
    return (
      <Button variant="outline" size="sm" onClick={handleNativeShare} aria-label="Partager">
        <Share2 className="mr-1 h-4 w-4" />
        Partager
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Partager">
          <Share2 className="mr-1 h-4 w-4" />
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={copyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copier le lien
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
            <Send className="mr-2 h-4 w-4" />
            Telegram
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
