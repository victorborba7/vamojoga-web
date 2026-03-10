import { useEffect, useRef, useState } from "react";

/**
 * Retorna o valor atualizado somente após `delay` ms sem novas mudanças.
 * Evita disparar chamadas ao backend a cada tecla digitada.
 *
 * @example
 * const debouncedQuery = useDebounce(query, 400);
 * useEffect(() => { if (debouncedQuery) search(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Retorna uma versão debounced de uma função callback.
 * Útil quando o handler recebe o valor diretamente (ex: onChange).
 *
 * @example
 * const handleChange = useDebouncedCallback((v: string) => search(v), 400);
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delay = 400,
): (...args: Parameters<T>) => void {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  };
}
