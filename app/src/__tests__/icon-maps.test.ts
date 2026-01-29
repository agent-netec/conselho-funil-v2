import { NAV_ITEMS } from '../lib/constants';
import { SIDEBAR_ICONS } from '../lib/icon-maps';

describe('Sidebar icon map', () => {
  NAV_ITEMS.forEach((item) => {
    test(`NAV_ITEMS has icon for "${item.id}"`, () => {
      expect(SIDEBAR_ICONS[item.icon]).toBeDefined();
    });
  });
});
