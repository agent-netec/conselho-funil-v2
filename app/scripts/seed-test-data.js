#!/usr/bin/env node
/**
 * Seed Test Data — Popula Firestore com dados de teste para validação E2E
 * Uso: node scripts/seed-test-data.js
 * 
 * Cria:
 * - 1 Brand de teste (test_brand_seed)
 * - 1 Competitor vinculado (test_competitor_seed)
 * - 1 Conversation de teste (test_conversation_seed)
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp, collection } = require('firebase/firestore');

// Firebase config (mesmo do app)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCfSdw6-eEHXetA80VtcjOoXk2AhqM2js',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'conselho-de-funil.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'conselho-de-funil',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'conselho-de-funil.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '757497982830',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:757497982830:web:520bba5dde47a9e21c5b7f',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEST_USER_ID = 'test_user_seed';
const TEST_BRAND_ID = 'test_brand_seed';
const TEST_COMPETITOR_ID = 'test_competitor_seed';
const TEST_CONVERSATION_ID = 'test_conversation_seed';

async function seedBrand() {
  const now = Timestamp.now();
  
  const brand = {
    id: TEST_BRAND_ID,
    userId: TEST_USER_ID,
    name: 'Marca de Teste (Seed)',
    vertical: 'SaaS',
    positioning: 'Plataforma de automação de marketing para agências',
    voiceTone: 'Profissional, direto, com pitadas de humor',
    audience: {
      who: 'Agências de marketing digital e consultores',
      pain: 'Perdem muito tempo em tarefas repetitivas e não conseguem escalar',
      awareness: 'solution_aware',
      objections: ['Preço alto', 'Curva de aprendizado', 'Já uso outra ferramenta'],
    },
    offer: {
      what: 'Plataforma de IA para automação de funis e copy',
      ticket: 297,
      type: 'recurring',
      differentiator: 'Conselho de 23 especialistas em IA',
    },
    brandKit: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        background: '#0f172a',
      },
      typography: {
        primaryFont: 'Inter',
        secondaryFont: 'Roboto',
        systemFallback: 'sans-serif',
      },
      visualStyle: 'modern',
      logoLock: {
        variants: {
          primary: { url: '', storagePath: '', format: 'svg' },
        },
        locked: false,
      },
      updatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'brands', TEST_BRAND_ID), brand);
  console.log('✓ Brand criado:', TEST_BRAND_ID);
  return brand;
}

async function seedCompetitor() {
  const now = Timestamp.now();
  
  const competitor = {
    id: TEST_COMPETITOR_ID,
    brandId: TEST_BRAND_ID,
    name: 'Competitor Exemplo (Seed)',
    websiteUrl: 'https://example.com',
    socialMedia: {
      instagram: '@example',
      linkedin: 'company/example',
    },
    category: ['Direct'],
    status: 'active',
    techStack: {
      cms: 'Next.js',
      analytics: ['Google Analytics', 'Hotjar'],
      marketing: ['Mailchimp', 'HubSpot'],
      payments: ['Stripe'],
      infrastructure: ['Vercel', 'Cloudflare'],
      updatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Competitors ficam em subcollection: brands/{brandId}/competitors/{competitorId}
  await setDoc(
    doc(db, 'brands', TEST_BRAND_ID, 'competitors', TEST_COMPETITOR_ID),
    competitor
  );
  console.log('✓ Competitor criado:', TEST_COMPETITOR_ID, '(em brands/' + TEST_BRAND_ID + '/competitors)');
  return competitor;
}

async function seedConversation() {
  const now = Timestamp.now();
  
  const conversation = {
    id: TEST_CONVERSATION_ID,
    userId: TEST_USER_ID,
    brandId: TEST_BRAND_ID,
    title: 'Conversa de Teste (Seed)',
    context: {
      mode: 'general',
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'conversations', TEST_CONVERSATION_ID), conversation);
  console.log('✓ Conversation criada:', TEST_CONVERSATION_ID);
  
  // Criar uma mensagem inicial
  const message = {
    id: 'msg_seed_1',
    conversationId: TEST_CONVERSATION_ID,
    role: 'user',
    content: 'Olá, esta é uma mensagem de teste para validar o sistema.',
    createdAt: now,
  };
  
  await setDoc(
    doc(db, 'conversations', TEST_CONVERSATION_ID, 'messages', 'msg_seed_1'),
    message
  );
  console.log('✓ Mensagem inicial criada');
  
  return conversation;
}

async function main() {
  console.log('🌱 Seed Test Data — Iniciando...\n');
  console.log('Firebase Project:', firebaseConfig.projectId);
  console.log('');

  try {
    await seedBrand();
    await seedCompetitor();
    await seedConversation();
    
    console.log('\n✅ Seed concluído com sucesso!\n');
    console.log('IDs para teste:');
    console.log('  brandId:', TEST_BRAND_ID);
    console.log('  competitorId:', TEST_COMPETITOR_ID);
    console.log('  conversationId:', TEST_CONVERSATION_ID);
    console.log('  userId:', TEST_USER_ID);
    console.log('\nAgora você pode rodar o smoke com esses IDs:');
    console.log(`  TEST_BRAND_ID=${TEST_BRAND_ID} TEST_COMPETITOR_ID=${TEST_COMPETITOR_ID} TEST_CONVERSATION_ID=${TEST_CONVERSATION_ID} npm run smoke`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

main();
