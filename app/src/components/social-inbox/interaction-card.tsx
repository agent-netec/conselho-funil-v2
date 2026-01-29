'use client';

import { SocialInteraction } from '@/types/social-inbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Twitter, Linkedin, Instagram, MessageSquare, AtSign, Phone, AlertCircle } from 'lucide-react';

interface InteractionCardProps {
  interaction: SocialInteraction;
  isActive?: boolean;
  onClick: (interaction: SocialInteraction) => void;
}

export function InteractionCard({ interaction, isActive, onClick }: InteractionCardProps) {
  const PlatformIcon = {
    x: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
    whatsapp: Phone
  }[interaction.platform];

  const getSentimentConfig = (score: number, label: string) => {
    if (score < 0.3) return { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle };
    if (label === 'positive') return { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: null };
    if (label === 'negative') return { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle };
    return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: null };
  };

  const sentiment = getSentimentConfig(interaction.metadata.sentimentScore, interaction.metadata.sentimentLabel);
  const SentimentIcon = sentiment.icon;

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:border-primary/50 mb-2 relative overflow-hidden",
        isActive ? "border-primary bg-primary/5 shadow-md" : "border-border"
      )}
      onClick={() => onClick(interaction)}
    >
      {interaction.metadata.sentimentScore < 0.3 && (
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
      )}
      <div className="flex gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={interaction.author.avatarUrl} alt={interaction.author.name} />
            <AvatarFallback>{interaction.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border">
            <PlatformIcon className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm truncate">{interaction.author.name}</span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(interaction.content.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {interaction.content.text}
          </p>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 flex items-center gap-1", sentiment.color)}>
              {SentimentIcon && <SentimentIcon className="h-2.5 w-2.5" />}
              {Math.round(interaction.metadata.sentimentScore * 100)}%
            </Badge>
            {interaction.type === 'dm' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                <MessageSquare className="h-2.5 w-2.5" /> DM
              </Badge>
            )}
            {interaction.type === 'mention' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                <AtSign className="h-2.5 w-2.5" /> MENTION
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
