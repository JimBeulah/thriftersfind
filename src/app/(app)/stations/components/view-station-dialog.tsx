
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar } from "lucide-react";
import type { Station } from "../actions";

interface ViewStationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    station: Station | null;
}

export function ViewStationDialog({ isOpen, onClose, station }: ViewStationDialogProps) {
    if (!station) return null;

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Station Details</DialogTitle>
                    <DialogDescription>
                        View detailed information about this station.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Station Name</div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{station.name}</span>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Location</div>
                        <div className="text-sm">{station.location}</div>
                    </div>
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Type</div>
                        <div>
                            <Badge variant={station.type === "courier" ? "default" : "secondary"}>
                                {station.type.charAt(0).toUpperCase() + station.type.slice(1)}
                            </Badge>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Contact Number</div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{station.contactNumber || "Not provided"}</span>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Status</div>
                        <div>
                            {station.isActive ? (
                                <Badge variant="secondary">Active</Badge>
                            ) : (
                                <Badge variant="outline">Inactive</Badge>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Created</div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(station.createdAt)}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(station.updatedAt)}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
