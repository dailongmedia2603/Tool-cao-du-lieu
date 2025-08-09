import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  ListFilter,
  Calendar as CalendarIcon,
  Download,
  ChevronRight,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Dữ liệu mẫu dựa trên ảnh chụp màn hình
const activityLogs = [
  {
    url: "https://google.com",
    endpoint: "/scrape",
    pages: 1,
    dateAdded: "August 9, 2025 at 06:04:09 AM",
    origin: "API",
  },
  {
    url: "https://batdongsan.com.vn/cho-thue-van-phong-tp-hcm",
    endpoint: "/map",
    pages: 27,
    dateAdded: "August 8, 2025 at 12:22:00 PM",
    origin: "Playground",
  },
  {
    url: "https://batdongsan.com.vn/cho-thue-van-phong-tp-hcm",
    endpoint: "/scrape",
    pages: 1,
    dateAdded: "August 8, 2025 at 12:18:08 PM",
    origin: "Playground",
  },
  {
    url: "https://batdongsan.com.vn/cho-thue-van-phong-tp-hcm",
    endpoint: "/scrape",
    pages: 1,
    dateAdded: "August 8, 2025 at 12:17:01 PM",
    origin: "Playground",
  },
];

const DataSourceWebsite = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2025, 7, 2), // Tháng 8 là tháng thứ 7 trong Date object
    to: new Date(2025, 7, 9),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nguồn Website</h1>
        <p className="text-gray-500 mt-1">
          Xem lại hoạt động các yêu cầu của bạn.
        </p>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Tìm kiếm bằng URL" className="pl-10" />
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <ListFilter className="h-4 w-4" />
                <span>Tất cả Endpoints</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked>
                Tất cả Endpoints
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>/scrape</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>/crawl</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>/map</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd LLL, yyyy")} -{" "}
                      {format(date.to, "dd LLL, yyyy")}
                    </>
                  ) : (
                    format(date.from, "dd LLL, yyyy")
                  )
                ) : (
                  <span>Chọn ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Số trang</TableHead>
              <TableHead>Ngày thêm</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead className="text-right w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityLogs.map((log, index) => (
              <TableRow key={index}>
                <TableCell className="text-center">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </TableCell>
                <TableCell className="font-medium truncate max-w-sm">
                  {log.url}
                </TableCell>
                <TableCell>{log.endpoint}</TableCell>
                <TableCell>{log.pages}</TableCell>
                <TableCell>{log.dateAdded}</TableCell>
                <TableCell>{log.origin}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-5 w-5 text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-4 text-sm font-medium">
        <Button variant="outline" size="sm" className="text-gray-600" disabled>
          Trước
        </Button>
        <span className="text-gray-800">Trang 1</span>
        <Button variant="outline" size="sm" className="text-gray-600">
          Sau
        </Button>
      </div>
    </div>
  );
};

export default DataSourceWebsite;