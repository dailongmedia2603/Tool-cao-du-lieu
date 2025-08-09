import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelectCombobox, SelectOption } from "@/components/ui/multi-select-combobox";
import { Code, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Index = () => {
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<Date>();
  const [scanFrequency, setScanFrequency] = useState<number>(1);
  const [scanUnit, setScanUnit] = useState("day");
  const [facebookGroups, setFacebookGroups] = useState<SelectOption[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('list_nguon_facebook')
        .select('group_id, group_name');

      if (error) {
        console.error('Error fetching Facebook groups:', error);
      } else if (data) {
        const options = data
          .filter(group => group.group_id && group.group_name)
          .map(group => ({
            value: group.group_id!,
            label: group.group_name!,
          }));
        setFacebookGroups(options);
      }
    };

    fetchGroups();
  }, []);

  const handleCreateCampaign = () => {
    const campaignData = {
      name: campaignName,
      type: 'Facebook',
      groups: selectedGroups,
      endDate: endDate,
      scanFrequency: scanFrequency,
      scanUnit: scanUnit,
    };
    console.log('Creating campaign:', campaignData);
    // Here you would typically send the data to your backend/Supabase
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chiến dịch</h1>
        <p className="text-gray-500 mt-1">Tạo và quản lý các chiến dịch của bạn tại đây.</p>
      </div>

      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="inline-flex items-center justify-center rounded-lg border border-orange-200 p-1 bg-white">
          <TabsTrigger
            value="facebook"
            className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md"
          >
            Facebook
          </TabsTrigger>
          <TabsTrigger
            value="website"
            className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md"
          >
            Website
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md"
          >
            Tất cả
          </TabsTrigger>
        </TabsList>
        <TabsContent value="facebook" className="pt-6">
          <Card className="border-orange-200">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên chiến dịch</label>
                  <Input 
                    placeholder="VD: Quét group đối thủ" 
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại chiến dịch</label>
                  <Input value="Facebook" disabled />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-medium">Chọn Group</label>
                  <MultiSelectCombobox
                    options={facebookGroups}
                    selected={selectedGroups}
                    onChange={setSelectedGroups}
                    placeholder="Chọn một hoặc nhiều group"
                    searchPlaceholder="Tìm kiếm group..."
                    emptyPlaceholder="Không tìm thấy group."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thời gian kết thúc</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Chọn ngày</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tần suất quét</label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      min="1" 
                      value={scanFrequency}
                      onChange={(e) => setScanFrequency(parseInt(e.target.value, 10))}
                      className="w-24"
                    />
                    <Select value={scanUnit} onValueChange={setScanUnit}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">Phút</SelectItem>
                        <SelectItem value="hour">Giờ</SelectItem>
                        <SelectItem value="day">Ngày</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button 
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                  onClick={handleCreateCampaign}
                >
                  Tạo chiến dịch
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="website" className="pt-6">
           <Card className="border-orange-200">
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">URL Website</label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Nhập URL Website" />
                  <Button variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700 space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Get Code</span>
                  </Button>
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">Run</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all" className="pt-6">
           <Card className="border-orange-200">
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Từ khóa</label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Nhập từ khóa bạn muốn theo dõi" />
                  <Button variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700 space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Get Code</span>
                  </Button>
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">Run</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="text-center p-6 bg-gray-50">
        <p className="text-gray-500">Bắt đầu tạo chiến dịch đầu tiên của bạn!</p>
      </Card>
    </div>
  );
};

export default Index;