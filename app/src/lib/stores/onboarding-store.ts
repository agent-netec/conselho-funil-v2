import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStep {
  id: string;
  label: string;
  href: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'create_brand', label: 'Criar sua primeira marca', href: '/brands/new' },
  { id: 'configure_visual', label: 'Configurar identidade visual', href: '/brands' },
  { id: 'consult_council', label: 'Consultar o Conselho', href: '/chat' },
  { id: 'create_funnel', label: 'Criar seu primeiro funil', href: '/funnels/new' },
  { id: 'upload_asset', label: 'Fazer upload de um asset', href: '/assets' },
];

interface OnboardingState {
  showWelcome: boolean;
  completedSteps: string[];
  dismissed: boolean;
  steps: OnboardingStep[];

  dismissWelcome: () => void;
  completeStep: (stepId: string) => void;
  dismiss: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      showWelcome: true,
      completedSteps: [],
      dismissed: false,
      steps: ONBOARDING_STEPS,

      dismissWelcome: () => set({ showWelcome: false }),

      completeStep: (stepId: string) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(stepId)
            ? state.completedSteps
            : [...state.completedSteps, stepId],
        })),

      dismiss: () => set({ dismissed: true }),

      reset: () => set({
        showWelcome: true,
        completedSteps: [],
        dismissed: false,
      }),
    }),
    {
      name: 'onboarding-storage',
      skipHydration: true,
    }
  )
);
