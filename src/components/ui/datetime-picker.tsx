"use client"

import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "./label"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const handleDateSelect = (selectedDay: Date | undefined) => {
    if (!selectedDay) {
      setDate(undefined)
      return
    }
    // Preserve the time if a date is already set
    const newDate = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      date?.getHours() ?? 0,
      date?.getMinutes() ?? 0
    )
    setDate(newDate)
  }

  const handleTimeChange = (part: "hours" | "minutes", value: string) => {
    const newDate = date ? new Date(date) : new Date()
    const numericValue = parseInt(value, 10)
    
    if (part === "hours") {
      newDate.setHours(numericValue)
    }
    if (part === "minutes") {
      newDate.setMinutes(numericValue)
    }
    
    setDate(newDate)
  }

  const hours = date ? date.getHours() : 0
  const minutes = date ? date.getMinutes() : 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy HH:mm") : <span>Chọn ngày và giờ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          locale={vi}
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-end gap-2">
            <div className="grid flex-1 gap-1">
              <Label className="text-xs">
                Giờ
              </Label>
              <Select
                value={String(hours)}
                onValueChange={(value) => handleTimeChange("hours", value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {String(i).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid flex-1 gap-1">
              <Label className="text-xs">
                Phút
              </Label>
              <Select
                value={String(minutes)}
                onValueChange={(value) => handleTimeChange("minutes", value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }).map((_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {String(i).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}