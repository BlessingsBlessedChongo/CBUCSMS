import { Toaster as Sonner, toast } from 'sonner';

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Sonner
        position="top-right"
        richColors
        closeButton
        theme="light"
        className="font-sans"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid #dee2e6',
            color: '#1a5276',
          },
        }}
      />
    </>
  );
};

const useToast = () => {
  return {
    toast,
    success: (title: string, description?: string) => toast.success(title, { description }),
    error: (title: string, description?: string) => toast.error(title, { description }),
    info: (title: string, description?: string) => toast.info(title, { description }),
    warning: (title: string, description?: string) => toast.warning(title, { description }),
  };
};

export { ToastProvider, useToast };
