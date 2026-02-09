"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DynamicContentRule, AudienceScan } from "@/types/personalization"
import { Zap, Save, Trash2, Layout, Video, Tag, XCircle, Pencil } from "lucide-react"

interface PersonalizationRuleEditorProps {
  scan: AudienceScan;
  existingRule?: DynamicContentRule;
  onSave: (rule: Partial<DynamicContentRule>) => void;
  onCancel?: () => void;
  onDelete?: (ruleId: string) => void;
}

export function PersonalizationRuleEditor({
  scan,
  existingRule,
  onSave,
  onCancel,
  onDelete,
}: PersonalizationRuleEditorProps) {
  const isEditing = Boolean(existingRule);

  const [headline, setHeadline] = React.useState(existingRule?.contentVariations.headline || "");
  const [vslId, setVslId] = React.useState(existingRule?.contentVariations.vslId || "");
  const [offerId, setOfferId] = React.useState(existingRule?.contentVariations.offerId || "");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Sincronizar campos quando existingRule muda (ex: seleção de outra rule)
  React.useEffect(() => {
    setHeadline(existingRule?.contentVariations.headline || "");
    setVslId(existingRule?.contentVariations.vslId || "");
    setOfferId(existingRule?.contentVariations.offerId || "");
    setConfirmDelete(false);
  }, [existingRule]);

  const handleSave = () => {
    const ruleData: Partial<DynamicContentRule> = {
      targetPersonaId: scan.id,
      contentVariations: {
        headline,
        vslId,
        offerId,
      },
      isActive: existingRule?.isActive ?? true,
    };

    if (existingRule) {
      ruleData.id = existingRule.id;
    }

    onSave(ruleData);
  };

  const handleDiscard = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    // Fallback: limpar campos
    setHeadline("");
    setVslId("");
    setOfferId("");
    setConfirmDelete(false);
  };

  const handleDelete = () => {
    if (!existingRule) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.(existingRule.id);
    setConfirmDelete(false);
  };

  return (
    <Card className="border-2 border-purple-100 bg-purple-50/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Pencil className="w-5 h-5 text-blue-500" />
          ) : (
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          )}
          <CardTitle>
            {isEditing ? "Editar Regra de Personalização" : "Nova Regra de Personalização"}
          </CardTitle>
        </div>
        <CardDescription>
          {isEditing
            ? <>Editando regra para a persona <strong>{scan.name}</strong>.</>
            : <>Defina o conteúdo que será exibido para a persona <strong>{scan.name}</strong>.</>}
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
            Dica da IA: Use a dor &quot;{scan.persona.painPoints[0]}&quot; para maior conversão.
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

        <div className="flex justify-between items-center pt-4 border-t">
          {/* Lado esquerdo: Excluir (só em modo edição) */}
          <div>
            {isEditing && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? "Confirmar exclusão?" : "Excluir"}
              </Button>
            )}
          </div>

          {/* Lado direito: Descartar + Salvar/Atualizar */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDiscard}>
              <XCircle className="w-4 h-4" />
              Descartar
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleSave}
              disabled={!headline.trim()}
            >
              <Save className="w-4 h-4" />
              {isEditing ? "Atualizar Regra" : "Salvar Regra"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
