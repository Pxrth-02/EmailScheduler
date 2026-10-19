import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

export function AppToaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      toastOptions={{
        className:
          '!bg-surface-container-lowest !text-on-surface !border-outline-variant/50 !shadow-xl !font-body-base !rounded-xl !text-body-sm',
        descriptionClassName: '!text-on-surface-variant font-body-sm',
      }}
    />
  );
}

export const showToast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, {
      description,
      icon: <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>,
    }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, {
      description,
      icon: <span className="material-symbols-outlined text-error text-[18px]">error</span>,
    }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, {
      description,
      icon: <span className="material-symbols-outlined text-secondary text-[18px]">info</span>,
    }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, {
      description,
      icon: <span className="material-symbols-outlined text-tertiary text-[18px]">warning</span>,
    }),
};
