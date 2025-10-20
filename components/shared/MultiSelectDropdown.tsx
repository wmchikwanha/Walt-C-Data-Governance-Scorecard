import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selected, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleToggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(item => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    );

    const getButtonLabel = () => {
        if (selected.length === 0) {
            return placeholder;
        }
        if (selected.length <= 2) {
            const selectedLabels = options.filter(o => selected.includes(o.value)).map(o => o.label);
            return selectedLabels.join(', ');
        }
        return `${selected.length} departments selected`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-white text-left flex justify-between items-center"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">{getButtonLabel()}</span>
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm animate-fadeIn">
                    <div className="p-2 border-b">
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <ul role="listbox" className="py-1">
                        {filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                onClick={() => handleToggleOption(option.value)}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-slate-100"
                                role="option"
                                aria-selected={selected.includes(option.value)}
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(option.value)}
                                        readOnly
                                        tabIndex={-1}
                                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer"
                                    />
                                    <span className={`ml-3 block truncate ${selected.includes(option.value) ? 'font-semibold' : 'font-normal'}`}>
                                        {option.label}
                                    </span>
                                </div>
                            </li>
                        ))}
                        {filteredOptions.length === 0 && (
                            <li className="text-center text-gray-500 py-2 px-3 text-sm">No departments found.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;