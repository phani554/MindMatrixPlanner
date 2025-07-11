import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Resource } from '@/types';

interface UserSearchInputProps {
    label: string;
    placeholder: string;
    allUsers: Resource[];
    selectedUser: Resource | undefined;
    onSelectUser: (user: Resource) => void;
    onClear: () => void;
}

export const UserSearchInput: React.FC<UserSearchInputProps> = ({
    label,
    placeholder,
    allUsers,
    selectedUser,
    onSelectUser,
    onClear
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter users for suggestions based on the search term
    const suggestions = useMemo(() => {
        if (!searchTerm) return [];
        return allUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Show top 10 matches
    }, [searchTerm, allUsers]);

    // Handle clicking a suggestion
    const handleSelect = (user: Resource) => {
        onSelectUser(user);
        setSearchTerm('');
        setIsSuggestionsOpen(false);
    };

    // Handle clearing the selection
    const handleClear = () => {
        onClear();
        setSearchTerm('');
    };
    
    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);


    const inputClass = "bg-slate-600 border border-slate-500 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
    const labelClass = "block text-sm font-medium text-slate-300 mb-1";

    return (
        <div className="relative" ref={wrapperRef}>
            <label className={labelClass}>{label}</label>
            <div className={`${inputClass} flex items-center justify-between`}>
                {selectedUser ? (
                    // Display "pill" for the selected user
                    <span className="flex items-center px-2 py-0.5 bg-blue-600 text-blue-100 rounded-full text-sm">
                        {selectedUser.name}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="ml-2 -mr-1 text-blue-200 hover:text-white font-bold"
                            title={`Clear ${label}`}
                        >
                            ×
                        </button>
                    </span>
                ) : (
                    // Display the input field
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSuggestionsOpen(true)}
                        className="bg-transparent w-full outline-none text-slate-200 placeholder-slate-400"
                    />
                )}
            </div>
            {/* Suggestions dropdown */}
            {isSuggestionsOpen && searchTerm && suggestions.length > 0 && (
                <ul className="absolute z-20 w-full bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map(user => (
                        <li
                            key={user.githubId}
                            onClick={() => handleSelect(user)}
                            className="px-3 py-2 text-slate-300 hover:bg-slate-600 cursor-pointer"
                        >
                            {user.name} <span className="text-slate-500">({user.username})</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};