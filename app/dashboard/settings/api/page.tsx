"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconCopy, IconRefresh, IconKey, IconEye, IconEyeOff } from "@tabler/icons-react";
import { toast } from "sonner";
import { useWorkspace } from "@/providers/WorkspaceProvider";

// Mock data for API requests
const mockApiRequests = [
  {
    id: 1,
    endpoint: "/api/documents",
    method: "GET",
    status: 200,
    timestamp: "2024-01-15T10:30:00Z",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: 2,
    endpoint: "/api/templates",
    method: "POST",
    status: 201,
    timestamp: "2024-01-15T09:15:00Z",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: 3,
    endpoint: "/api/documents/123/sign",
    method: "PUT",
    status: 400,
    timestamp: "2024-01-14T16:45:00Z",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: 4,
    endpoint: "/api/contacts",
    method: "GET",
    status: 200,
    timestamp: "2024-01-14T14:20:00Z",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: 5,
    endpoint: "/api/workspaces",
    method: "GET",
    status: 200,
    timestamp: "2024-01-14T11:10:00Z",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
];

export default function ApiIntegrationPage() {
  const { generateApiKey, currentWorkspace } = useWorkspace();
  const [apiKey, setApiKey] = useState<string | null>(currentWorkspace?.apiKey || null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRotating, setIsRotating] = useState(false);


  useEffect(() => {
    setApiKey(currentWorkspace?.apiKey || null);
  }, [currentWorkspace]);

  const handlegenerateApiKey = async () => {
    setIsGenerating(true);
    const workspace = await generateApiKey();
    setApiKey(workspace.apiKey);
    setIsGenerating(false);
    toast.success("API key generated successfully");
  };

  const rotateApiKey = async () => {
    setIsRotating(true);
    const workspace = await generateApiKey();
    setApiKey(workspace.apiKey);
    setIsRotating(false);
    toast.success("API key rotated successfully");
  };

  const copyToClipboard = async () => {
    if (apiKey) {
      try {
        await navigator.clipboard.writeText(apiKey);
        toast.success("API key copied to clipboard");
      } catch (err) {
        toast.error("Failed to copy API key");
      }
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800";
    if (status >= 500) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-blue-100 text-blue-800";
      case "POST": return "bg-green-100 text-green-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">API Integration</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your API keys and monitor API usage
          </p>
        </div>
      </div>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconKey className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>
            Generate and manage your API keys for accessing the Kingsign API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current API Key:</span>
                <Badge variant="secondary">Live</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md font-mono text-sm">
                  {showApiKey ? apiKey : "•".repeat(apiKey.length)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <IconCopy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={rotateApiKey}
                  disabled={isRotating}
                  variant="outline"
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  {isRotating ? "Rotating..." : "Rotate API Key"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No API key generated yet. Generate your first API key to start using the Kingsign API.
              </p>
              <Button
                onClick={handlegenerateApiKey}
                disabled={isGenerating}
              >
                <IconKey className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate API Key"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Usage */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage History</CardTitle>
          <CardDescription>
            Recent API requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApiRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">
                    {request.endpoint}
                  </TableCell>
                  <TableCell>
                    <Badge className={getMethodColor(request.method)}>
                      {request.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(request.timestamp)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.ip}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 