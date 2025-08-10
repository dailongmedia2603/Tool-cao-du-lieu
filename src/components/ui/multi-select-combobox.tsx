"use client";

import * as React from "react";
import { Check, X, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectComboboxProps {
  options: SelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
}

export function MultiSelectCombobox({
  options,
  selected,
  onChange,
  className,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  emptyPlaceholder = "Không tìm thấy.",
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    onChange(selected.filter((i) => i !== item));
  };

  const selectedOptions = options.filter((option) =>
    selected.includes(option.value)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-10 font-normal",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  variant="secondary"
                  key={option.value}
                  className="bg-brand-orange-light text-brand-orange border border-orange-200 hover:bg-orange-200"
                  onClick={(e) => handleUnselect(e, option.value)}
                >
                  <span className="truncate max-w-[180px]" title={option.label}>
                    {option.label}
                  </span>
                  <X className="ml-1 h-3 w-3 cursor-pointer shrink-0" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value]
                    );
                    setOpen(true);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}