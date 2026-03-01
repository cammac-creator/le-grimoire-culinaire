import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { formatDate, getInitial } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Comment } from '@/types'

interface CommentSectionProps {
  recipeId: string
}

export function CommentSection({ recipeId }: CommentSectionProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', recipeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profile:profiles(id, username, avatar_url)')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Comment[]
    },
  })

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Non authentifié')
      const { error } = await supabase.from('comments').insert({
        recipe_id: recipeId,
        user_id: user.id,
        content: text,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['comments', recipeId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      addComment.mutate(content.trim())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.map((comment, i) => (
          <div key={comment.id}>
            {i > 0 && <Separator className="mb-4" />}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitial(comment.profile?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {comment.profile?.username ?? 'Anonyme'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun commentaire pour le moment.
          </p>
        )}

        {user && (
          <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60px]"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!content.trim() || addComment.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
