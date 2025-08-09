import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code } from "lucide-react";

const Index = () => {
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
              <div>
                <label className="text-sm font-medium mb-2 block">URL Facebook</label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Nhập URL bài viết hoặc group Facebook" />
                  <Button variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700 space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Get Code</span>
                  </Button>
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">Run</Button>
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="text-sm font-medium mb-2 block">Options</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select options" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/2">
                  <label className="text-sm font-medium mb-2 block">Agent</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent1">Agent 1</SelectItem>
                      <SelectItem value="agent2">Agent 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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