import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  end_date: string | null;
  created_at: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
}

const CampaignList = ({
  campaigns,
  loading,
  onStatusChange,
  onDelete,
}: CampaignListProps) => {
  if (loading) {
    return (
      <div className="text-center p-8 mt-6">
        Đang tải danh sách chiến dịch...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="text-center p-6 bg-gray-50 mt-6">
        <p className="text-gray-500">Chưa có chiến dịch nào trong mục này.</p>
      </Card>
    );
  }

  return (
    <div className="border border-orange-200 rounded-lg bg-white mt-6">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead>Tên chiến dịch</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày kết thúc</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>{campaign.type}</TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "text-white capitalize",
                    campaign.status === "active"
                      ? "bg-green-500"
                      : "bg-gray-500"
                  )}
                >
                  {campaign.status === "active" ? "Đang chạy" : "Tạm dừng"}
                </Badge>
              </TableCell>
              <TableCell>
                {campaign.end_date
                  ? format(new Date(campaign.end_date), "dd/MM/yyyy")
                  : "Không có"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Mở menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {campaign.status === "active" ? (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(campaign.id, "paused")}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        <span>Tạm dừng</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(campaign.id, "active")}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        <span>Tiếp tục</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Sửa</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete(campaign.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Xóa</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CampaignList;