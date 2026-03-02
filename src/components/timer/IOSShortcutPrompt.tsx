import { Smartphone, ExternalLink, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SHORTCUT_INSTALL_URL } from '@/lib/ios-shortcut'

interface IOSShortcutPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onFallback: () => void
}

export function IOSShortcutPrompt({
  open,
  onOpenChange,
  onConfirm,
  onFallback,
}: IOSShortcutPromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[70] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Minuteur natif iPhone
          </DialogTitle>
          <DialogDescription>
            Pour utiliser le minuteur natif de votre iPhone, installez ce
            Raccourci Apple. C'est une opération unique.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Etape 1 : installer */}
          <a
            href={SHORTCUT_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Installer le Raccourci</div>
              <div className="text-xs text-muted-foreground">
                S'ouvre dans l'app Raccourcis
              </div>
            </div>
          </a>

          {/* Etape 2 : confirmer */}
          <Button onClick={onConfirm} className="w-full gap-2">
            <Timer className="h-4 w-4" />
            C'est fait, lancer le minuteur
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <button
            type="button"
            onClick={onFallback}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Utiliser le minuteur web
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
