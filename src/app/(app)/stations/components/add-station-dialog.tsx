
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createStation } from "../actions";

interface AddStationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddStationDialog({ isOpen, onClose, onSuccess }: AddStationDialogProps) {
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState<"courier" | "pickup">("courier");
    const [contactNumber, setContactNumber] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    const resetForm = () => {
        setName("");
        setLocation("");
        setType("courier");
        setContactNumber("");
        setLatitude("");
        setLongitude("");
        setIsActive(true);
    };

    const handleGeocode = async () => {
        if (!location) {
            toast({
                variant: "destructive",
                title: "Location Required",
                description: "Please enter a location first.",
            });
            return;
        }

        setIsGeocoding(true);
        try {
            // Use OpenStreetMap Nominatim API (Free)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                setLatitude(result.lat);
                setLongitude(result.lon);
                toast({
                    title: "Coordinates Found",
                    description: `Found location: ${result.display_name}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "No Results",
                    description: "Could not find coordinates for this location. Please try a more specific address.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch coordinates. Please try again.",
            });
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSave = async () => {
        if (!name || !location) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all required fields (Name and Location).",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createStation({
                name,
                location,
                type,
                contactNumber: contactNumber || undefined,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                isActive,
            });

            if (result.success) {
                toast({
                    title: "Station Created",
                    description: `Station "${name}" has been created successfully.`,
                });
                resetForm();
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to create station.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Station</DialogTitle>
                    <DialogDescription>
                        Create a new courier or pickup station.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">
                            Station Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Montevista Courier Station"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="location">
                            Location <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Montevista, Davao de Oro"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleGeocode}
                                disabled={isGeocoding || !location}
                                title="Get Coordinates from Location"
                            >
                                {isGeocoding ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : (
                                    <span className="text-lg">📍</span>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Click the pin to auto-fill latitude and longitude.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={type} onValueChange={(value: "courier" | "pickup") => setType(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="courier">Courier</SelectItem>
                                <SelectItem value="pickup">Pickup</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                            id="contactNumber"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            placeholder="e.g. +63 912 345 6789"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="e.g. 7.6667"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="e.g. 126.0833"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="isActive">Active Status</Label>
                        <Switch
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Station"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
