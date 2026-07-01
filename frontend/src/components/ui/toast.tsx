import { Toaster as Sonner, toast } from "sonner"

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Sonner
        position="top-right"
        richColors
        closeButton
        theme="dark"
        className="font-sans"
        toastOptions={{
          style: {
            background: '#1f2937',
            border: '1px solid #374151',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

const useToast = () => {
  return {
    toast,
    success: (title: string, description?: string) => 
      toast.success(title, { description }),
    error: (title: string, description?: string) => 
      toast.error(title, { description }),
    info: (title: string, description?: string) => 
      toast.info(title, { description }),
    warning: (title: string, description?: string) => 
      toast.warning(title, { description }),
  }
}

export { ToastProvider, useToast }