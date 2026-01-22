"use client";

import * as React from "react";
import { Upload, Database, FileText, AlertCircle, CheckCircle2, Clock, Download as DownloadIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { getDatabaseOperations, importDatabase } from "../actions";

export default function ImportDatabasePage() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [importMode, setImportMode] = React.useState("replace");
    const [isDragging, setIsDragging] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [recentImports, setRecentImports] = React.useState<any[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const result = await getDatabaseOperations();
        if (result.success && result.data) {
            // Filter for imports
            const imports = result.data.filter((op: any) => op.type === 'IMPORT');
            setRecentImports(imports);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("mode", importMode);

            const result = await importDatabase(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result.success) {
                setTimeout(() => {
                    alert("Database imported successfully!");
                    setIsUploading(false);
                    setSelectedFile(null);
                    setUploadProgress(0);
                    loadHistory();
                }, 500);
            } else {
                alert("Import failed: " + (result.error || "Unknown error"));
                setIsUploading(false);
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error(err);
            alert("An error occurred during import");
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: any) => {
        if (typeof bytes === 'number') {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
        }
        return bytes; // Assume string if from DB
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Import Database</h2>
                    <p className="text-muted-foreground mt-2">
                        Upload and import database files to restore or update your data
                    </p>
                </div>
                <Database className="h-12 w-12 text-muted-foreground" />
            </div>

            {/* Import Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Upload Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload File
                        </CardTitle>
                        <CardDescription>
                            Select a database file to import (SQL, JSON, or CSV)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Drag and Drop Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                                }
              `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".sql,.json,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm font-medium mb-1">
                                {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                SQL, JSON, or CSV files (Max 50MB)
                            </p>
                        </div>

                        {/* Selected File Info */}
                        {selectedFile && (
                            <Alert>
                                <FileText className="h-4 w-4" />
                                <AlertDescription className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Upload Progress */}
                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Uploading...</span>
                                    <span className="font-medium">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Import Options Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Import Options
                        </CardTitle>
                        <CardDescription>
                            Configure how the data should be imported
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Import Mode</Label>
                            <RadioGroup value={importMode} onValueChange={setImportMode}>
                                <div className="flex items-start space-x-3 space-y-0">
                                    <RadioGroupItem value="replace" id="replace" />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="replace" className="font-medium cursor-pointer">
                                            Replace Existing Data
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Delete all existing data and replace with imported data
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 space-y-0">
                                    <RadioGroupItem value="append" id="append" />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="append" className="font-medium cursor-pointer">
                                            Append to Existing Data
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Add imported data to existing records (duplicates may occur)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 space-y-0">
                                    <RadioGroupItem value="merge" id="merge" />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="merge" className="font-medium cursor-pointer">
                                            Merge with Existing Data
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Update existing records and add new ones (recommended)
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        <Alert className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <AlertDescription className="text-orange-800 dark:text-orange-300">
                                <strong>Warning:</strong> Importing data will modify your database.
                                Make sure to backup your current data before proceeding.
                            </AlertDescription>
                        </Alert>

                        <Button
                            onClick={handleImport}
                            disabled={!selectedFile || isUploading}
                            className="w-full"
                            size="lg"
                        >
                            {isUploading ? "Importing..." : "Import Database"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Imports History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Imports
                    </CardTitle>
                    <CardDescription>
                        View your recent database import history
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Import Date</TableHead>
                                <TableHead>Records</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentImports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                        No recent imports found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentImports.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {item.fileName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{item.fileSize}</TableCell>
                                        <TableCell className="text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{(item.details as any)?.recordsImported || '-'}</TableCell>
                                        <TableCell>
                                            {item.status === "SUCCESS" ? (
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Success
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Failed
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
