import React, { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, UserPlus, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact } from "@/repositories/ContactsRepository";

interface ContactAssignmentProps {
  contacts: Contact[];
  assignedContactId: string | null;
  onAssignContact: (contactId: string | null) => void;
  onCreateContact?: () => void;
  disabled?: boolean;
  fieldName?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getContactStatusColor = (contactId: string | null): string => {
  if (!contactId) return "text-gray-500";
  return "text-green-600";
};

export function ContactAssignment({
  contacts,
  assignedContactId,
  onAssignContact,
  onCreateContact,
  disabled = false,
  fieldName,
}: ContactAssignmentProps) {
  const [open, setOpen] = useState(false);
  
  const assignedContact = contacts?.find(
    contact => contact._id?.toString() === assignedContactId
  );

  return (
    <div className="space-y-2">
      {/* Field Label */}
      {fieldName && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">Assignment</span>
          <Badge
            variant={assignedContact ? "default" : "secondary"}
            className={cn(
              "text-xs px-2 py-0.5",
              assignedContact 
                ? "bg-green-100 text-green-700 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"
            )}
          >
            {assignedContact ? "Assigned" : "Unassigned"}
          </Badge>
        </div>
      )}

      {/* Assignment Display */}
      {assignedContact && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">
            {getInitials(assignedContact.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-green-800 truncate">
              {assignedContact.name}
            </p>
            <p className="text-xs text-green-600 truncate">
              {assignedContact.email}
            </p>
          </div>
        </div>
      )}

      {/* Contact Selection Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-xs h-8",
              !assignedContact && "text-gray-500"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              {assignedContact 
                ? `Change Assignment` 
                : "Assign Contact"
              }
            </div>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search contacts..." 
              className="h-9 text-xs"
            />
            <CommandList>
              <CommandEmpty className="py-4 text-xs text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <User className="h-6 w-6 text-gray-400" />
                  <p>No contacts found</p>
                  {onCreateContact && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onCreateContact();
                        setOpen(false);
                      }}
                      className="text-xs"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add New Contact
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              
              <CommandGroup>
                {/* Unassign Option */}
                <CommandItem
                  value="unassign"
                  onSelect={() => {
                    onAssignContact(null);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">×</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-600 font-medium">No Assignment</span>
                    </div>
                    {!assignedContact && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </CommandItem>

                {/* Contact Options */}
                {contacts?.map((contact) => (
                  <CommandItem
                    key={contact._id?.toString()}
                    value={`${contact.name} ${contact.email}`}
                    onSelect={() => {
                      onAssignContact(contact._id?.toString() || null);
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                        {getInitials(contact.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-gray-500 truncate flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" />
                          {contact.email}
                        </p>
                      </div>
                      {assignedContactId === contact._id?.toString() && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Add New Contact Option */}
              {onCreateContact && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onCreateContact();
                      setOpen(false);
                    }}
                    className="text-xs border-t"
                  >
                    <div className="flex items-center gap-2 w-full text-blue-600">
                      <UserPlus className="h-4 w-4" />
                      <span className="font-medium">Add New Contact</span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 