import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const FieldContext = createContext<{ errorId: string; hasError: boolean } | null>(null);

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string | null;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <FieldContext.Provider value={{ errorId: `${htmlFor}-error`, hasError: Boolean(error) }}>
      <div className="flex flex-col gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-fg">
          {label}
        </label>
        {children}
        {error && (
          <p id={`${htmlFor}-error`} role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

const CONTROL =
  'min-h-11 w-full rounded-md border bg-surface px-3 text-sm text-fg placeholder:text-subtle disabled:opacity-50';

export function Input({
  className,
  invalid,
  ...rest
}: ComponentProps<'input'> & { invalid?: boolean }) {
  const field = useContext(FieldContext);
  return (
    <input
      aria-invalid={invalid || field?.hasError || undefined}
      aria-describedby={field?.hasError ? field.errorId : undefined}
      className={cn(CONTROL, invalid ? 'border-danger' : 'border-line-strong', className)}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: ComponentProps<'select'>) {
  const field = useContext(FieldContext);
  return (
    <div className="relative">
      <select
        aria-invalid={field?.hasError || undefined}
        aria-describedby={field?.hasError ? field.errorId : undefined}
        className={cn(CONTROL, 'appearance-none border-line-strong pe-10', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
        aria-hidden
      />
    </div>
  );
}
