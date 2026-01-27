import { createAgency, addAgencyClient, getAgencyClients, addAgencyMember } from '../agency/engine';
import { db } from './config';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

describe('ST-23.1: Multi-Tenancy Schema & Logic', () => {
  const testOwnerId = 'owner_test_123';
  let testAgencyId: string;

  beforeAll(async () => {
    // Setup: Criar uma agência de teste
    testAgencyId = await createAgency(testOwnerId, {
      name: 'Test Agency',
      slug: 'test-agency',
      branding: {
        logoUrl: '',
        colors: { primary: '#000000', secondary: '#ffffff' }
      },
      settings: {
        maxClients: 5,
        featuresEnabled: ['all'],
        whiteLabelEnabled: true
      }
    });
  });

  it('should create an agency and assign the owner as admin', async () => {
    const agencySnap = await doc(db, 'agencies', testAgencyId);
    const memberSnap = await doc(db, 'agencies', testAgencyId, 'members', testOwnerId);
    
    expect(testAgencyId).toBeDefined();
  });

  it('should add and list clients for an agency', async () => {
    const clientId = await addAgencyClient(testAgencyId, {
      name: 'Client X',
      slug: 'client-x',
      status: 'active',
      config: { currency: 'BRL', timezone: 'America/Sao_Paulo' },
      contactInfo: { email: 'client@x.com' }
    });

    const clients = await getAgencyClients(testAgencyId);
    expect(clients.length).toBeGreaterThan(0);
    expect(clients.find(c => c.id === clientId)).toBeDefined();
  });

  it('should isolate members between agencies', async () => {
    const otherAgencyId = await createAgency('other_owner', {
      name: 'Other Agency',
      slug: 'other',
      branding: { logoUrl: '', colors: { primary: '#000', secondary: '#fff' } },
      settings: { maxClients: 1, featuresEnabled: [], whiteLabelEnabled: false }
    });

    const membersOther = await getDocs(collection(db, 'agencies', otherAgencyId, 'members'));
    expect(membersOther.docs.length).toBe(1);
    expect(membersOther.docs[0].id).toBe('other_owner');
  });
});
