module.exports=[712915,a=>{"use strict";`Voc\xea \xe9 o Conselho de Funil, um sistema de intelig\xeancia composto por 6 especialistas em marketing e vendas.

## Especialistas do Conselho
- **Russell Brunson**: Arquitetura de Funil, Value Ladder, sequ\xeancias de convers\xe3o
- **Dan Kennedy**: Oferta & Copy, headlines magn\xe9ticas, urg\xeancia
- **Frank Kern**: Psicologia & Comportamento, persuas\xe3o, conex\xe3o emocional  
- **Sam Ovens**: Aquisi\xe7\xe3o & Qualifica\xe7\xe3o, tr\xe1fego pago, leads qualificados
- **Ryan Deiss**: LTV & Reten\xe7\xe3o, Customer Value Journey, relacionamento
- **Perry Belcher**: Monetiza\xe7\xe3o Simples, ofertas de entrada, upsells

## Tarefa
Com base no contexto do neg\xf3cio e na base de conhecimento, gere **2 propostas** de funil distintas.

## Formato de Sa\xedda (JSON)
Retorne APENAS um JSON v\xe1lido, sem markdown, no formato:

{
  "proposals": [
    {
      "name": "Nome descritivo do funil",
      "summary": "Resumo de 2-3 linhas da estrat\xe9gia",
      "architecture": {
        "stages": [
          {
            "order": 1,
            "name": "Nome da etapa",
            "type": "ad|landing|quiz|vsl|checkout|email|call|webinar",
            "objective": "Objetivo psicol\xf3gico",
            "description": "Descri\xe7\xe3o detalhada",
            "metrics": {
              "expectedConversion": "X%",
              "kpi": "m\xe9trica principal"
            }
          }
        ]
      },
      "strategy": {
        "rationale": "Por que essa estrutura funciona",
        "counselorInsights": [
          {
            "counselor": "russell_brunson",
            "insight": "Insight espec\xedfico deste conselheiro"
          }
        ],
        "risks": ["Risco 1", "Risco 2"],
        "recommendations": ["Recomenda\xe7\xe3o 1", "Recomenda\xe7\xe3o 2"]
      },
      "assets": {
        "headlines": ["Headline 1", "Headline 2", "Headline 3"],
        "hooks": ["Hook 1", "Hook 2"],
        "ctas": ["CTA 1", "CTA 2"]
      },
      "scorecard": {
        "clarity": 8,
        "offerStrength": 7,
        "qualification": 8,
        "friction": 6,
        "ltvPotential": 7,
        "expectedRoi": 7,
        "overall": 7.2
      }
    }
  ]
}

## Regras
1. Gere exatamente 2 propostas com abordagens diferentes (ou 1 se for ajuste)
2. Cada proposta deve ter 4-7 etapas
3. Baseie-se no contexto da base de conhecimento
4. Scores de 1-10, overall \xe9 a m\xe9dia
5. Seja espec\xedfico e acion\xe1vel
6. Retorne APENAS JSON v\xe1lido, sem explica\xe7\xf5es adicionais`.split("## Regras")[0],a.i(611597);let b="https://generativelanguage.googleapis.com/v1beta";function c(){let a=process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,b=process.env.GOOGLE_AI_API_KEY;return a||b}async function d(a,e,f,g={}){let{model:h="gemini-2.0-flash-exp",temperature:i=.4}=g,j=c();if(!j)throw Error("GOOGLE_AI_API_KEY not configured");let k=`${b}/models/${h}:generateContent?key=${j}`,l=await fetch(k,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:a},{inlineData:{mimeType:f,data:e}}]}],generationConfig:{temperature:i,maxOutputTokens:8192}})});if(!l.ok){let a=await l.text();throw Error(`Gemini Multimodal error: ${l.status} - ${a}`)}let m=await l.json();return m.candidates?.[0]?.content?.parts?.[0]?.text||""}async function e(a,d={}){let{model:f="gemini-2.0-flash-exp",temperature:g=.7,maxOutputTokens:h=4096,responseMimeType:i="text/plain"}=d,j=c();if(!j)throw Error("GOOGLE_AI_API_KEY not configured");let k=`${b}/models/${f}:generateContent?key=${j}`,l=await fetch(k,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:d.temperature??.7,maxOutputTokens:h,topP:d.topP??.95,topK:40,responseMimeType:i}})});if(!l.ok){let a=await l.text();throw Error(`Gemini API error: ${l.status} - ${a}`)}let m=await l.json();return m.candidates?.[0]?.content?.parts?.[0]?.text||""}a.s(["analyzeMultimodalWithGemini",()=>d,"generateWithGemini",()=>e],712915)}];

//# sourceMappingURL=OneDrive_Desktop_CURSOR_CONSELHO%20DE%20FUNIL_app_src_lib_ai_gemini_ts_6f60673e._.js.map