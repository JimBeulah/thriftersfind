
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import UsersTable from "./components/users-table";
import { getUsers } from "./actions";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        setUsers(userData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserAdded = async () => {
    // Refresh the users list after adding a new user
    try {
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Failed to refresh users:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      </div>
      <UsersTable
        users={users}
        onUserAdded={handleUserAdded}
        onUserUpdated={handleUserAdded}
      />
    </div>
  );
}
