import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import VaultPage from '../page';

// Mock de react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: { language: 'pt-BR' }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }
}));

// Mock de @clerk/nextjs
const mockRedirectToSignIn = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('mock-token');

// Declaramos variáveis mutáveis no escopo externo que podemos redefinir em cada teste
let mockUser: any = null;
let mockIsLoaded = true;

jest.mock('@clerk/nextjs', () => {
  return {
    __esModule: true,
    useUser: () => ({
      isLoaded: mockIsLoaded,
      isSignedIn: !!mockUser,
      user: mockUser,
    }),
    useAuth: () => ({
      isLoaded: true,
      isSignedIn: !!mockUser,
      userId: mockUser ? mockUser.id : null,
      getToken: mockGetToken,
    }),
    useClerk: () => ({
      redirectToSignIn: mockRedirectToSignIn,
    }),
  };
});

// Mock de next/navigation
const mockPush = jest.fn();
const mockGetParam = jest.fn().mockReturnValue(null);
const mockParams = { id: 'capsule-123' };
const stableRouter = {
  push: mockPush,
  prefetch: () => {},
  replace: () => {},
  back: () => {},
};

jest.mock('next/navigation', () => ({
  useRouter: () => stableRouter,
  useParams: () => mockParams,
  useSearchParams: () => ({
    get: mockGetParam,
  }),
}));

// Mock de CinematicCapsule
jest.mock('@/components/ui/CinematicCapsule', () => ({
  CinematicCapsule: ({ title, unlockDate, initialStorageStatus }: any) => (
    <div data-testid="cinematic-capsule-mock">
      <h2>{title}</h2>
      <p>Unlock: {unlockDate}</p>
      <p>Storage: {initialStorageStatus}</p>
    </div>
  ),
}));

describe('Vault Page - Esteira de Testes Críticos (Fase II)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockIsLoaded = true;
    mockGetParam.mockReset();
    mockGetParam.mockReturnValue(null);

    // Mock global fetch
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'capsule-123',
          title: 'Cápsula do Tempo Crítica',
          planType: 'EPOCH_1GB',
          totalSizeBytes: 1024 * 10,
          storageStatus: 'AVAILABLE',
          unlockDate: '2028-12-31T00:00:00',
          recipientEmail: 'recipient@example.com',
          ownerId: 'user_123',
          earlyUnlockRule: 'TOTAL_LOCK'
        }),
      })
    ) as jest.Mock;
  });

  test('Deve redirecionar para a tela de autenticação se o usuário estiver deslogado e não houver accessToken público', async () => {
    mockUser = null; // deslogado
    mockIsLoaded = true;

    render(<VaultPage />);

    // Deve chamar o redirecionamento imperativo do Clerk
    await waitFor(() => {
      expect(mockRedirectToSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          signInForceRedirectUrl: expect.any(String),
          signUpForceRedirectUrl: expect.any(String)
        })
      );
    });
  });

  test('Deve renderizar os dados do cofre corretamente quando o usuário estiver autenticado e logado', async () => {
    mockUser = { id: 'user_123', primaryEmailAddress: { emailAddress: 'owner@example.com' } };
    mockIsLoaded = true;

    render(<VaultPage />);

    // Aguarda o fetch terminar e sumir com o loading
    await waitFor(() => {
      expect(screen.getByTestId('cinematic-capsule-mock')).toBeInTheDocument();
    });

    expect(screen.getByText('Cápsula do Tempo Crítica')).toBeInTheDocument();
    expect(screen.getByText('Unlock: 2028-12-31T00:00:00')).toBeInTheDocument();
    expect(screen.getByText('Storage: AVAILABLE')).toBeInTheDocument();
  });

  test('Deve agendar retentativa automática ao receber erro USER_SYNC_PENDING sem falhar a tela', async () => {
    mockUser = { id: 'user_123', primaryEmailAddress: { emailAddress: 'owner@example.com' } };
    mockIsLoaded = true;

    // Primeiro fetch retorna USER_SYNC_PENDING, o segundo retorna os dados corretos
    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'USER_SYNC_PENDING' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'capsule-123',
          title: 'Cápsula Sincronizada com Sucesso',
          planType: 'EPOCH_1GB',
          totalSizeBytes: 1024 * 10,
          storageStatus: 'AVAILABLE',
          unlockDate: '2028-12-31T00:00:00',
          recipientEmail: 'recipient@example.com',
          ownerId: 'user_123',
          earlyUnlockRule: 'TOTAL_LOCK'
        }),
      });
    }) as jest.Mock;

    render(<VaultPage />);

    // Deve exibir o loader com o aviso de sincronização
    await waitFor(() => {
      expect(screen.getByText(/Sincronizando sua conta do Aevum/)).toBeInTheDocument();
    });

    // Espera 2.2 segundos em tempo real para o setTimeout de 2 segundos disparar e completar a busca
    await new Promise((resolve) => setTimeout(resolve, 2200));

    // Agora deve carregar a cápsula após a retentativa com sucesso
    await waitFor(() => {
      expect(screen.getByText('Cápsula Sincronizada com Sucesso')).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  }, 10000); // aumenta o limite de timeout deste teste específico para 10s se necessário
});
