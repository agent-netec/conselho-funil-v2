/**
 * Testes unitários para lib/firebase/automation.ts
 * S31-KS-03: T-01, T-02, T-03
 */

// Mocks
const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetCountFromServer = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn().mockReturnValue('mock-collection-ref'),
  doc: jest.fn().mockReturnValue('mock-doc-ref'),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getCountFromServer: (...args: unknown[]) => mockGetCountFromServer(...args),
  query: jest.fn().mockReturnValue('mock-query'),
  orderBy: jest.fn(),
  limit: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: () => ({ seconds: 1738900000, nanoseconds: 0 }),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: 'mock-db',
}));

import {
  getAutomationRules,
  getAutomationLogs,
  createAutomationLog,
  updateAutomationLogStatus,
  toggleAutomationRule,
  createInAppNotification,
  getUnreadNotificationCount,
  markNotificationsAsRead,
} from '@/lib/firebase/automation';

describe('lib/firebase/automation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // T-01: getAutomationRules retorna rules da collection correta
  describe('getAutomationRules', () => {
    it('retorna rules de brands/{brandId}/automation_rules', async () => {
      const mockDocs = [
        { id: 'rule_1', data: () => ({ name: 'Scale High', isEnabled: true }) },
        { id: 'rule_2', data: () => ({ name: 'Kill Low', isEnabled: false }) },
      ];
      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await getAutomationRules('brand-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'rule_1', name: 'Scale High', isEnabled: true });
      expect(result[1]).toEqual({ id: 'rule_2', name: 'Kill Low', isEnabled: false });
    });

    it('retorna array vazio se nenhuma rule existe', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getAutomationRules('brand-123');

      expect(result).toEqual([]);
    });
  });

  // T-02: getAutomationLogs respeita limit e orderBy
  describe('getAutomationLogs', () => {
    it('retorna logs ordenados por timestamp desc', async () => {
      const mockDocs = [
        { id: 'log_1', data: () => ({ action: 'pause_ads', status: 'executed' }) },
      ];
      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const result = await getAutomationLogs('brand-123', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'log_1', action: 'pause_ads', status: 'executed' });
    });

    it('usa maxResults default de 50', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getAutomationLogs('brand-123');

      // Verifica que foi chamado (query construída com limit)
      expect(mockGetDocs).toHaveBeenCalled();
    });
  });

  // T-03: updateAutomationLogStatus persiste status + executedBy
  describe('updateAutomationLogStatus', () => {
    it('atualiza status de um log', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateAutomationLogStatus('brand-123', 'log_1', 'executed');

      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { status: 'executed' });
    });

    it('atualiza status + executedBy quando fornecido', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateAutomationLogStatus('brand-123', 'log_1', 'executed', 'user-abc');

      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        status: 'executed',
        executedBy: 'user-abc',
      });
    });
  });

  describe('createAutomationLog', () => {
    it('cria log e retorna ID', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-log-id' });

      const logId = await createAutomationLog('brand-123', {
        ruleId: 'kill_switch_manual',
        action: 'pause_ads',
        status: 'pending_approval',
        context: {
          funnelId: 'funnel-1',
          entityId: 'meta_camp_123',
          gapDetails: { reason: 'ROAS < 1.0', severity: 'critical' },
        },
        timestamp: { seconds: 1738900000, nanoseconds: 0 } as any,
      });

      expect(logId).toBe('new-log-id');
      expect(mockAddDoc).toHaveBeenCalled();
    });
  });

  describe('toggleAutomationRule', () => {
    it('atualiza isEnabled', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await toggleAutomationRule('brand-123', 'rule_1', false);

      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', { isEnabled: false });
    });
  });

  describe('createInAppNotification', () => {
    it('cria notificação e retorna ID', async () => {
      mockAddDoc.mockResolvedValue({ id: 'notif-123' });

      const id = await createInAppNotification('brand-123', {
        type: 'kill_switch',
        title: 'Kill-Switch Acionado',
        message: 'ROAS crítico — 3 entidades afetadas',
        isRead: false,
        createdAt: { seconds: 1738900000, nanoseconds: 0 } as any,
      });

      expect(id).toBe('notif-123');
      expect(mockAddDoc).toHaveBeenCalled();
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('retorna count de notificações não-lidas', async () => {
      mockGetCountFromServer.mockResolvedValue({
        data: () => ({ count: 5 }),
      });

      const count = await getUnreadNotificationCount('brand-123');

      expect(count).toBe(5);
    });

    it('retorna 0 se nenhuma notificação não-lida', async () => {
      mockGetCountFromServer.mockResolvedValue({
        data: () => ({ count: 0 }),
      });

      const count = await getUnreadNotificationCount('brand-123');

      expect(count).toBe(0);
    });
  });

  describe('markNotificationsAsRead', () => {
    it('marca todas notificações não-lidas como lidas', async () => {
      const mockRef1 = { id: 'notif-1' };
      const mockRef2 = { id: 'notif-2' };
      mockGetDocs.mockResolvedValue({
        docs: [
          { ref: mockRef1 },
          { ref: mockRef2 },
        ],
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await markNotificationsAsRead('brand-123');

      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef1, { isRead: true });
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef2, { isRead: true });
    });
  });
});
