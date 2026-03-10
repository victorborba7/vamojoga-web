"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { searchUsers } from "@/lib/api";
import { useDebouncedCallback } from "@/lib/hooks";
import { Avatar } from "@/components/ui/avatar";
import type { UserResponse } from "@/types";

interface PlayerAutocompleteProps {
  onSelect: (user: UserResponse) => void;
  excludeIds: string[];
  placeholder?: string;
}

export function PlayerAutocomplete({
  onSelect,
  excludeIds,
  placeholder = "Buscar jogador...",
}: PlayerAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const users = await searchUsers(q.trim());
        const filtered = users.filter((u) => !excludeIds.includes(u.id));
        setResults(filtered);
        setIsOpen(filtered.length > 0);
        setHighlightIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [excludeIds]
  );

  const triggerSearch = useDebouncedCallback(doSearch, 400);

  function handleChange(value: string) {
    setQuery(value);
    triggerSearch(value);
  }

  function handleSelect(user: UserResponse) {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(user);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-primary-500" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg max-h-64 overflow-y-auto">
          {results.map((user, index) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl ${
                index === highlightIndex
                  ? "bg-primary-600/20"
                  : "hover:bg-card-hover"
              }`}
            >
              <Avatar name={user.username} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {user.username}
                </p>
                {user.full_name && (
                  <p className="text-xs text-muted mt-0.5">
                    {user.full_name}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && !loading && query.length >= 1 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg p-4">
          <p className="text-sm text-neutral-400 text-center">
            Nenhum jogador encontrado
          </p>
        </div>
      )}
    </div>
  );
}
