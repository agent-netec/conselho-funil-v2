module.exports=[918622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},193695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},673438,e=>{"use strict";function t(e){return`## CONTEXTO DA MARCA (PRIORIDADE M\xc1XIMA)
**Marca:** ${e.name}
**Vertical:** ${e.vertical}
**Posicionamento:** ${e.positioning}
**Tom de Voz:** ${e.voiceTone}

### P\xfablico-Alvo da Marca
- **Perfil:** ${e.audience.who}
- **Dor Principal:** ${e.audience.pain}
- **Consci\xeancia:** ${e.audience.awareness}
${e.audience.objections.length>0?`- **Obje\xe7\xf5es Conhecidas:** ${e.audience.objections.join(", ")}`:""}

### Oferta Principal
- **Produto/Servi\xe7o:** ${e.offer.what}
- **Ticket:** R$ ${e.offer.ticket.toLocaleString("pt-BR")}
- **Tipo:** ${e.offer.type}
- **Diferencial Competitivo:** ${e.offer.differentiator}

---

**INSTRU\xc7\xd5ES IMPORTANTES:**
1. Todas as propostas DEVEM alinhar-se com o tom de voz "${e.voiceTone}"
2. As headlines e copy DEVEM refletir o posicionamento da marca
3. O funil DEVE endere\xe7ar as obje\xe7\xf5es conhecidas do p\xfablico
4. Use o diferencial competitivo como eixo central da estrat\xe9gia
5. Considere o ticket de R$ ${e.offer.ticket.toLocaleString("pt-BR")} ao sugerir estrat\xe9gias de convers\xe3o

---
`}function a(e){let t=`### Marca: ${e.name}
- **Vertical**: ${e.vertical}
- **Posicionamento**: ${e.positioning}
- **Tom de Voz**: ${e.voiceTone}

### P\xfablico-Alvo da Marca
- **Quem**: ${e.audience.who}
- **Dor Principal**: ${e.audience.pain}
- **N\xedvel de Consci\xeancia**: ${e.audience.awareness}
${e.audience.objections.length>0?`- **Obje\xe7\xf5es**: ${e.audience.objections.join(", ")}`:""}

### Oferta da Marca
- **Produto/Servi\xe7o**: ${e.offer.what}
- **Ticket M\xe9dio**: R$ ${e.offer.ticket.toLocaleString("pt-BR")}
- **Tipo**: ${e.offer.type}
- **Diferencial**: ${e.offer.differentiator}
`;if(e.brandKit){let a=e.brandKit;t+=`
### BrandKit (Identidade Visual)
- **Estilo Visual**: ${a.visualStyle}
- **Cores**: Prim\xe1ria: ${a.colors.primary}, Secund\xe1ria: ${a.colors.secondary}, Accent: ${a.colors.accent}, Background: ${a.colors.background}
- **Tipografia**: Principal: ${a.typography.primaryFont}, Secund\xe1ria: ${a.typography.secondaryFont} (Fallback: ${a.typography.systemFallback})
- **Logo**: ${a.logoLock.locked?"USAR APENAS LOGO OFICIAL (LOCKED)":"Permite variações"}
- **URL Logo Principal**: ${a.logoLock.variants.primary.url}
${a.logoLock.variants.horizontal?`- **URL Logo Horizontal**: ${a.logoLock.variants.horizontal.url}
`:""}${a.logoLock.variants.icon?`- **URL \xcdcone**: ${a.logoLock.variants.icon.url}
`:""}`}return t+`
**⚠️ IMPORTANTE:** Todas as respostas devem respeitar o tom de voz, posicionamento e contexto desta marca.`}function r(e,t=[]){let a=e.context,o=a.channel?.main||a.channels?.primary||"N/A",n=`### Funil: ${e.name}
- **Status**: ${e.status}
- **Objetivo**: ${a.objective}
- **Empresa**: ${a.company}
- **Mercado**: ${a.market}

### P\xfablico-Alvo
- **Quem**: ${a.audience?.who||"N/A"}
- **Dor**: ${a.audience?.pain||"N/A"}
- **N\xedvel de Consci\xeancia**: ${a.audience?.awareness||"N/A"}

### Oferta
- **Produto**: ${a.offer?.what||"N/A"}
- **Ticket**: ${a.offer?.ticket||"N/A"}
- **Tipo**: ${a.offer?.type||"N/A"}

### Canais
- **Principal**: ${o}
`;return t.length>0&&(n+=`
### Propostas Geradas (${t.length})
`,t.slice(0,2).forEach((e,t)=>{let a=e.scorecard?.overall||"N/A";n+=`
**${t+1}. ${e.name}** (Score: ${a})
- ${e.summary?.slice(0,200)||"Sem resumo"}...
`,e.strategy?.risks?.length&&(n+=`- Riscos: ${e.strategy.risks.slice(0,2).join(", ")}
`)})),n}function o(e){let t=e.trim(),a=t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);if(a&&a[1])t=a[1].trim();else{let e=t.indexOf("{"),a=t.lastIndexOf("}");-1!==e&&-1!==a&&a>e&&(t=t.substring(e,a+1))}try{return JSON.parse(t)}catch(a){throw console.error("Failed to parse JSON. Original text:",e),console.error("Cleaned text:",t),a}}e.s(["formatBrandContextForChat",()=>a,"formatBrandContextForFunnel",()=>t,"formatFunnelContextForChat",()=>r,"parseAIJSON",()=>o])},342343,e=>{"use strict";var t=e.i(906661),a=e.i(276806),r=e.i(981990),o=e.i(707163),n=e.i(893013),i=e.i(416393),s=e.i(418829),l=e.i(907831),c=e.i(787414),d=e.i(251948),u=e.i(254140),p=e.i(847739),x=e.i(877290),f=e.i(195428),h=e.i(114365),m=e.i(193695);e.i(495983);var g=e.i(56931),v=e.i(758910),R=e.i(346414),$=e.i(673438);let E=new R.GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY||"");async function C(e){try{let{funnelId:t,userId:a,context:r}=await e.json();if(!t||!r?.copy)return v.NextResponse.json({error:"Contexto de copy é obrigatório."},{status:400});let o=process.env.GEMINI_MODEL||"gemini-2.0-flash-exp",n=E.getGenerativeModel({model:o,generationConfig:{responseMimeType:"application/json"}}),i=`
      Voc\xea \xe9 o Conselho de Social Media do "Conselho de Funil".
      Sua miss\xe3o \xe9 extrair HOOKS (ganchos de aten\xe7\xe3o) magn\xe9ticos de uma copy aprovada.

      [CONTEXTO ESTRAT\xc9GICO]
      Objetivo: ${r.objective}
      P\xfablico-alvo: ${r.targetAudience}
      
      [COPY DE REFER\xcaNCIA]
      ${r.copy}

      [INSTRU\xc7\xd5ES]
      1. Crie 5 hooks diferentes focados em parar o scroll.
      2. Varie os estilos: Curiosidade, Medo/Alerta, Benef\xedcio Direto, Contra-intuitivo, Prova Social.
      3. Adapte cada hook para ser multi-plataforma (Instagram, LinkedIn, TikTok).
      
      Retorne APENAS um JSON no formato:
      {
        "hooks": [
          { "content": "Texto do hook...", "style": "Estilo", "platform": "Plataforma sugerida" }
        ]
      }
    `,s=(await n.generateContent(i)).response.text(),l=(0,$.parseAIJSON)(s);return v.NextResponse.json({success:!0,hooks:l.hooks||[]})}catch(e){return console.error("Social generation error:",e),v.NextResponse.json({error:"Falha ao gerar hooks."},{status:500})}}e.s(["POST",()=>C,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],795930);var y=e.i(795930);let A=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/social/generate/route",pathname:"/api/social/generate",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/OneDrive/Desktop/CURSOR/CONSELHO DE FUNIL/app/src/app/api/social/generate/route.ts",nextConfigOutput:"",userland:y}),{workAsyncStorage:O,workUnitAsyncStorage:T,serverHooks:k}=A;function w(){return(0,r.patchFetch)({workAsyncStorage:O,workUnitAsyncStorage:T})}async function N(e,t,r){A.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/social/generate/route";v=v.replace(/\/index$/,"")||"/";let R=await A.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:$,params:E,nextConfig:C,parsedUrl:y,isDraftMode:O,prerenderManifest:T,routerServerContext:k,isOnDemandRevalidate:w,revalidateOnlyGenerated:N,resolvedPathname:S,clientReferenceManifest:P,serverActionsManifest:b}=R,j=(0,s.normalizeAppPath)(v),I=!!(T.dynamicRoutes[j]||T.routes[S]),M=async()=>((null==k?void 0:k.render404)?await k.render404(e,t,y,!1):t.end("This page could not be found"),null);if(I&&!O){let e=!!T.routes[S],t=T.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(C.experimental.adapterPath)return await M();throw new m.NoFallbackError}}let D=null;!I||A.isDev||O||(D="/index"===(D=S)?"/":D);let L=!0===A.isDev||!I,U=I&&!L;b&&P&&(0,i.setManifestsSingleton)({page:v,clientReferenceManifest:P,serverActionsManifest:b});let F=e.method||"GET",_=(0,n.getTracer)(),H=_.getActiveScopeSpan(),q={params:E,prerenderManifest:T,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:C.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,r,o)=>A.onRequestError(e,t,r,o,k)},sharedContext:{buildId:$}},K=new l.NodeNextRequest(e),V=new l.NodeNextResponse(t),B=c.NextRequestAdapter.fromNodeNextRequest(K,(0,c.signalFromNodeResponse)(t));try{let i=async e=>A.handle(B,q).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=_.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=a.get("next.route");if(r){let t=`${F} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${F} ${v}`)}),s=!!(0,o.getRequestMeta)(e,"minimalMode"),l=async o=>{var n,l;let c=async({previousCacheEntry:a})=>{try{if(!s&&w&&N&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(o);e.fetchMetrics=q.renderOpts.fetchMetrics;let l=q.renderOpts.pendingWaitUntil;l&&r.waitUntil&&(r.waitUntil(l),l=void 0);let c=q.renderOpts.collectedTags;if(!I)return await (0,p.sendResponse)(K,V,n,q.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,x.toNodeOutgoingHttpHeaders)(n.headers);c&&(t[h.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==q.renderOpts.collectedRevalidate&&!(q.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&q.renderOpts.collectedRevalidate,r=void 0===q.renderOpts.collectedExpire||q.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:q.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:r}}}}catch(t){throw(null==a?void 0:a.isStale)&&await A.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:w})},!1,k),t}},d=await A.handleResponse({req:e,nextConfig:C,cacheKey:D,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:T,isRoutePPREnabled:!1,isOnDemandRevalidate:w,revalidateOnlyGenerated:N,responseGenerator:c,waitUntil:r.waitUntil,isMinimalMode:s});if(!I)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",w?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,x.fromNodeOutgoingHttpHeaders)(d.value.headers);return s&&I||m.delete(h.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,f.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(K,V,new Response(d.value.body,{headers:m,status:d.value.status||200})),null};H?await l(H):await _.withPropagatedContext(e.headers,()=>_.trace(d.BaseServerSpan.handleRequest,{spanName:`${F} ${v}`,kind:n.SpanKind.SERVER,attributes:{"http.method":F,"http.target":e.url}},l))}catch(t){if(t instanceof m.NoFallbackError||await A.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:w})},!1,k),I)throw t;return await (0,p.sendResponse)(K,V,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>w,"routeModule",()=>A,"serverHooks",()=>k,"workAsyncStorage",()=>O,"workUnitAsyncStorage",()=>T],342343)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__ec50962b._.js.map