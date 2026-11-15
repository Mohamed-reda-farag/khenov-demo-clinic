import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { ConfirmProvider } from '@/components/ui/confirm';
import { TooltipProvider } from '@/components/ui/Tooltip';

export function App() {
  return (
    <TooltipProvider>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
    </TooltipProvider>
  );
}
