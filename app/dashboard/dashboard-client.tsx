"use client";

import Link from "next/link";
import { IconPencil, IconSend } from "@tabler/icons-react";
import { appPath } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { documentsRepository, Document, DocumentStatus } from "@/repositories/DocumentsRepository";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
interface SignatureRequest {
  title: string;
  status: DocumentStatus;
  creator: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

const SignatureTable = ({
  title,
  requests,
  isLoading,
}: {
  title: string;
  requests: SignatureRequest[];
  isLoading: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="p-6">
      <h2 className="text-base font-medium mb-6">{title}</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request, index) => (
                <TableRow key={index} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>{request.title}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      request.status === DocumentStatus.COMPLETED ? "bg-green-100 text-green-800" :
                      request.status === DocumentStatus.SIGNED ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell>{request.creator}</TableCell>
                  <TableCell>{request.assignee}</TableCell>
                  <TableCell>{format(new Date(request.createdAt), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{format(new Date(request.updatedAt), "MMM dd, yyyy")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
);

export default function DashboardClient() {
  const { currentWorkspace, currentAccount, accounts, users } = useWorkspace();

  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents', currentWorkspace?._id],
    queryFn: async () => {
      if (!currentWorkspace?._id) return [];
      const response = await documentsRepository.find({
        query: {
          workspaceId: currentWorkspace._id,
          $populate: ['creator_account_id', 'assigned_account_id']
        }
      });
      return response.data;
    },
    enabled: !!currentWorkspace?._id
  });

  // Get documents assigned to current user
  const pendingDocuments = documents?.filter((doc: Document) => 
    doc.status !== DocumentStatus.SIGNED
  ) || [];

  const signedDocuments = documents?.filter((doc: Document) => 
    doc.status === DocumentStatus.SIGNED
  ) || [];

  const getAccountName = (accountId: string) => {
    const account = accounts?.find(acc => acc._id === accountId);
    if (!account) return 'Unknown';
    const user = users?.find(u => u._id === account.userId);
    return user?.name || 'Unknown';
  };

  const transformToSignatureRequest = (doc: Document): SignatureRequest => ({
    title: doc.title,
    status: doc.status,
    creator: getAccountName(doc.creatorAccountId),
    assignee: getAccountName(doc.assignedAccountId || ''),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold mb-6">Overview</h1>

      {/* Main options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sign yourself option */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
              <IconPencil className="w-5 h-5" />
            </div>
            <h2 className="text-base font-medium">Sign yourself</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Use this option to sign the document yourself without adding others
          </p>
        </div> */}

        {/* Request signatures option */}
        {/* <Link
          href={appPath.dashboard.request}
          className="block bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
              <IconSend className="w-5 h-5" />
            </div>
            <h2 className="text-base font-medium">Request signatures</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Use this option to request signatures from others and yourself
            together
          </p>
        </Link> */}
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Need your signature */}
        <div className="bg-gradient-to-r from-[#0A2472] to-[#4A6FA5] text-white rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-full">
              <IconPencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-medium">Pending Documents</h2>
              <p className="text-4xl font-semibold mt-2">{pendingDocuments.length}</p>
            </div>
          </div>
        </div>

        {/* Out for signatures */}
        <div className="bg-gradient-to-r from-[#1B2F45] to-[#4A6FA5] text-white rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-full">
              <IconSend className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-medium">Signed Documents</h2>
              <p className="text-4xl font-semibold mt-2">{signedDocuments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SignatureTable
          title="Pending Documents"
          requests={pendingDocuments.map(transformToSignatureRequest)}
          isLoading={isLoadingDocuments}
        />
        <SignatureTable
          title="Signed Documents"
          requests={signedDocuments.map(transformToSignatureRequest)}
          isLoading={isLoadingDocuments}
        />
      </div>
    </div>
  );
} 