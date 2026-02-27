'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  COUNTRIES,
  POPULAR_COUNTRY_CODES,
  countryCodeToFlag,
  type Country,
} from '@/lib/constants/countries'

interface CountrySelectProps {
  value: string
  onChange: (code: string) => void
  error?: string
  placeholder?: string
  id?: string
  autoComplete?: string
  className?: string
}

export function CountrySelect({
  value,
  onChange,
  error,
  placeholder = 'Select your country',
  id,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // Build the filtered + grouped list
  const filteredCountries = getFilteredCountries(search)
  const flatItems = buildFlatItems(filteredCountries, search)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Focus the search input when opening
  useEffect(() => {
    if (open) {
      // Small delay so the dropdown renders first
      requestAnimationFrame(() => inputRef.current?.focus())
      setHighlightedIndex(-1)
    }
  }, [open])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-country-item]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const selectCountry = useCallback(
    (code: string) => {
      onChange(code)
      setOpen(false)
      setSearch('')
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const selectableItems = flatItems.filter((item) => item.type === 'country')

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = prev + 1
          return next >= selectableItems.length ? 0 : next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = prev - 1
          return next < 0 ? selectableItems.length - 1 : next
        })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
          selectCountry(selectableItems[highlightedIndex].country!.code)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        setSearch('')
      }
    },
    [flatItems, highlightedIndex, selectCountry]
  )

  const selectedCountry = COUNTRIES.find((c) => c.code === value)

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-11 w-full items-center rounded-full border border-input bg-card px-5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 focus-visible:border-primary',
          error && 'border-destructive focus-visible:ring-destructive/40',
          !selectedCountry && 'text-muted-foreground/60'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selectedCountry ? (
          <span className="flex items-center gap-2.5 truncate">
            <span className="text-base leading-none" aria-hidden="true">
              {countryCodeToFlag(selectedCountry.code)}
            </span>
            <span className="truncate">{selectedCountry.name}</span>
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-white dark:bg-card shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          role="listbox"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search countries..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              aria-label="Search countries"
              autoComplete="off"
            />
          </div>

          {/* Country list */}
          <div ref={listRef} className="max-h-[280px] overflow-y-auto overscroll-contain py-1">
            {flatItems.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No countries found
              </p>
            )}

            {(() => {
              let selectableIndex = -1
              return flatItems.map((item, i) => {
                if (item.type === 'separator') {
                  return (
                    <div key={`sep-${i}`} className="my-1 border-t border-border/40" />
                  )
                }
                if (item.type === 'label') {
                  return (
                    <p
                      key={`label-${i}`}
                      className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                    >
                      {item.label}
                    </p>
                  )
                }
                // type === 'country'
                selectableIndex++
                const country = item.country!
                const isSelected = country.code === value
                const isHighlighted = selectableIndex === highlightedIndex
                return (
                  <button
                    key={`${country.code}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-country-item
                    onClick={() => selectCountry(country.code)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                      isHighlighted && 'bg-accent',
                      isSelected && 'text-primary font-medium',
                      !isHighlighted && !isSelected && 'hover:bg-accent/60'
                    )}
                  >
                    <span className="text-base leading-none shrink-0" aria-hidden="true">
                      {countryCodeToFlag(country.code)}
                    </span>
                    <span className="truncate flex-1">{country.name}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                )
              })
            })()}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Helpers ──

type FlatItem =
  | { type: 'label'; label: string }
  | { type: 'separator' }
  | { type: 'country'; country: Country }

function getFilteredCountries(search: string): {
  popular: Country[]
  rest: Country[]
} {
  const term = search.toLowerCase().trim()
  const popularSet = new Set(POPULAR_COUNTRY_CODES as readonly string[])

  if (!term) {
    return {
      popular: COUNTRIES.filter((c) => popularSet.has(c.code)),
      rest: COUNTRIES.filter((c) => !popularSet.has(c.code)),
    }
  }

  const matches = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase() === term
  )

  return {
    popular: matches.filter((c) => popularSet.has(c.code)),
    rest: matches.filter((c) => !popularSet.has(c.code)),
  }
}

function buildFlatItems(
  groups: { popular: Country[]; rest: Country[] },
  search: string
): FlatItem[] {
  const items: FlatItem[] = []

  if (groups.popular.length > 0) {
    if (!search.trim()) {
      items.push({ type: 'label', label: 'Popular' })
    }
    for (const c of groups.popular) {
      items.push({ type: 'country', country: c })
    }
  }

  if (groups.popular.length > 0 && groups.rest.length > 0) {
    if (!search.trim()) {
      items.push({ type: 'separator' })
      items.push({ type: 'label', label: 'All countries' })
    } else {
      items.push({ type: 'separator' })
    }
  }

  for (const c of groups.rest) {
    items.push({ type: 'country', country: c })
  }

  return items
}
