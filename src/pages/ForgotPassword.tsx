import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { BookOpen, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { translateAuthError } from '@/lib/auth-errors'
import { useLocale } from '@/hooks/useLocale'

const schema = z.object({
  email: z.email('Email invalide'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const { t } = useLocale()
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : 'Une erreur est survenue'))
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {sent ? <Mail className="h-6 w-6 text-primary" /> : <BookOpen className="h-6 w-6 text-primary" />}
          </div>
          <CardTitle className="text-2xl">
            {sent ? t('auth.emailSent') : t('auth.forgotTitle')}
          </CardTitle>
          <CardDescription>
            {sent ? t('auth.emailSentDesc') : t('auth.forgotDesc')}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardFooter className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.backToLogin')}
              </Link>
            </Button>
          </CardFooter>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('auth.sending') : t('auth.sendLink')}
              </Button>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-1 inline h-3 w-3" />
                {t('auth.backToLogin')}
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
