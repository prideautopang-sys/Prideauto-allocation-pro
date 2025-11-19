import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ label, options, selectedOptions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (option: string) => {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter(item => item !== option));
    } else {
      onChange([...selectedOptions, option]);
    }
  };

  const buttonText = selectedOptions.length > 0 
    ? `${selectedOptions.length} selected`
    : 'All';

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 block w-full text-left py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-900 dark:text-white"
      >
        <span className="flex justify-between items-center">
          <span>{buttonText}</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
          <ul className="py-1">
            {options.map(option => (
              <li key={option}>
                 <label className="flex items-center space-x-3 w-full cursor-pointer px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleSelect(option)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500 bg-gray-100 dark:bg-gray-900 dark:ring-offset-gray-800"
                  />
                  <span>{option}</span>
                </label>
              </li>
            ))}
             {options.length === 0 && (
                <li className="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">No options</li>
             )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
