
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import CustomerTable from "./components/customer-table";
import { getCustomers } from "./actions";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customerData = await getCustomers();
        setCustomers(customerData);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerAdded = async () => {
    // Refresh the customers list after adding a new customer
    try {
      const updatedCustomers = await getCustomers();
      setCustomers(updatedCustomers);
    } catch (error) {
      console.error("Failed to refresh customers:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Customers</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
      </div>
      <CustomerTable
        customers={customers}
        onCustomerAdded={handleCustomerAdded}
      />
    </div>
  );
}
