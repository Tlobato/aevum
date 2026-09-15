import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../page';

// Mock de react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal?: string) => defaultVal || key,
    i18n: { language: 'pt-BR' }
  }),
}));

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  Show: ({ when, children }: { when: string; children: React.ReactNode }) => {
    // Simula estado signed-out por padrão
    if (when === 'signed-out') return <>{children}</>;
    return null;
  },
  SignInButton: ({ children }: { children: React.ReactNode }) => <div data-testid="signin-btn">{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div data-testid="signup-btn">{children}</div>,
  UserButton: () => <div data-testid="user-btn">UserButton</div>,
}));

// Mock de next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock de useSound
jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

// Mock de PostHogProvider
jest.mock('@/providers/PostHogProvider', () => ({
  trackEvent: jest.fn(),
}));

// Mock de LanguageSwitcher e SoundToggle
jest.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">LanguageSwitcher</div>,
}));
jest.mock('@/components/ui/SoundToggle', () => ({
  SoundToggle: () => <div data-testid="sound-toggle">SoundToggle</div>,
}));

describe('Landing Page (Home)', () => {
  it('renders hero title and brand correctly', () => {
    render(<Home />);
    expect(screen.getAllByText('Aevum').length).toBeGreaterThan(0);
    expect(screen.getByText('landing.heroTitle1')).toBeInTheDocument();
  });

  it('renders 3 steps and use cases sections', () => {
    render(<Home />);
    expect(screen.getByText('landing.step1Title')).toBeInTheDocument();
    expect(screen.getByText('landing.step2Title')).toBeInTheDocument();
    expect(screen.getByText('landing.step3Title')).toBeInTheDocument();
  });

  it('toggles FAQ item on click', () => {
    render(<Home />);
    const faqButton = screen.getByText('landing.faqQ1');
    expect(faqButton).toBeInTheDocument();
    
    // Antes de clicar, a resposta não está visível
    expect(screen.queryByText('landing.faqA1')).not.toBeInTheDocument();
    
    // Clica na pergunta
    fireEvent.click(faqButton);
    
    // Após o clique, a resposta aparece
    expect(screen.getByText('landing.faqA1')).toBeInTheDocument();
  });
});
