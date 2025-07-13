'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Seçiniz",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  icon,
  disabled = false
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200); // Updated animation duration to match CSS
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    handleClose();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen && !isClosing) {
          handleClose();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            handleClose();
          } else {
            setIsOpen(true);
          }
        }}
        disabled={disabled}
        className={`btn btn-ghost flex items-center gap-2 focus:!bg-transparent focus-visible:!bg-transparent ${buttonClassName} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {icon && icon}
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-250 ease-out ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className={`dropdown-menu left-0 ${isClosing ? 'closing' : ''} ${menuClassName}`}>
          <div className="p-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                className={`dropdown-item w-full text-left text-dark-950 dark:text-light-50 ${
                  value === option.value ? 'bg-light-200 dark:bg-dark-700' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.icon && option.icon}
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}