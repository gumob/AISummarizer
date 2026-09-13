import { ContextMenuService } from '@/features/serviceworker/services/ContextMenuService';

/*
 * Mock @/stores so importing ContextMenuService does not pull in the real
 * zustand persist store (SettingsStore), whose rehydrate calls
 * chrome.storage.local.get() as soon as the module is imported -- before
 * chrome is mocked below in beforeEach.
 */
jest.mock('@/stores', () => ({
  useSettingsStore: { getState: () => ({ getServiceOnMenu: jest.fn(() => Promise.resolve(true)) }) },
}));

describe('ContextMenuService', () => {
  let chromeMock: any;

  beforeEach(() => {
    chromeMock = {
      contextMenus: {
        create: jest.fn(),
        removeAll: jest.fn(),
        onClicked: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      runtime: {},
    };
    /* Firefox exposes runtime.lastError as a getter-only property */
    Object.defineProperty(chromeMock.runtime, 'lastError', {
      get: () => ({ message: 'Cannot create item with duplicate id' }),
      configurable: true,
    });
    (globalThis as any).chrome = chromeMock;
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
  });

  it('does not throw when the create callback checks a getter-only lastError', async () => {
    const service = new ContextMenuService(jest.fn());
    let capturedCallback: (() => void) | undefined;
    chromeMock.contextMenus.create.mockImplementation((_props: unknown, callback: () => void) => {
      capturedCallback = callback;
      return 'menu-id';
    });

    const promise = (service as any)._createContextMenu({ id: 'x', title: 'x', contexts: ['page'] });

    expect(() => capturedCallback?.()).not.toThrow();
    await expect(promise).resolves.toEqual({ result: 'menu-id', error: null });
  });

  it('does not throw when the removeAll callback checks a getter-only lastError', async () => {
    const service = new ContextMenuService(jest.fn());
    let capturedCallback: (() => void) | undefined;
    chromeMock.contextMenus.removeAll.mockImplementation((callback: () => void) => {
      capturedCallback = callback;
    });

    const promise = (service as any)._removeMenu();

    expect(() => capturedCallback?.()).not.toThrow();
    await expect(promise).resolves.toEqual({ result: true, error: null });
  });
});
