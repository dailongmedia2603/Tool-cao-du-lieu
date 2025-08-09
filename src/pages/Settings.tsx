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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { dismissToast, showError, showLoading, showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-pro");
  const [facebookApiUrl, setFacebookApiUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error fetching settings:", error);
      } else if (data) {
        setGeminiApiKey(data.gemini_api_key || "");
        setGeminiModel(data.gemini_model || "gemini-2.5-pro");
        setFacebookApiUrl(data.facebook_api_url || "http://api.akng.io.vn/graph/");
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading("Saving settings...");

    const { error } = await supabase
      .from("settings")
      .upsert({
        id: 1,
        gemini_api_key: geminiApiKey,
        gemini_model: geminiModel,
        facebook_api_url: facebookApiUrl,
        updated_at: new Date().toISOString(),
      })
      .select();

    dismissToast(toastId);
    if (error) {
      showError(`Error saving settings: ${error.message}`);
    } else {
      showSuccess("Settings saved successfully!");
    }
    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!geminiApiKey) {
      showError("Please enter a Gemini API Key first.");
      return;
    }
    setIsTesting(true);
    const toastId = showLoading("Testing connection...");

    const { data, error } = await supabase.functions.invoke("test-gemini", {
      body: { apiKey: geminiApiKey },
    });

    dismissToast(toastId);
    if (error) {
      showError(`Connection test failed: ${error.message}`);
    } else {
      if (data.success) {
        showSuccess(data.message);
      } else {
        showError(`Connection test failed: ${data.message}`);
      }
    }
    setIsTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your API integrations.</p>
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
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini-model">Model</Label>
                <Select value={geminiModel} onValueChange={setGeminiModel}>
                  <SelectTrigger id="gemini-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-pro">
                      <div>
                        <div className="flex items-center">
                          <span>Gemini 2.5 Pro</span>
                          <Badge variant="outline" className="ml-2 border-blue-500 text-blue-500">NEW</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">gemini-2.5-pro</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini-2.5-flash">
                      <div>
                        <div className="flex items-center">
                          <span>Gemini 2.5 Flash</span>
                          <Badge variant="outline" className="ml-2 border-blue-500 text-blue-500">NEW</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">gemini-2.5-flash</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">
                      <div>
                        <div className="flex items-center">
                          <span>Gemini 2.5 Flash-Lite</span>
                          <Badge variant="outline" className="ml-2 border-blue-500 text-blue-500">NEW</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">gemini-2.5-flash-lite</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || isSaving}
                  variant="secondary"
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isSaving}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
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
                  value={facebookApiUrl}
                  onChange={(e) => setFacebookApiUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;