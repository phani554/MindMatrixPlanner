import React, { useState, useMemo, useRef, useEffect } from 'react';

interface MultiSelectSearchInputProps {
    label: string;
    placeholder: string;
    allOptions: string[];
    selectedOptions: string[];
    onSelect: (option: string) => void;
    onRemove: (option: string) => void;
    isLoading?: boolean;
}

export const MultiSelectSearchInput: React.FC<MultiSelectSearchInputProps> = ({
    label,
    placeholder,
    allOptions,
    selectedOptions,
    onSelect,
    onRemove,
    isLoading = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const suggestions = useMemo(() => {
        if (!searchTerm) return [];
        const lowerCaseSearch = searchTerm.toLowerCase();
        // Don't suggest options that are already selected
        const currentSelectionSet = new Set(selectedOptions);
        return allOptions
            .filter(opt => !currentSelectionSet.has(opt) && opt.toLowerCase().includes(lowerCaseSearch))
            .slice(0, 10);
    }, [searchTerm, allOptions, selectedOptions]);

    const handleSelect = (option: string) => {
        onSelect(option);
        setSearchTerm('');
        setIsSuggestionsOpen(false);
    };
    
    // Close suggestions dropdown when clicking outside of the component
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const inputClass = "bg-slate-600 border border-slate-500 text-slate-200 text-sm rounded-lg focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 block w-full p-2.5";
    const labelClass = "block text-sm font-medium text-slate-300 mb-1";

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor={`multi-search-${label}`} className={labelClass}>
                {label}
            </label>
            <div className={`${inputClass} flex flex-wrap gap-2 items-center`}>
                {selectedOptions.map(option => (
                    <span key={option} className="flex items-center px-2 py-0.5 bg-cyan-600 text-cyan-100 rounded-full text-xs">
                        {option}
                        <button
                            type="button"
                            onClick={() => onRemove(option)}
                            className="ml-2 -mr-1 text-cyan-200 hover:text-white font-bold"
                            title={`Remove ${option}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    id={`multi-search-${label}`}
                    type="text"
                    placeholder={isLoading ? "Loading..." : placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSuggestionsOpen(true)}
                    className="bg-transparent flex-grow outline-none text-slate-200 placeholder-slate-400 text-sm"
                    disabled={isLoading}
                />
            </div>
             {isSuggestionsOpen && suggestions.length > 0 && (
                <ul className="absolute z-20 w-full bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map(option => (
                        <li
                            key={option}
                            onClick={() => handleSelect(option)}
                            className="px-3 py-2 text-slate-300 hover:bg-slate-600 cursor-pointer"
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};