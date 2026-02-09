/**
 * Content Calendar CRUD Tests
 * @story S33-CAL-01, S33-CAL-02
 *
 * DT-04: Verifica in-memory sort (ZERO orderBy no Firestore)
 * DT-05: Verifica writeBatch para reorder (ZERO updates sequenciais)
 */

import {
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import {
  createCalendarItem,
  getCalendarItems,
  updateCalendarItem,
  deleteCalendarItem,
  reorderCalendarItems,
} from '@/lib/firebase/content-calendar';

// Mocks ja configurados no jest.setup.js

describe('Content Calendar CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCalendarItem', () => {
    it('cria item com Timestamp.now() em createdAt e updatedAt', async () => {
      const mockDocRef = { id: 'item-123' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await createCalendarItem('brand-1', {
        title: 'Post de teste',
        format: 'post',
        platform: 'instagram',
        scheduledDate: Timestamp.now(),
        content: 'Conteudo de teste',
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('item-123');
      expect(result.title).toBe('Post de teste');
      expect(result.format).toBe('post');
      expect(result.platform).toBe('instagram');
      expect(result.status).toBe('draft');
      expect(result.brandId).toBe('brand-1');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('getCalendarItems', () => {
    it('retorna items ordenados por scheduledDate e order (in-memory sort — DT-04)', async () => {
      const mockDocs = [
        {
          id: 'item-2',
          data: () => ({
            title: 'Item 2',
            scheduledDate: { seconds: 2000, toMillis: () => 2000000 },
            order: 0,
          }),
        },
        {
          id: 'item-1',
          data: () => ({
            title: 'Item 1',
            scheduledDate: { seconds: 1000, toMillis: () => 1000000 },
            order: 0,
          }),
        },
        {
          id: 'item-3',
          data: () => ({
            title: 'Item 3',
            scheduledDate: { seconds: 1000, toMillis: () => 1000000 },
            order: 1,
          }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

      const start = Timestamp.now();
      const end = Timestamp.now();
      const result = await getCalendarItems('brand-1', start, end);

      // Item 1 (seconds=1000, order=0) primeiro
      // Item 3 (seconds=1000, order=1) segundo
      // Item 2 (seconds=2000, order=0) terceiro
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('item-1');
      expect(result[1].id).toBe('item-3');
      expect(result[2].id).toBe('item-2');
    });
  });

  describe('reorderCalendarItems', () => {
    it('usa writeBatch para reorder atomico (DT-05)', async () => {
      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      (writeBatch as jest.Mock).mockReturnValue(mockBatch);

      await reorderCalendarItems('brand-1', [
        { itemId: 'item-1', order: 0 },
        { itemId: 'item-2', order: 1 },
        { itemId: 'item-3', order: 2 },
      ]);

      expect(writeBatch).toHaveBeenCalledTimes(1);
      expect(mockBatch.update).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteCalendarItem', () => {
    it('remove item via deleteDoc', async () => {
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await deleteCalendarItem('brand-1', 'item-123');

      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateCalendarItem', () => {
    it('atualiza item com updatedAt', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateCalendarItem('brand-1', 'item-123', {
        title: 'Titulo atualizado',
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
    });
  });
});
