import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Download,
  ChevronRight,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";

interface WebsiteSource {
  id: string;
  url: string;
  endpoint: string | null;
  pages: number | null;
  created_at: string;
  origin: string | null;
}

const DataSourceWebsite = () => {
  const [websites, setWebsites] = useState<WebsiteSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("scrape");
  const [isAdding, setIsAdding] = useState(false);

  const fetchWebsites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("list_nguon_website")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching websites:", error);
      showError("Không thể tải danh sách website.");
    } else {
      setWebsites(data as WebsiteSource[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleAddWebsite = async () => {
    if (!newUrl) {
      showError("Vui lòng nhập URL.");
      return;
    }
    setIsAdding(true);
    const toastId = showLoading("Đang thêm website...");

    const { error } = await supabase
      .from("list_nguon_website")
      .insert([{ url: newUrl, endpoint: `/${newEndpoint}`, origin: "Manual" }]);

    dismissToast(toastId);
    if (error) {
      showError(`Thêm thất bại: ${error.message}`);
    } else {
      showSuccess("Thêm website thành công!");
      setIsDialogOpen(false);
      setNewUrl("");
      setNewEndpoint("scrape");
      fetchWebsites(); // Refresh the list
    }
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nguồn Website</h1>
        <p className="text-gray-500 mt-1">
          Quản lý danh sách các url website muốn theo dõi để lấy dữ liệu.
        </p>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Tìm kiếm bằng URL" className="pl-10 border-orange-200" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Thêm Website</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
            <DialogHeader>
              <DialogTitle>Thêm nguồn Website mới</DialogTitle>
              <DialogDescription>
                Nhập URL và chọn Endpoint cho website bạn muốn theo dõi.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Select value={newEndpoint} onValueChange={setNewEndpoint}>
                  <SelectTrigger id="endpoint">
                    <SelectValue placeholder="Chọn một endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scrape">/scrape</SelectItem>
                    <SelectItem value="crawl">/crawl</SelectItem>
                    <SelectItem value="map">/map</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button 
                onClick={handleAddWebsite} 
                disabled={isAdding}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              >
                {isAdding ? "Đang thêm..." : "Thêm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-orange-200 rounded-lg bg-white">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : websites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Chưa có website nào. Hãy thêm một website mới.
                </TableCell>
              </TableRow>
            ) : (
              websites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="text-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-sm">
                    {website.url}
                  </TableCell>
                  <TableCell>{website.endpoint || "N/A"}</TableCell>
                  <TableCell>{website.pages}</TableCell>
                  <TableCell>
                    {new Date(website.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{website.origin}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-5 w-5 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-4 text-sm font-medium">
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200" disabled>
          Trước
        </Button>
        <span className="text-gray-800">Trang 1</span>
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200">
          Sau
        </Button>
      </div>
    </div>
  );
};

export default DataSourceWebsite;