import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Auth guard: redireciona para /login quando não autenticado.
 * Retorna { user, loading } para que a página possa renderizar spinner enquanto loading.
 */
export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  return { user, loading };
}

/**
 * Infinite scroll com IntersectionObserver.
 * Incrementa `visibleCount` em `pageSize` quando o sentinel entra em tela.
 */
export function useInfiniteScroll(
  sentinelRef: RefObject<HTMLElement | null>,
  totalCount: number,
  pageSize = 25,
) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => { setVisibleCount(pageSize); }, [totalCount, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisibleCount((v) => v + pageSize); },
      { threshold: 0 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [sentinelRef, visibleCount, totalCount, pageSize]);

  return { visibleCount };
}

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
