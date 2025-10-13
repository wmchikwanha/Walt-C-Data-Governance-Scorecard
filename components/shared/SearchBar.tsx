import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="search"
        name="search"
        id="search"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-label={placeholder}
      />
    </div>
  );
};

export default SearchBar;