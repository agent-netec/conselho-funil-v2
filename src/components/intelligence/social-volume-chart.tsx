'use client';

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Share2, Twitter, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SocialVolumeData {
  date: string;
  twitter: number;
  reddit: number;
  total: number;
}

interface SocialVolumeChartProps {
  data?: SocialVolumeData[];
  loading?: boolean;
}

export function SocialVolumeChart({ data, loading }: SocialVolumeChartProps) {
  if (loading || !data) return <SocialVolumeChartSkeleton />;

  const totalMentions = data.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-500" />
              Volume Social
            </CardTitle>
            <CardDescription>
              Menções totais capturadas no X (Twitter) e Reddit.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{totalMentions.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Total no Período</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTwitter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1DA1F2" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1DA1F2" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReddit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4500" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF4500" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="twitter" 
                name="X (Twitter)"
                stroke="#1DA1F2" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTwitter)" 
              />
              <Area 
                type="monotone" 
                dataKey="reddit" 
                name="Reddit"
                stroke="#FF4500" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorReddit)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50">
              <Twitter className="w-3 h-3 text-[#1DA1F2]" />
            </div>
            <span className="text-xs font-medium">X (Twitter)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-50">
              <MessageSquare className="w-3 h-3 text-[#FF4500]" />
            </div>
            <span className="text-xs font-medium">Reddit</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialVolumeChartSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-16 mb-1 ml-auto" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full mt-4 rounded-lg" />
        <div className="flex justify-center gap-6 mt-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
