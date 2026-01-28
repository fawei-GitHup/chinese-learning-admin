"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  ImageIcon,
  FileAudio,
  FileText,
  MoreHorizontal,
  Trash2,
  Copy,
  Link2,
  Tag,
  X,
  Check,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAssets, saveAsset, deleteAsset, generateId } from "@/lib/mock/storage";
import type { Asset } from "@/lib/mock/data";
import { useAuth, canEdit, canDelete } from "@/lib/auth-context";
import { toast } from "sonner";
import { useAdminLocale } from "@/lib/admin-locale";

type AssetUsage = "Lesson" | "Reading" | "Medical" | "Other";

interface ExtendedAsset extends Asset {
  usage?: AssetUsage;
  lastUsedIn?: string;
  dimensions?: string;
  format?: string;
}

const mockAssetExtras: Record<string, Partial<ExtendedAsset>> = {
  a1: { usage: "Lesson", lastUsedIn: "Basic Greetings in Chinese", dimensions: "1200x630", format: "JPEG" },
  a2: { usage: "Lesson", lastUsedIn: "Basic Greetings in Chinese", format: "MP3" },
  a3: { usage: "Reading", lastUsedIn: "Dragon Boat Festival", format: "MP3" },
  a4: { usage: "Medical", lastUsedIn: "Hospital Registration", format: "PDF" },
  a5: { usage: "Reading", lastUsedIn: "A Day in Beijing", dimensions: "1920x1080", format: "JPEG" },
};

