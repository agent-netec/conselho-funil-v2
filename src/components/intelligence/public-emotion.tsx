'use client';

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Smile, 
  Frown, 
  Meh, 
  Flame, 
  AlertCircle, 
  Zap,
  Heart,
  MessageCircle
} from "lucide-react";

interface EmotionData {
  label: string;
  value: number; // 0-100
  color: string;
  icon: React.ElementType;
}

interface PublicEmotionProps {
  emotions?: {
    joy: number;
    anger: number;
    sadness: number;
    surprise: number;
    fear: number;
    neutral: number;
  };
  loading?: boolean;
}

export function PublicEmotion({ emotions, loading }: PublicEmotionProps) {
  if (loading || !emotions) return <PublicEmotionSkeleton />;

  const emotionList: EmotionData[] = [
    { label: "Alegria", value: emotions.joy, color: "text-yellow-500", icon: Smile },
    { label: "Raiva", value: emotions.anger, color: "text-red-600", icon: Flame },
    { label: "Tristeza", value: emotions.sadness, color: "text-blue-500", icon: Frown },
    { label: "Surpresa", value: emotions.surprise, color: "text-purple-500", icon: Zap },
    { label: "Medo", value: emotions.fear, color: "text-orange-500", icon: AlertCircle },
    { label: "Neutro", value: emotions.neutral, color: "text-gray-400", icon: Meh },
  ].sort((a, b) => b.value - a.value);

  const dominant = emotionList[0];

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Emoção do Público
        </CardTitle>
        <CardDescription>
          Análise de sentimentos predominantes nas redes sociais.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-muted/30 border border-muted">
          <div className={`p-3 rounded-full bg-background border-2 ${dominant.color.replace('text-', 'border-')}`}>
            <dominant.icon className={`w-8 h-8 ${dominant.color}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Emoção Predominante</p>
            <h3 className="text-xl font-bold">{dominant.label}</h3>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-black">{dominant.value}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {emotionList.slice(1).map((emotion) => (
            <div key={emotion.label} className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
              <emotion.icon className={`w-4 h-4 ${emotion.color}`} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {emotion.label}
                  </span>
                  <span className="text-[10px] font-bold">{emotion.value}%</span>
                </div>
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${emotion.color.replace('text-', 'bg-')}`} 
                    style={{ width: `${emotion.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicEmotionSkeleton() {
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="pt-4">
        <Skeleton className="h-20 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
