import { NextRequest, NextResponse } from 'next/server';
import { ragQuery, retrieveChunks, formatContextForLLM } from '@/lib/ai/rag';
import { generateCouncilResponseWithGemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { addMessage, updateConversation } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  conversationId: string;
  mode?: 'general' | 'funnel_creation' | 'funnel_evaluation' | 'funnel_review';
  counselor?: string;
  funnelId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationId, mode = 'general', counselor, funnelId } = body;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Message and conversationId are required' },
        { status: 400 }
      );
    }

    // Configure retrieval based on mode
    let retrievalConfig = {
      topK: 10,
      minSimilarity: 0.25,
      filters: {} as { counselor?: string; docType?: string },
    };
    
    // Adjust config based on mode
    switch (mode) {
      case 'funnel_creation':
        retrievalConfig.topK = 15;
        retrievalConfig.minSimilarity = 0.2;
        break;
      case 'funnel_evaluation':
      case 'funnel_review':
        retrievalConfig.topK = 12;
        retrievalConfig.filters.docType = 'scorecards';
        break;
    }

    // Filter by counselor if specified
    if (counselor) {
      retrievalConfig.filters.counselor = counselor;
    }

    // Retrieve relevant chunks from knowledge base
    console.log('Retrieving chunks for:', message.substring(0, 100));
    const chunks = await retrieveChunks(message, retrievalConfig);
    console.log(`Found ${chunks.length} relevant chunks`);

    // Build context from retrieved chunks
    const context = formatContextForLLM(chunks);

    // Generate response using Gemini API
    let assistantResponse: string;
    
    try {
      if (!isGeminiConfigured()) {
        console.warn('Gemini API not configured, using fallback response');
        assistantResponse = generateFallbackResponse(message, chunks);
      } else {
        assistantResponse = await generateCouncilResponseWithGemini(message, context);
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      
      // Fallback response if AI fails
      assistantResponse = generateFallbackResponse(message, chunks);
    }

    // Save assistant message to Firestore
    try {
      await addMessage(conversationId, {
        role: 'assistant',
        content: assistantResponse,
        metadata: {
          sources: chunks.map(c => c.source.file),
          counselors: [...new Set(chunks.map(c => c.metadata.counselor).filter(Boolean) as string[])],
        },
      });

      // Update conversation title if it's the first message
      const firstWords = message.slice(0, 50);
      await updateConversation(conversationId, {
        title: firstWords + (message.length > 50 ? '...' : ''),
      });
    } catch (dbError) {
      console.error('Error saving to Firestore:', dbError);
      // Continue even if saving fails
    }

    return NextResponse.json({
      response: assistantResponse,
      sources: chunks.map(c => ({
        file: c.source.file,
        section: c.source.section,
        counselor: c.metadata.counselor,
        similarity: c.similarity,
      })),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback response when AI is not available
function generateFallbackResponse(
  message: string,
  chunks: Array<{ content: string; metadata: { counselor?: string; docType: string }; similarity: number }>
): string {
  if (chunks.length === 0) {
    return `**Conselho de Funil**

Desculpe, não encontrei informações específicas na base de conhecimento para responder sua pergunta.

🔧 **Possíveis causas:**
- A base de conhecimento pode não estar carregada
- Sua pergunta pode precisar de mais contexto

💡 **Sugestões:**
- Pergunte sobre arquitetura de funis
- Peça estratégias de copy e oferta
- Consulte sobre qualificação de leads
- Explore modelos mentais de marketing

Os 6 conselheiros estão prontos para ajudar:
- Russell Brunson (Arquitetura)
- Dan Kennedy (Copy)
- Frank Kern (Psicologia)
- Sam Ovens (Aquisição)
- Ryan Deiss (LTV)
- Perry Belcher (Monetização)`;
  }

  // Build a response from chunks
  const counselorsInvolved = [...new Set(
    chunks.map(c => c.metadata.counselor).filter(Boolean)
  )];

  const counselorNames: Record<string, string> = {
    russell_brunson: 'Russell Brunson',
    dan_kennedy: 'Dan Kennedy',
    frank_kern: 'Frank Kern',
    sam_ovens: 'Sam Ovens',
    ryan_deiss: 'Ryan Deiss',
    perry_belcher: 'Perry Belcher',
  };

  let response = `## Análise do Conselho de Funil\n\n`;

  if (counselorsInvolved.length > 0) {
    response += `*Consultando: ${counselorsInvolved.map(c => counselorNames[c!] || c).join(', ')}*\n\n`;
  }

  response += `Encontrei **${chunks.length}** referência(s) relevante(s) para sua pergunta:\n\n`;

  // Add top 3 chunks as quotes
  chunks.slice(0, 3).forEach((chunk, i) => {
    const counselor = chunk.metadata.counselor 
      ? counselorNames[chunk.metadata.counselor] 
      : 'Base de Conhecimento';
    
    const relevance = (chunk.similarity * 100).toFixed(0);
    const excerpt = chunk.content.slice(0, 250).replace(/\n/g, ' ').trim();
    
    response += `### ${counselor} (${chunk.metadata.docType})\n`;
    response += `*Relevância: ${relevance}%*\n\n`;
    response += `> ${excerpt}...\n\n`;
  });

  response += `---\n📚 *${chunks.length} fonte(s) consultada(s) na base de conhecimento*\n\n`;
  response += `⚠️ *Nota: Esta é uma resposta baseada apenas em retrieval. Configure o Vertex AI para respostas completas do Conselho.*`;

  return response;
}