export default function AssetsPage() {
  const { user } = useAuth();
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  const [assets, setAssets] = useState<ExtendedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ExtendedAsset | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<ExtendedAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUsage, setFilterUsage] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload form state
  const [newAsset, setNewAsset] = useState({
    name: "",
    type: "image" as Asset["type"],
    url: "",
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    const rawAssets = getAssets();
    const extendedAssets: ExtendedAsset[] = rawAssets.map((a) => ({
      ...a,
      ...mockAssetExtras[a.id],
    }));
    setAssets(extendedAssets);
  };

  const filteredAssets = assets.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterUsage !== "all" && a.usage !== filterUsage) return false;
    return true;
  });

  const handleUpload = async () => {
    if (!newAsset.name) {
      toast.error(t("验证错误", "Validation error"), { description: t("文件名是必需的。", "File name is required.") });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    await new Promise((resolve) => setTimeout(resolve, 1600));
    clearInterval(progressInterval);
    setUploadProgress(100);

    const now = new Date().toISOString();
    const assetToSave: Asset = {
      id: generateId(),
      name: newAsset.name,
      type: newAsset.type,
      url: newAsset.url || `/assets/${newAsset.name}`,
      size: Math.floor(Math.random() * 5000000) + 100000,
      uploadedAt: now,
      uploadedBy: user?.name || "Unknown",
    };

    saveAsset(assetToSave);
    loadAssets();
    setIsUploadDialogOpen(false);
    setIsUploading(false);
    setUploadProgress(0);
    setNewAsset({ name: "", type: "image", url: "" });
    toast.success(t("资源已上传", "Asset uploaded"), { description: t(`"${assetToSave.name}" 已添加。`, `"${assetToSave.name}" has been added.`) });
  };

  const handleCopyLink = (asset: ExtendedAsset) => {
    navigator.clipboard.writeText(`https://example.com${asset.url}`);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(t("链接已复制", "Link copied"), { description: t("资源 URL 已复制到剪贴板。", "Asset URL copied to clipboard.") });
  };

  const handleSetUsage = (asset: ExtendedAsset, usage: AssetUsage) => {
    // In a real app, this would save to the backend
    const updated = assets.map((a) => (a.id === asset.id ? { ...a, usage } : a));
    setAssets(updated);
    if (selectedAsset?.id === asset.id) {
      setSelectedAsset({ ...selectedAsset, usage });
    }
    toast.success(t("用途已更新", "Usage updated"), { description: t(`资源已标记为 ${usage}。`, `Asset marked as ${usage}.`) });
  };

  const handleDelete = (asset: ExtendedAsset) => {
    if (!user || !canDelete(user.role)) {
      toast.error(t("权限被拒绝", "Permission denied"), { description: t("只有管理员可以删除资源。", "Only admins can delete assets.") });
      return;
    }
    setAssetToDelete(asset);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (assetToDelete) {
      deleteAsset(assetToDelete.id);
      loadAssets();
      if (selectedAsset?.id === assetToDelete.id) {
        setSelectedAsset(null);
      }
      toast.success(t("资源已删除", "Asset deleted"), { description: t(`"${assetToDelete.name}" 已被删除。`, `"${assetToDelete.name}" has been deleted.`) });
    }
    setIsDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  const getTypeIcon = (type: Asset["type"], className = "h-8 w-8") => {
    switch (type) {
      case "image":
        return <ImageIcon className={`${className} text-accent`} />;
      case "audio":
        return <FileAudio className={`${className} text-chart-3`} />;
      case "document":
        return <FileText className={`${className} text-primary`} />;
      default:
        return <FileText className={`${className} text-muted-foreground`} />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getUsageBadgeColor = (usage?: AssetUsage) => {
    switch (usage) {
      case "Lesson":
        return "bg-primary/20 text-primary border-primary/30";
      case "Reading":
        return "bg-accent/20 text-accent border-accent/30";
      case "Medical":
        return "bg-chart-5/20 text-chart-5 border-chart-5/30";
      default:
        return "bg-secondary/50 text-muted-foreground border-border/50";
    }
  };

  // Calculate stats
  const totalSize = assets.reduce((acc, a) => acc + a.size, 0);
  const imageCount = assets.filter((a) => a.type === "image").length;
  const audioCount = assets.filter((a) => a.type === "audio").length;
  const docCount = assets.filter((a) => a.type === "document").length;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Main Content - Asset Grid */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("资源", "Assets")}</h1>
            <p className="text-muted-foreground">{t("管理媒体文件和文档", "Manage media files and documents")}</p>
          </div>
          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            className="rounded-xl bg-primary hover:bg-primary/90"
            disabled={!user || !canEdit(user.role)}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t("上传资源", "Upload Asset")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-4 pb-4">
              <div className="text-xl font-bold text-foreground">{formatBytes(totalSize)}</div>
              <p className="text-xs text-muted-foreground">{t("总存储", "Total Storage")}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <ImageIcon className="h-6 w-6 text-accent" />
              <div>
                <div className="text-xl font-bold text-foreground">{imageCount}</div>
                <p className="text-xs text-muted-foreground">{t("图片", "Images")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <FileAudio className="h-6 w-6 text-chart-3" />
              <div>
                <div className="text-xl font-bold text-foreground">{audioCount}</div>
                <p className="text-xs text-muted-foreground">{t("音频", "Audio")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <div className="text-xl font-bold text-foreground">{docCount}</div>
                <p className="text-xs text-muted-foreground">{t("文档", "Documents")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50 rounded-xl">
              <SelectValue placeholder={t("类型", "Type")} />
            </SelectTrigger>
            <SelectContent className="glass-card border-border/50 rounded-xl">
              <SelectItem value="all">{t("所有类型", "All Types")}</SelectItem>
              <SelectItem value="image">{t("图片", "Images")}</SelectItem>
              <SelectItem value="audio">{t("音频", "Audio")}</SelectItem>
              <SelectItem value="document">{t("文档", "Documents")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUsage} onValueChange={setFilterUsage}>
            <SelectTrigger className="w-[150px] bg-secondary/50 border-border/50 rounded-xl">
              <SelectValue placeholder={t("用途", "Usage")} />
            </SelectTrigger>
            <SelectContent className="glass-card border-border/50 rounded-xl">
              <SelectItem value="all">{t("所有用途", "All Usage")}</SelectItem>
              <SelectItem value="Lesson">{t("课程", "Lesson")}</SelectItem>
              <SelectItem value="Reading">{t("阅读", "Reading")}</SelectItem>
              <SelectItem value="Medical">{t("医学", "Medical")}</SelectItem>
              <SelectItem value="Other">{t("其他", "Other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-4">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className={`glass-card border-border/50 rounded-2xl cursor-pointer transition-all hover:border-primary/50 ${selectedAsset?.id === asset.id ? "border-primary ring-2 ring-primary/20" : ""}`}
                onClick={() => setSelectedAsset(asset)}
              >
                <CardContent className="p-4">
                  {/* Preview */}
                  <div className="aspect-square rounded-xl bg-secondary/30 flex items-center justify-center mb-3 overflow-hidden">
                    {asset.type === "image" ? (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-accent/50" />
                      </div>
                    ) : (
                      getTypeIcon(asset.type, "h-12 w-12")
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm truncate" title={asset.name}>
                      {asset.name}
                    </p>
                    <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${getUsageBadgeColor(asset.usage)}`}>
                          {asset.usage ? t(
                            asset.usage === "Lesson" ? "课程" : asset.usage === "Reading" ? "阅读" : asset.usage === "Medical" ? "医学" : "其他",
                            asset.usage
                          ) : t("未标记", "Untagged")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatBytes(asset.size)}</span>
                      </div>
                    </div>
  
                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(asset);
                        }}
                      >
                        {copiedId === asset.id ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-border/50 rounded-xl">
                          <DropdownMenuItem onClick={() => handleCopyLink(asset)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {t("复制链接", "Copy Link")}
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Tag className="mr-2 h-4 w-4" />
                              {t("标记用途", "Mark Usage")}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="glass-card border-border/50 rounded-xl">
                              <DropdownMenuItem onClick={() => handleSetUsage(asset, "Lesson")}>
                                {t("课程", "Lesson")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetUsage(asset, "Reading")}>
                                {t("阅读", "Reading")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetUsage(asset, "Medical")}>
                                {t("医学", "Medical")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetUsage(asset, "Other")}>
                                {t("其他", "Other")}
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(asset)}
                            className="text-destructive focus:text-destructive"
                            disabled={!user || !canDelete(user.role)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("删除", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

      {/* Right Panel - Asset Details */}
      <Card className="w-80 glass-card border-border/50 rounded-2xl flex-shrink-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("资源详情", "Asset Details")}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAsset ? (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video rounded-xl bg-secondary/30 flex items-center justify-center overflow-hidden">
                {selectedAsset.type === "image" ? (
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-accent/50" />
                  </div>
                ) : (
                  getTypeIcon(selectedAsset.type, "h-16 w-16")
                )}
              </div>

              {/* Name */}
              <div>
                <p className="text-sm text-muted-foreground">{t("文件名", "File Name")}</p>
                <p className="font-medium break-all">{selectedAsset.name}</p>
              </div>

              <Separator className="bg-border/30" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("类型", "Type")}</p>
                  <p className="text-sm font-medium capitalize">{t(
                    selectedAsset.type === "image" ? "图片" : selectedAsset.type === "audio" ? "音频" : "文档",
                    selectedAsset.type
                  )}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("大小", "Size")}</p>
                  <p className="text-sm font-medium">{formatBytes(selectedAsset.size)}</p>
                </div>
                {selectedAsset.format && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t("格式", "Format")}</p>
                    <p className="text-sm font-medium">{selectedAsset.format}</p>
                  </div>
                )}
                {selectedAsset.dimensions && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t("尺寸", "Dimensions")}</p>
                    <p className="text-sm font-medium">{selectedAsset.dimensions}</p>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Usage */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("用途", "Usage")}</p>
                <Badge variant="outline" className={getUsageBadgeColor(selectedAsset.usage)}>
                  {selectedAsset.usage ? t(
                    selectedAsset.usage === "Lesson" ? "课程" : selectedAsset.usage === "Reading" ? "阅读" : selectedAsset.usage === "Medical" ? "医学" : "其他",
                    selectedAsset.usage
                  ) : t("未标记", "Untagged")}
                </Badge>
              </div>

              {/* Last Used In */}
              {selectedAsset.lastUsedIn && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("最后使用于", "Last Used In")}</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedAsset.lastUsedIn}</p>
                  </div>
                </div>
              )}

              <Separator className="bg-border/30" />

              {/* Metadata */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("上传者", "Uploaded By")}</p>
                  <p className="text-sm">{selectedAsset.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("上传时间", "Uploaded At")}</p>
                  <p className="text-sm">
                    {new Date(selectedAsset.uploadedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="outline"
                  className="w-full rounded-xl bg-transparent"
                  onClick={() => handleCopyLink(selectedAsset)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t("复制链接", "Copy Link")}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full rounded-xl"
                  onClick={() => handleDelete(selectedAsset)}
                  disabled={!user || !canDelete(user.role)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("删除资源", "Delete Asset")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("选择一个资源查看详情", "Select an asset to view details")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("上传资源", "Upload Asset")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("添加新文件到您的资源库。（模拟上传）", "Add a new file to your asset library. (Mock upload)")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Drop Zone */}
            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {t("拖放文件到此处，或点击浏览", "Drag and drop your file here, or click to browse")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("支持：JPG, PNG, MP3, WAV, PDF, DOC", "Supports: JPG, PNG, MP3, WAV, PDF, DOC")}
              </p>
            </div>

            {/* Progress Bar (shown during upload) */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("上传中...", "Uploading...")}</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t("文件名", "File Name")}</Label>
              <Input
                id="name"
                value={newAsset.name}
                onChange={(e) => setNewAsset((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-secondary/50 border-border/50 rounded-xl"
                placeholder={t("例如：lesson-banner.jpg", "e.g., lesson-banner.jpg")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t("文件类型", "File Type")}</Label>
              <Select
                value={newAsset.type}
                onValueChange={(value) => setNewAsset((prev) => ({ ...prev, type: value as Asset["type"] }))}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/50 rounded-xl">
                  <SelectItem value="image">{t("图片", "Image")}</SelectItem>
                  <SelectItem value="audio">{t("音频", "Audio")}</SelectItem>
                  <SelectItem value="document">{t("文档", "Document")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">{t("URL 路径（可选）", "URL Path (optional)")}</Label>
              <Input
                id="url"
                value={newAsset.url}
                onChange={(e) => setNewAsset((prev) => ({ ...prev, url: e.target.value }))}
                className="bg-secondary/50 border-border/50 rounded-xl"
                placeholder="/assets/filename.ext"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              className="rounded-xl"
              disabled={isUploading}
            >
              {t("取消", "Cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              className="rounded-xl bg-primary hover:bg-primary/90"
              disabled={isUploading}
            >
              {isUploading ? t("上传中...", "Uploading...") : t("上传", "Upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("删除资源", "Delete Asset")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t(
                `确定要删除 "${assetToDelete?.name}" 吗？此操作无法撤销。`,
                `Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl">
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={confirmDelete} variant="destructive" className="rounded-xl">
              {t("删除", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
