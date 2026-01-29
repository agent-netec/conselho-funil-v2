"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DynamicContentRule, AudienceScan } from "@/types/personalization"
import { Zap, Save, Plus, Trash2, Layout, Video, Tag } from "lucide-react"

interface PersonalizationRuleEditorProps {
  scan: AudienceScan;
  existingRule?: DynamicContentRule;
  onSave: (rule: Partial<DynamicContentRule>) => void;
}

export function PersonalizationRuleEditor({ scan, existingRule, onSave }: PersonalizationRuleEditorProps) {
  const [headline, setHeadline] = React.useState(existingRule?.contentVariations.headline || "");
  const [vslId, setVslId] = React.useState(existingRule?.contentVariations.vslId || "");
  const [offerId, setOfferId] = React.useState(existingRule?.contentVariations.offerId || "");

  const handleSave = () => {
    onSave({
      targetPersonaId: scan.id,
      contentVariations: {
        headline,
        vslId,
        offerId
      },
      isActive: true
    });
  };

  return (
    <Card className="border-2 border-purple-100 bg-purple-50/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <CardTitle>Regra de Personalização Dinâmica</CardTitle>
        </div>
        <CardDescription>
          Defina o conteúdo que será exibido para a persona <strong>{scan.name}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Headline Personalizada
          </Label>
          <Input 
            placeholder="Ex: Como mães empreendedoras podem escalar sem perder tempo..." 
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="border-purple-200 focus-visible:ring-purple-500"
          />
          <p className="text-[10px] text-muted-foreground">
            Dica da IA: Use a dor "{scan.persona.painPoints[0]}" para maior conversão.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              ID do VSL (Opcional)
            </Label>
            <Input 
              placeholder="vsl_123..." 
              value={vslId}
              onChange={(e) => setVslId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              ID da Oferta
            </Label>
            <Input 
              placeholder="offer_abc..." 
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Descartar
          </Button>
          <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Salvar Regra
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
