import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code } from "lucide-react";

const Index = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Playground</h1>
        <p className="text-gray-500 mt-1">Try out Firecrawl in this visual playground</p>
      </div>

      <Tabs defaultValue="single-url" className="w-full">
        <TabsList>
          <TabsTrigger value="single-url">Single URL <span className="text-gray-400 ml-2">/scrape</span></TabsTrigger>
          <TabsTrigger value="crawl">Crawl <span className="text-gray-400 ml-2">/crawl</span></TabsTrigger>
          <TabsTrigger value="map">Map <span className="text-gray-400 ml-2">/map</span></TabsTrigger>
          <TabsTrigger value="search">
            Search <span className="text-gray-400 ml-2">/search</span>
            <Badge variant="destructive" className="ml-2 bg-brand-orange-light text-brand-orange border border-orange-200">NEW</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="single-url">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <div className="flex items-center space-x-2">
                  <Input defaultValue="https://docs.firecrawl.dev" />
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
      </Tabs>

      <Card className="text-center p-6 bg-gray-50">
        <p className="text-gray-500">Start exploring with our playground!</p>
      </Card>
    </div>
  );
};

export default Index;