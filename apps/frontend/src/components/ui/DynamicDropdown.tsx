import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon, SearchIcon, XIcon } from './Icons';

export interface DropdownItem {
    label: string;
    value: string;
}

export interface DynamicDropdownProps {
    items?: DropdownItem[];
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    asyncFetch?: (query: string) => Promise<DropdownItem[]>;
    initialValue?: string;
    className?: string;
}

type DropdownMode = 'small' | 'medium' | 'large';

export const DynamicDropdown: React.FC<DynamicDropdownProps> = ({
    items = [],
    onChange,
    placeholder = 'Select an option',
    label,
    asyncFetch,
    initialValue,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);
    const [asyncItems, setAsyncItems] = useState<DropdownItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Determine mode
    const mode: DropdownMode = useMemo(() => {
        if (asyncFetch) return 'large';
        if (items.length > 50) return 'large';
        if (items.length > 15) return 'medium';
        return 'small';
    }, [items.length, asyncFetch]);

    // Initialize selected item
    useEffect(() => {
        if (initialValue) {
            const allItems = asyncFetch ? asyncItems : items;
            const found = allItems.find((i) => i.value === initialValue);
            if (found) setSelectedItem(found);
        }
    }, [initialValue, items, asyncItems, asyncFetch]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Async fetch debounce
    useEffect(() => {
        if (asyncFetch && isOpen) {
            const timer = setTimeout(async () => {
                setIsLoading(true);
                try {
                    const results = await asyncFetch(searchTerm);
                    setAsyncItems(results);
                } catch (error) {
                    console.error('Failed to fetch items', error);
                } finally {
                    setIsLoading(false);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, asyncFetch, isOpen]);

    // Filter items for synchronous modes
    const filteredItems = useMemo(() => {
        if (asyncFetch) return asyncItems;
        if (!searchTerm) return items;
        return items.filter((item) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, asyncItems, searchTerm, asyncFetch]);

    // Reset focused index when items change or dropdown opens
    useEffect(() => {
        setFocusedIndex(-1);
    }, [filteredItems, isOpen]);

    // Scroll focused item into view
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && listRef.current) {
            const list = listRef.current;
            const element = list.children[focusedIndex] as HTMLElement;
            if (element) {
                const listTop = list.scrollTop;
                const listBottom = listTop + list.clientHeight;
                const elementTop = element.offsetTop;
                const elementBottom = elementTop + element.clientHeight;

                if (elementTop < listTop) {
                    list.scrollTop = elementTop;
                } else if (elementBottom > listBottom) {
                    list.scrollTop = elementBottom - list.clientHeight;
                }
            }
        }
    }, [focusedIndex, isOpen]);

    const handleSelect = (item: DropdownItem) => {
        setSelectedItem(item);
        onChange(item.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen && (mode === 'medium' || mode === 'large')) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItem(null);
        onChange('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < filteredItems.length) {
                    handleSelect(filteredItems[focusedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div
            className={`relative w-full ${className}`}
            ref={dropdownRef}
            onKeyDown={handleKeyDown}
        >
            {label && (
                <label className="block text-sm font-medium text-[var(--color-slate)] mb-1.5">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={toggleDropdown}
                className={`
          w-full flex items-center justify-between px-4 py-2.5 
          bg-white border rounded-[var(--radius-md)] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]
          ${isOpen
                        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                        : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-medium)]'
                    }
        `}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`block truncate ${!selectedItem ? 'text-neutral-400' : 'text-[var(--color-gunmetal)]'}`}>
                    {selectedItem ? selectedItem.label : placeholder}
                </span>
                <div className="flex items-center gap-2">
                    {selectedItem && (
                        <div
                            role="button"
                            onClick={clearSelection}
                            className="p-0.5 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-[var(--color-error)] transition-colors"
                        >
                            <XIcon className="w-4 h-4" />
                        </div>
                    )}
                    <ChevronDownIcon
                        className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in">

                    {/* Search Bar (Medium & Large) */}
                    {(mode === 'medium' || mode === 'large') && (
                        <div className="p-2 border-b border-[var(--color-border-subtle)] bg-neutral-50/50">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] bg-white placeholder:text-neutral-400"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        // Allow navigation keys to bubble up to container
                                        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
                                            e.preventDefault();
                                            handleKeyDown(e);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* List Items */}
                    <ul
                        ref={listRef}
                        className="max-h-60 overflow-auto py-1 scrollbar-hide focus:outline-none"
                        role="listbox"
                        tabIndex={-1}
                    >
                        {isLoading ? (
                            <li className="px-4 py-8 text-center text-sm text-neutral-400">
                                Loading...
                            </li>
                        ) : filteredItems.length === 0 ? (
                            <li className="px-4 py-8 text-center text-sm text-neutral-400">
                                No results found
                            </li>
                        ) : (
                            filteredItems.map((item, index) => (
                                <li
                                    key={item.value}
                                    role="option"
                                    aria-selected={selectedItem?.value === item.value}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setFocusedIndex(index)}
                                    className={`
                    relative flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${focusedIndex === index ? 'bg-neutral-50' : ''}
                    ${selectedItem?.value === item.value
                                            ? 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-medium'
                                            : 'text-[var(--color-gunmetal)]'
                                        }
                  `}
                                >
                                    <span className="block truncate">{item.label}</span>
                                    {selectedItem?.value === item.value && (
                                        <CheckIcon className="w-4 h-4 text-[var(--color-primary)]" />
                                    )}
                                </li>
                            ))
                        )}
                    </ul>

                    {/* Footer for Large/Async lists (optional info) */}
                    {mode === 'large' && !isLoading && filteredItems.length > 0 && (
                        <div className="px-3 py-2 text-xs text-center text-neutral-400 border-t border-[var(--color-border-subtle)] bg-neutral-50">
                            Showing {filteredItems.length} results
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
