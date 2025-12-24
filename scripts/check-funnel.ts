/**
 * Script para verificar se um funil existe no Firestore
 * Uso: npx ts-node scripts/check-funnel.ts <funnelId>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializa sem credenciais (usa default do ambiente)
const app = initializeApp({
  projectId: 'conselho-de-funil',
});

const db = getFirestore(app);

async function checkFunnel(funnelId: string) {
  console.log(`\n🔍 Verificando funil: ${funnelId}\n`);
  
  try {
    const doc = await db.collection('funnels').doc(funnelId).get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ FUNIL ENCONTRADO!\n');
      console.log('📋 Dados:');
      console.log(`   Nome: ${data?.name}`);
      console.log(`   Status: ${data?.status}`);
      console.log(`   Objetivo: ${data?.context?.objective}`);
      console.log(`   Criado em: ${data?.createdAt?.toDate?.()}`);
      console.log(`   UserId: ${data?.userId}`);
      console.log('\n✅ O funil está salvo corretamente no Firebase!\n');
    } else {
      console.log('❌ FUNIL NÃO ENCONTRADO\n');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar:', error);
  }
  
  process.exit(0);
}

// Pega o ID do argumento ou usa o padrão
const funnelId = process.argv[2] || 'OWXmVUH7Lw5drntKOIEG';
checkFunnel(funnelId);


