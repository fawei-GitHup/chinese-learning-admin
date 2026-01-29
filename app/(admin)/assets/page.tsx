"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Check,
  FolderOpen,
  AlertCircle,
  RefreshCw,
  Download,
  Play,
  Pause,
  X,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAssets, saveAsset, deleteAsset as deleteMockAsset, generateId } from "@/lib/mock/storage";
import type { Asset } from "@/lib/mock/data";
import { useAuth, canEdit, canDelete } from "@/lib/auth-context";
import { toast } from "sonner";
import { useAdminLocale } from "@/lib/admin-locale";
import {
  uploadAsset,
  listAssets,
  deleteAsset as deleteStorageAsset,
  isStorageAvailable,
  validateFile,
  formatFileSize,
  type UploadedAsset,
  type UploadProgress,
  type AssetType,
} from "@/lib/supabase/storage-service";

type AssetUsage = "Lesson" | "Reading" | "Medical" | "Other";

interface ExtendedAsset extends Asset {
  usage?: AssetUsage;
  lastUsedIn?: string;
  dimensions?: string;
  format?: string;
  path?: string;
  mimeType?: string;
}

// Mock 数据扩展（仅在 Mock 模式下使用）
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
  
  // 状态
  const [assets, setAssets] = useState<ExtendedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ExtendedAsset | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<ExtendedAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUsage, setFilterUsage] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useRealStorage, setUseRealStorage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 检查存储可用性
  useEffect(() => {
    const checkStorage = async () => {
      const available = isStorageAvailable();
      setUseRealStorage(available);
      if (available) {
        console.log('[Assets] 使用 Supabase Storage');
      } else {
        console.log('[Assets] 使用 Mock Storage（Supabase 未配置）');
      }
    };
    checkStorage();
  }, []);

  // 加载资源
  useEffect(() => {
    loadAssets();
  }, [useRealStorage]);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useRealStorage) {
        // 使用真实 Storage
        const realAssets = await listAssets();
        const extendedAssets: ExtendedAsset[] = realAssets.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type as ExtendedAsset["type"],
          url: a.url,
          size: a.size,
          uploadedAt: a.uploadedAt,
          uploadedBy: a.uploadedBy,
          path: a.path,
          mimeType: a.mimeType,
          format: getFormatFromMimeType(a.mimeType),
        }));
        setAssets(extendedAssets);
      } else {
        // 使用 Mock 数据
        const rawAssets = getAssets();
        const extendedAssets: ExtendedAsset[] = rawAssets.map((a) => ({
          ...a,
          ...mockAssetExtras[a.id],
        }));
        setAssets(extendedAssets);
      }
    } catch (error) {
      console.error('[Assets] 加载资源失败:', error);
      toast.error(t("加载失败", "Load failed"), {
        description: t("无法加载资源列表，请稍后重试", "Unable to load assets, please try again later"),
      });
      // 回退到 Mock 数据
      const rawAssets = getAssets();
      const extendedAssets: ExtendedAsset[] = rawAssets.map((a) => ({
        ...a,
        ...mockAssetExtras[a.id],
      }));
      setAssets(extendedAssets);
    } finally {
      setIsLoading(false);
    }
  }, [useRealStorage, t]);

  // 从 MIME 类型获取格式
  const getFormatFromMimeType = (mimeType: string): string => {
    const formatMap: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'image/svg+xml': 'SVG',
      'audio/mpeg': 'MP3',
      'audio/wav': 'WAV',
      'audio/ogg': 'OGG',
      'audio/aac': 'AAC',
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    };
    return formatMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Unknown';
  };

  // 过滤资源
  const filteredAssets = assets.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterUsage !== "all" && a.usage !== filterUsage) return false;
    return true;
  });

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      // 验证文件
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          toast.error(t("文件验证失败", "File validation failed"), {
            description: `${file.name}: ${validation.error}`,
          });
        }
      }
      setSelectedFiles(validFiles);
    }
  };

  // 拖拽处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 检查是否真的离开了放置区域
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          toast.error(t("文件验证失败", "File validation failed"), {
            description: `${file.name}: ${validation.error}`,
          });
        }
      }
      setSelectedFiles(validFiles);
    }
  };

  // 移除选中的文件
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 处理上传
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error(t("验证错误", "Validation error"), {
        description: t("请选择要上传的文件", "Please select files to upload"),
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = selectedFiles.length;
    let uploadedCount = 0;
    let failedCount = 0;

    for (const file of selectedFiles) {
      try {
        if (useRealStorage) {
          // 使用真实 Storage 上传
          await uploadAsset(file, {
            onProgress: (progress: UploadProgress) => {
              const baseProgress = (uploadedCount / totalFiles) * 100;
              const fileProgress = (progress.percentage / totalFiles);
              setUploadProgress(Math.round(baseProgress + fileProgress));
            },
          });
        } else {
          // 模拟上传
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          // 保存到 Mock storage
          const now = new Date().toISOString();
          const assetType: Asset["type"] = file.type.startsWith('image/') 
            ? 'image' 
            : file.type.startsWith('audio/') 
              ? 'audio' 
              : 'document';
          
          const assetToSave: Asset = {
            id: generateId(),
            name: file.name,
            type: assetType,
            url: URL.createObjectURL(file), // 本地预览 URL
            size: file.size,
            uploadedAt: now,
            uploadedBy: user?.name || "Unknown",
          };
          saveAsset(assetToSave);
        }
        
        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      } catch (error) {
        console.error(`[Assets] 上传失败: ${file.name}`, error);
        failedCount++;
        toast.error(t("上传失败", "Upload failed"), {
          description: `${file.name}: ${error instanceof Error ? error.message : t("未知错误", "Unknown error")}`,
        });
      }
    }

    // 上传完成
    setIsUploading(false);
    setUploadProgress(100);
    
    if (uploadedCount > 0) {
      toast.success(
        t("上传完成", "Upload complete"),
        { description: t(`成功上传 ${uploadedCount} 个文件`, `Successfully uploaded ${uploadedCount} file(s)`) }
      );
    }
    
    if (failedCount > 0) {
      toast.warning(
        t("部分上传失败", "Some uploads failed"),
        { description: t(`${failedCount} 个文件上传失败`, `${failedCount} file(s) failed to upload`) }
      );
    }

    // 重置状态
    setSelectedFiles([]);
    setIsUploadDialogOpen(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // 刷新资源列表
    loadAssets();
  };

  // 复制链接
  const handleCopyLink = (asset: ExtendedAsset) => {
    const url = asset.url.startsWith('http') ? asset.url : `${window.location.origin}${asset.url}`;
    navigator.clipboard.writeText(url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(t("链接已复制", "Link copied"), {
      description: t("资源 URL 已复制到剪贴板", "Asset URL copied to clipboard"),
    });
  };

  // 设置用途
  const handleSetUsage = (asset: ExtendedAsset, usage: AssetUsage) => {
    const updated = assets.map((a) => (a.id === asset.id ? { ...a, usage } : a));
    setAssets(updated);
    if (selectedAsset?.id === asset.id) {
      setSelectedAsset({ ...selectedAsset, usage });
    }
    toast.success(t("用途已更新", "Usage updated"), {
      description: t(`资源已标记为 ${usage}`, `Asset marked as ${usage}`),
    });
  };

  // 删除确认
  const handleDelete = (asset: ExtendedAsset) => {
    if (!user || !canDelete(user.role)) {
      toast.error(t("权限被拒绝", "Permission denied"), {
        description: t("只有管理员可以删除资源", "Only admins can delete assets"),
      });
      return;
    }
    setAssetToDelete(asset);
    setIsDeleteDialogOpen(true);
  };

  // 执行删除
  const confirmDelete = async () => {
    if (!assetToDelete) return;

    try {
      if (useRealStorage && assetToDelete.path) {
        // 删除真实 Storage 中的文件
        await deleteStorageAsset(assetToDelete.path);
      } else {
        // 删除 Mock storage 中的记录
        deleteMockAsset(assetToDelete.id);
      }

      // 更新本地状态
      setAssets((prev) => prev.filter((a) => a.id !== assetToDelete.id));
      if (selectedAsset?.id === assetToDelete.id) {
        setSelectedAsset(null);
      }

      toast.success(t("资源已删除", "Asset deleted"), {
        description: t(`"${assetToDelete.name}" 已被删除`, `"${assetToDelete.name}" has been deleted`),
      });
    } catch (error) {
      console.error('[Assets] 删除失败:', error);
      toast.error(t("删除失败", "Delete failed"), {
        description: error instanceof Error ? error.message : t("未知错误", "Unknown error"),
      });
    }

    setIsDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  // 下载资源
  const handleDownload = (asset: ExtendedAsset) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 播放/暂停音频
  const toggleAudioPlay = (asset: ExtendedAsset) => {
    if (audioPlaying === asset.id) {
      audioRef.current?.pause();
      setAudioPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = asset.url;
        audioRef.current.play();
        setAudioPlaying(asset.id);
      }
    }
  };

  // 获取类型图标
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

  // 格式化字节
  const formatBytes = (bytes: number) => {
    return formatFileSize(bytes);
  };

  // 获取用途徽章颜色
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

  // 计算统计数据
  const totalSize = assets.reduce((acc, a) => acc + a.size, 0);
  const imageCount = assets.filter((a) => a.type === "image").length;
  const audioCount = assets.filter((a) => a.type === "audio").length;
  const docCount = assets.filter((a) => a.type === "document").length;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        onEnded={() => setAudioPlaying(null)}
        className="hidden"
      />

      {/* 主内容 - 资源网格 */}
      <div className="flex-1 flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("资源", "Assets")}</h1>
            <p className="text-muted-foreground">
              {t("管理媒体文件和文档", "Manage media files and documents")}
              {!useRealStorage && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {t("Mock 模式", "Mock Mode")}
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAssets}
              disabled={isLoading}
              className="rounded-xl"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t("刷新", "Refresh")}
            </Button>
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              className="rounded-xl bg-primary hover:bg-primary/90"
              disabled={!user || !canEdit(user.role)}
            >
              <Upload className="mr-2 h-4 w-4" />
              {t("上传资源", "Upload Asset")}
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
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

        {/* 过滤器 */}
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

        {/* 资源网格 */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t("没有找到资源", "No assets found")}
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => setIsUploadDialogOpen(true)}
                disabled={!user || !canEdit(user.role)}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("上传第一个资源", "Upload your first asset")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-4">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className={`glass-card border-border/50 rounded-2xl cursor-pointer transition-all hover:border-primary/50 ${
                    selectedAsset?.id === asset.id ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardContent className="p-4">
                    {/* 预览 */}
                    <div className="aspect-square rounded-xl bg-secondary/30 flex items-center justify-center mb-3 overflow-hidden relative">
                      {asset.type === "image" ? (
                        useRealStorage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-accent/50" />
                          </div>
                        )
                      ) : asset.type === "audio" ? (
                        <div className="w-full h-full bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-full bg-chart-3/20 hover:bg-chart-3/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAudioPlay(asset);
                            }}
                          >
                            {audioPlaying === asset.id ? (
                              <Pause className="h-6 w-6 text-chart-3" />
                            ) : (
                              <Play className="h-6 w-6 text-chart-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        getTypeIcon(asset.type, "h-12 w-12")
                      )}
                      {/* 图片加载失败的备用显示 */}
                      <div className="hidden w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center absolute inset-0">
                        <ImageIcon className="h-12 w-12 text-accent/50" />
                      </div>
                    </div>

                    {/* 信息 */}
                    <div className="space-y-2">
                      <p className="font-medium text-sm truncate" title={asset.name}>
                        {asset.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${getUsageBadgeColor(asset.usage)}`}>
                          {asset.usage
                            ? t(
                                asset.usage === "Lesson"
                                  ? "课程"
                                  : asset.usage === "Reading"
                                  ? "阅读"
                                  : asset.usage === "Medical"
                                  ? "医学"
                                  : "其他",
                                asset.usage
                              )
                            : t("未标记", "Untagged")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatBytes(asset.size)}</span>
                      </div>
                    </div>

                    {/* 操作 */}
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
                          <DropdownMenuItem onClick={() => handleDownload(asset)}>
                            <Download className="mr-2 h-4 w-4" />
                            {t("下载", "Download")}
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
          )}
        </ScrollArea>
      </div>

      {/* 右侧面板 - 资源详情 */}
      <Card className="w-80 glass-card border-border/50 rounded-2xl flex-shrink-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("资源详情", "Asset Details")}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAsset ? (
            <div className="space-y-4">
              {/* 预览 */}
              <div className="aspect-video rounded-xl bg-secondary/30 flex items-center justify-center overflow-hidden">
                {selectedAsset.type === "image" ? (
                  useRealStorage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedAsset.url}
                      alt={selectedAsset.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-accent/50" />
                    </div>
                  )
                ) : selectedAsset.type === "audio" ? (
                  <div className="w-full h-full bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex flex-col items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-16 w-16 rounded-full bg-chart-3/20 hover:bg-chart-3/30"
                      onClick={() => toggleAudioPlay(selectedAsset)}
                    >
                      {audioPlaying === selectedAsset.id ? (
                        <Pause className="h-8 w-8 text-chart-3" />
                      ) : (
                        <Play className="h-8 w-8 text-chart-3" />
                      )}
                    </Button>
                    {audioPlaying === selectedAsset.id && (
                      <p className="text-xs text-chart-3">{t("播放中...", "Playing...")}</p>
                    )}
                  </div>
                ) : (
                  getTypeIcon(selectedAsset.type, "h-16 w-16")
                )}
              </div>

              {/* 名称 */}
              <div>
                <p className="text-sm text-muted-foreground">{t("文件名", "File Name")}</p>
                <p className="font-medium break-all">{selectedAsset.name}</p>
              </div>

              <Separator className="bg-border/30" />

              {/* 详情网格 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("类型", "Type")}</p>
                  <p className="text-sm font-medium capitalize">
                    {t(
                      selectedAsset.type === "image"
                        ? "图片"
                        : selectedAsset.type === "audio"
                        ? "音频"
                        : "文档",
                      selectedAsset.type
                    )}
                  </p>
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

              {/* 用途 */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("用途", "Usage")}</p>
                <Badge variant="outline" className={getUsageBadgeColor(selectedAsset.usage)}>
                  {selectedAsset.usage
                    ? t(
                        selectedAsset.usage === "Lesson"
                          ? "课程"
                          : selectedAsset.usage === "Reading"
                          ? "阅读"
                          : selectedAsset.usage === "Medical"
                          ? "医学"
                          : "其他",
                        selectedAsset.usage
                      )
                    : t("未标记", "Untagged")}
                </Badge>
              </div>

              {/* 最后使用位置 */}
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

              {/* 元数据 */}
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

              {/* 操作按钮 */}
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
                  variant="outline"
                  className="w-full rounded-xl bg-transparent"
                  onClick={() => handleDownload(selectedAsset)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("下载", "Download")}
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

      {/* 上传对话框 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("上传资源", "Upload Asset")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {useRealStorage
                ? t("选择或拖放文件到此处上传到 Supabase Storage", "Select or drag files to upload to Supabase Storage")
                : t("选择或拖放文件到此处（当前为模拟上传模式）", "Select or drag files here (Mock upload mode)")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 拖放区域 */}
            <div
              ref={dropZoneRef}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-primary/50"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm text-muted-foreground">
                {isDragging
                  ? t("松开以添加文件", "Release to add files")
                  : t("拖放文件到此处，或点击浏览", "Drag and drop files here, or click to browse")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("支持：JPG, PNG, GIF, WebP, MP3, WAV, OGG, PDF, DOC", "Supports: JPG, PNG, GIF, WebP, MP3, WAV, OGG, PDF, DOC")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("最大文件大小: 50MB", "Max file size: 50MB")}
              </p>
            </div>

            {/* 已选文件列表 */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>{t("已选文件", "Selected Files")} ({selectedFiles.length})</Label>
                <ScrollArea className="max-h-40">
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4 text-accent flex-shrink-0" />
                          ) : file.type.startsWith("audio/") ? (
                            <FileAudio className="h-4 w-4 text-chart-3 flex-shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeSelectedFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* 进度条 */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("上传中...", "Uploading...")}</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* 存储模式提示 */}
            {!useRealStorage && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t(
                    "当前为 Mock 模式。配置 Supabase 环境变量后将使用真实存储。",
                    "Currently in Mock mode. Configure Supabase environment variables to use real storage."
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFiles([]);
              }}
              className="rounded-xl"
              disabled={isUploading}
            >
              {t("取消", "Cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              className="rounded-xl bg-primary hover:bg-primary/90"
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading
                ? t("上传中...", "Uploading...")
                : t(`上传 ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`, `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
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
