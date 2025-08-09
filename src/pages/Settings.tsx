import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your API integrations.
        </p>
      </div>

      <Tabs defaultValue="api-ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="api-ai"
            className="data-[state=active]:bg-brand-orange-light data-[state=active]:text-brand-orange"
          >
            API AI
          </TabsTrigger>
          <TabsTrigger
            value="api-facebook"
            className="data-[state=active]:bg-brand-orange-light data-[state=active]:text-brand-orange"
          >
            API Facebook
          </TabsTrigger>
        </TabsList>
        <TabsContent value="api-ai">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Gemini API</CardTitle>
              <CardDescription>
                Integrate with Google's Gemini API. Get your key from
                aistudio.google.com.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">API Key</Label>
                <Input
                  id="gemini-api-key"
                  placeholder="Enter your Gemini API Key"
                />
              </div>
              <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api-facebook">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Facebook API</CardTitle>
              <CardDescription>
                Configure the Facebook API integration using the provided
                third-party URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook-api-url">API URL</Label>
                <Input
                  id="facebook-api-url"
                  defaultValue="http://api.akng.io.vn/graph/"
                />
              </div>
              <Button className="bg-gray-800 hover:bg-gray-700 text-white">
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;