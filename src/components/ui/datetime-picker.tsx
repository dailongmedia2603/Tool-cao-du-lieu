"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"
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

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newDate = date ? new Date(date) : new Date()
    
    if (name === "hours") {
      newDate.setHours(parseInt(value, 10) || 0)
    }
    if (name === "minutes") {
      newDate.setMinutes(parseInt(value, 10) || 0)
    }
    
    setDate(newDate)
  }

  const hours = date ? String(date.getHours()).padStart(2, '0') : '00'
  const minutes = date ? String(date.getMinutes()).padStart(2, '0') : '00'

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
          {date ? format(date, "dd/MM/yyyy, HH:mm") : <span>Chọn ngày và giờ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-end gap-2">
            <div className="grid gap-1 text-center">
              <Label htmlFor="hours" className="text-xs">
                Giờ
              </Label>
              <Input
                id="hours"
                name="hours"
                type="number"
                className="w-[48px] h-8"
                value={hours}
                onChange={handleTimeChange}
                min="0"
                max="23"
              />
            </div>
            <div className="grid gap-1 text-center">
              <Label htmlFor="minutes" className="text-xs">
                Phút
              </Label>
              <Input
                id="minutes"
                name="minutes"
                type="number"
                className="w-[48px] h-8"
                value={minutes}
                onChange={handleTimeChange}
                min="0"
                max="59"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}