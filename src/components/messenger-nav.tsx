"use client";

import React, { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/lib/types";
import { getUsers } from "@/app/(app)/users/actions";

export function MessengerNav() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const data = await getUsers();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users for messenger", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="h-5 w-5" />
                    <span className="sr-only">Messenger</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel>Messenger</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No users found.
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {users.map((user) => (
                            <DropdownMenuItem key={user.id} className="flex items-center gap-2 p-2 cursor-pointer">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                        alt={user.name}
                                    />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
