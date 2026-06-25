import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../page';

// Mock de react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt-BR' }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }
}));

// Mock de @clerk/nextjs
const stableUser = {
  id: 'user_123',
  primaryEmailAddress: { emailAddress: 'thyagollobato@gmail.com' },
};
const mockGetToken = jest.fn().mockResolvedValue('mock-token');
jest.mock('@clerk/nextjs', () => {
  return {
    __esModule: true,
    useUser: () => ({
      isLoaded: true,
      isSignedIn: true,
      user: stableUser,
    }),
    useAuth: () => ({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_123',
      getToken: mockGetToken,
    }),
    useClerk: () => ({
      redirectToSignIn: jest.fn(),
    }),
    useReverification: (fn: any) => fn,
    UserButton: () => React.createElement('div', { 'data-testid': 'user-button-mock' }, 'UserButton'),
  };
});

// Mock de next/navigation
const mockPush = jest.fn();
const stableRouter = {
  push: mockPush,
  prefetch: () => {},
  replace: () => {},
  back: () => {},
};
jest.mock('next/navigation', () => ({
  useRouter: () => stableRouter,
}));

// Mocks de componentes do projeto para garantir isolamento e velocidade
jest.mock('@/components/ui/ThemePicker', () => ({
  ThemePicker: () => <div data-testid="theme-picker-mock">ThemePicker</div>,
}));

jest.mock('@/components/ui/ConfirmationModal', () => ({
  ConfirmationModal: ({ isOpen, onConfirm, onCancel }: any) => isOpen ? (
    <div data-testid="confirmation-modal-mock">
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ) : null,
}));

jest.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher-mock">LanguageSwitcher</div>,
}));

// Mock de framer-motion para evitar erros de renderização no JSDOM
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    img: ({ ...props }: any) => <img {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Dashboard Component - Esteira de Testes Críticos', () => {
  const mockCapsules = [
    // Cápsula 1: Rascunho pessoal (dono = user_123)
    {
      id: 'cap-pessoal-1',
      title: 'Minha Capsula Pessoal',
      status: 'DRAFT',
      planType: 'EPOCH_1GB',
      totalSizeBytes: 1024 * 100,
      unlockDate: '2027-12-31T00:00:00',
      recipientEmail: 'thyagollobato@gmail.com',
      isGift: false,
      ownerId: 'user_123',
      ownerEmail: 'thyagollobato@gmail.com',
      targetTimezone: 'America/Sao_Paulo',
      storageStatus: 'DRAFT'
    },
    // Cápsula 2: Presente recebido (dono = user_other)
    {
      id: 'cap-presente-recebido',
      title: 'Presente de Amigo',
      status: 'SEALED',
      planType: 'EPOCH_1GB',
      totalSizeBytes: 1024 * 500,
      unlockDate: '2028-01-01T00:00:00',
      recipientEmail: 'thyagollobato@gmail.com',
      isGift: true,
      ownerId: 'user_other',
      ownerEmail: 'other@example.com',
      targetTimezone: 'America/Sao_Paulo',
      storageStatus: 'FROZEN'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configura o fuso horário global para ser determinístico nos testes
    Object.defineProperty(global.Intl, 'DateTimeFormat', {
      value: jest.fn().mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: 'America/Sao_Paulo' }),
      })),
      writable: true,
    });

    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url.endsWith('/api/v1/capsules')) {
        if (options && options.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'new-capsule-id' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCapsules),
        });
      }
      if (url.includes('/estimate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ priceInCents: 9900 }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as jest.Mock;
  });

  test('Deve ocultar os botões de editar e excluir se a cápsula for um presente recebido', async () => {
    render(<Dashboard />);

    // Espera os dados carregarem
    await waitFor(() => {
      expect(screen.getByText('Minha Capsula Pessoal')).toBeInTheDocument();
    });

    expect(screen.getByText('Presente de Amigo')).toBeInTheDocument();

    // Minha Capsula Pessoal é DRAFT e o dono é user_123, então os botões de editar e excluir devem estar visíveis
    expect(screen.getByTitle('dashboard.actions.edit')).toBeInTheDocument();
    expect(screen.getByTitle('dashboard.actions.delete')).toBeInTheDocument();

    // Presente de Amigo é um presente recebido. Não deve ter os botões adicionados no DOM
    const editButtons = screen.queryAllByTitle('dashboard.actions.edit');
    expect(editButtons.length).toBe(1); // Somente o da cápsula pessoal

    const deleteButtons = screen.queryAllByTitle('dashboard.actions.delete');
    expect(deleteButtons.length).toBe(1); // Somente o da cápsula pessoal
  });

  test('Deve capturar o fuso horário correto do ambiente e enviá-lo no payload do POST ao criar cápsula', async () => {
    render(<Dashboard />);

    // Clica no botão de abrir formulário (o findByText já espera o loading passar e o botão aparecer)
    const openFormButton = await screen.findByText('dashboard.tabForgeNew');
    fireEvent.click(openFormButton);

    // Preenche o formulário aguardando o input ser renderizado assincronamente no modal
    const titleInput = await screen.findByPlaceholderText('forge.fieldTitlePlaceholder');
    fireEvent.change(titleInput, { target: { value: 'Nova Cápsula de Teste' } });

    // Configura uma data no futuro válida (> 48h, ex: D+5)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateString = futureDate.toISOString().split('T')[0];

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: dateString } });
    }

    // Submete o formulário
    const submitButton = screen.getByText('forge.buttonForge');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Verifica se o fetch foi chamado para salvar a nova cápsula
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/capsules'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"targetTimezone":"America/Sao_Paulo"')
        })
      );
    });
  });

  test('Validador do Formulário deve disparar erro e bloquear envio se a data violar a trava de 48h', async () => {
    render(<Dashboard />);

    // Clica no botão de abrir formulário (o findByText já espera o loading passar e o botão aparecer)
    const openFormButton = await screen.findByText('dashboard.tabForgeNew');
    fireEvent.click(openFormButton);

    // Preenche o título aguardando o input ser renderizado assincronamente no modal
    const titleInput = await screen.findByPlaceholderText('forge.fieldTitlePlaceholder');
    fireEvent.change(titleInput, { target: { value: 'Cápsula Inválida' } });

    // Configura uma data com menos de 48 horas no futuro (ex: amanhã / D+1)
    const invalidDate = new Date();
    invalidDate.setDate(invalidDate.getDate() + 1);
    const dateString = invalidDate.toISOString().split('T')[0];

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: dateString } });
    }

    // Submete o formulário
    const submitButton = screen.getByText('forge.buttonForge');
    fireEvent.click(submitButton);

    // Verifica que o envio foi bloqueado (fetch do POST de criação nunca foi chamado)
    const creationPostCalls = (global.fetch as jest.Mock).mock.calls.filter(call => {
      const url = call[0];
      const options = call[1];
      return url.endsWith('/api/v1/capsules') && options?.method === 'POST';
    });
    expect(creationPostCalls.length).toBe(0);

    // E a mensagem de erro deve ser exibida na tela
    expect(screen.getByText('forge.validation.dateMin48h')).toBeInTheDocument();
  });
});
