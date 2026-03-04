"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { searchGames } from "@/lib/api";
import type { GameResponse } from "@/types";

interface GameAutocompleteProps {
  onSelect: (game: GameResponse) => void;
  selectedGame: GameResponse | null;
  onClear: () => void;
}

export function GameAutocomplete({
  onSelect,
  selectedGame,
  onClear,
}: GameAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const games = await searchGames(q.trim());
      setResults(games);
      setIsOpen(games.length > 0);
      setHighlightIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  }

  function handleSelect(game: GameResponse) {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(game);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onClear();
    inputRef.current?.focus();
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

  // Show selected game card
  if (selectedGame) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary-500 bg-primary-600/10 p-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {selectedGame.name}
          </p>
          {selectedGame.description && (
            <p className="text-xs text-muted mt-0.5">
              {selectedGame.description}
            </p>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            {selectedGame.min_players}-{selectedGame.max_players} jogadores
          </p>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 rounded-lg hover:bg-neutral-700 transition-colors text-neutral-400 hover:text-white cursor-pointer"
          aria-label="Trocar jogo"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

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
          placeholder="Digite o nome do jogo..."
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
          {results.map((game, index) => (
            <button
              key={game.id}
              onClick={() => handleSelect(game)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl ${
                index === highlightIndex
                  ? "bg-primary-600/20"
                  : "hover:bg-card-hover"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {game.name}
                </p>
                {game.description && (
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">
                    {game.description}
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-0.5">
                  {game.min_players}-{game.max_players} jogadores
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && !loading && query.length >= 1 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg p-4">
          <p className="text-sm text-neutral-400 text-center">
            Nenhum jogo encontrado
          </p>
        </div>
      )}
    </div>
  );
}
