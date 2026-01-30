'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JourneyPage() {
  const [leadId, setLeadId] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadId.trim()) {
      router.push(`/intelligence/journey/${leadId.trim()}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Header title="Jornada do Lead" icon={Map} />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="grid gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-500" />
                Rastrear Jornada
              </CardTitle>
              <CardDescription>
                Insira o ID do Lead ou e-mail para visualizar o mapa completo de interações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input 
                  placeholder="Ex: lead_123 ou email@cliente.com" 
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Analisar Mapa
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-zinc-700 mb-4" />
                <h3 className="text-lg font-medium text-zinc-400">Leads Recentes</h3>
                <p className="text-sm text-zinc-500 max-w-[200px] mt-2">
                  A funcionalidade de histórico de leads está sendo sincronizada.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Map className="h-12 w-12 text-zinc-700 mb-4" />
                <h3 className="text-lg font-medium text-zinc-400">Heatmap de Conversão</h3>
                <p className="text-sm text-zinc-500 max-w-[200px] mt-2">
                  Visualize os pontos de maior atrito na jornada do cliente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
