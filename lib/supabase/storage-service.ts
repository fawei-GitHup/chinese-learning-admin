/**
 * Supabase Storage 服务层
 * 工单 A6-01: Asset Storage Integration
 * 
 * 提供文件上传、下载、删除等功能的封装
 */

import { getSupabaseBrowser, isSupabaseConfigured } from './client';

// =====================================================
// 类型定义
// =====================================================

export type AssetType = 'image' | 'audio' | 'document';

export interface UploadedAsset {
  id: string;
  name: string;
  path: string;
  url: string;
  type: AssetType;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
  upsert?: boolean;
}

export interface AssetMetadata {
  id?: string;
  storage_path: string;
  display_name?: string;
  description?: string;
  usage?: 'Lesson' | 'Reading' | 'Medical' | 'Other';
  tags?: string[];
  file_type?: AssetType;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// =====================================================
// 配置常量
// =====================================================

const BUCKET_NAME = 'assets';
const MAX_FILE_SIZE = 52428800; // 50MB

// 允许的 MIME 类型映射
const ALLOWED_MIME_TYPES: Record<string, AssetType> = {
  // 图片
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  // 音频
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/aac': 'audio',
  'audio/mp4': 'audio',
  // 文档
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
};

// 文件扩展名到 MIME 类型的简单映射
const EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// =====================================================
// 工具函数
// =====================================================

/**
 * 根据 MIME 类型判断资源类型
 */
export function getAssetType(mimeType: string): AssetType {
  return ALLOWED_MIME_TYPES[mimeType] || 'document';
}

/**
 * 生成唯一文件名（避免覆盖）
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.lastIndexOf('.') > -1 
    ? originalName.substring(originalName.lastIndexOf('.'))
    : '';
  const baseName = originalName.lastIndexOf('.') > -1
    ? originalName.substring(0, originalName.lastIndexOf('.'))
    : originalName;
  
  // 清理文件名，移除特殊字符
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
    .substring(0, 50);
  
  return `${cleanBaseName}_${timestamp}_${random}${extension.toLowerCase()}`;
}

/**
 * 根据类型生成文件夹路径
 */
export function getFolderPath(type: AssetType, customFolder?: string): string {
  if (customFolder) {
    return customFolder.replace(/^\/|\/$/g, '');
  }
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const typeFolder = type === 'image' ? 'images' : type === 'audio' ? 'audio' : 'documents';
  return `${typeFolder}/${year}/${month}`;
}

/**
 * 检查文件大小和类型
 */
export function validateFile(file: File): ValidationResult {
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
    return {
      valid: false,
      error: `文件大小超过限制（最大 ${maxMB}MB）`,
    };
  }

  // 检查文件类型
  if (!ALLOWED_MIME_TYPES[file.type]) {
    // 尝试通过扩展名判断
    const extension = file.name.lastIndexOf('.') > -1
      ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      : '';
    
    if (!EXTENSION_TO_MIME[extension]) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type || extension || '未知'}`,
      };
    }
  }

  return { valid: true };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// =====================================================
// 核心功能：Storage 操作
// =====================================================

/**
 * 上传文件到 Supabase Storage
 */
export async function uploadAsset(
  file: File,
  options: UploadOptions = {}
): Promise<UploadedAsset> {
  const { folder, onProgress, upsert = false } = options;
  
  // 验证文件
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置，请检查环境变量');
  }

  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('用户未登录');
  }

  // 确定资源类型和路径
  const assetType = getAssetType(file.type);
  const folderPath = getFolderPath(assetType, folder);
  const uniqueFileName = generateUniqueFileName(file.name);
  const fullPath = `${folderPath}/${uniqueFileName}`;

  // 模拟上传进度（Supabase JS 客户端目前不支持原生进度回调）
  let progressTimer: ReturnType<typeof setInterval> | null = null;
  if (onProgress) {
    let loaded = 0;
    const simulatedChunkSize = file.size / 10;
    progressTimer = setInterval(() => {
      loaded = Math.min(loaded + simulatedChunkSize, file.size * 0.9);
      onProgress({
        loaded: Math.round(loaded),
        total: file.size,
        percentage: Math.round((loaded / file.size) * 100),
      });
    }, 100);
  }

  try {
    // 上传文件
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert,
        contentType: file.type,
      });

    if (error) {
      throw new Error(`上传失败: ${error.message}`);
    }

    // 完成进度
    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });
    }

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    const uploadedAsset: UploadedAsset = {
      id: data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      path: data.path,
      url: publicUrl,
      type: assetType,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.email || user.id,
    };

    return uploadedAsset;
  } finally {
    if (progressTimer) {
      clearInterval(progressTimer);
    }
  }
}

/**
 * 获取所有资源列表
 */
export async function listAssets(folder?: string): Promise<UploadedAsset[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置，请检查环境变量');
  }

  const assets: UploadedAsset[] = [];
  const foldersToScan = folder 
    ? [folder] 
    : ['images', 'audio', 'documents'];

  for (const scanFolder of foldersToScan) {
    try {
      // 递归获取所有文件
      const files = await listFilesRecursively(scanFolder);
      assets.push(...files);
    } catch (error) {
      console.warn(`[Storage] 扫描文件夹 ${scanFolder} 失败:`, error);
    }
  }

  // 按上传时间倒序排列
  return assets.sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

/**
 * 递归列出文件夹中的所有文件
 */
async function listFilesRecursively(folderPath: string): Promise<UploadedAsset[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const assets: UploadedAsset[] = [];
  
  const { data: items, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error(`[Storage] 列出文件失败 (${folderPath}):`, error);
    return [];
  }

  if (!items || items.length === 0) {
    return [];
  }

  for (const item of items) {
    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
    
    // 检查是否为文件夹（id 为 null 的是文件夹）
    if (item.id === null) {
      // 递归扫描子文件夹
      const subFiles = await listFilesRecursively(fullPath);
      assets.push(...subFiles);
    } else {
      // 这是一个文件
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fullPath);

      // 从路径推断类型
      const extension = item.name.lastIndexOf('.') > -1
        ? item.name.substring(item.name.lastIndexOf('.')).toLowerCase()
        : '';
      const mimeType = (item.metadata?.mimetype as string) || EXTENSION_TO_MIME[extension] || 'application/octet-stream';
      const assetType = getAssetType(mimeType);

      assets.push({
        id: item.id,
        name: item.name,
        path: fullPath,
        url: publicUrl,
        type: assetType,
        size: (item.metadata?.size as number) || 0,
        mimeType,
        uploadedAt: item.created_at || new Date().toISOString(),
        uploadedBy: (item.metadata?.owner as string) || 'Unknown',
      });
    }
  }

  return assets;
}

/**
 * 获取资源的公开 URL
 */
export function getAssetPublicUrl(path: string): string {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    // 返回占位符 URL
    return `/storage/assets/${path}`;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * 获取资源的签名 URL（临时访问）
 */
export async function getAssetSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`获取签名 URL 失败: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * 删除单个资源
 */
export async function deleteAsset(path: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置，请检查环境变量');
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error(`删除失败: ${error.message}`);
  }
}

/**
 * 批量删除资源
 */
export async function deleteAssets(
  paths: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置，请检查环境变量');
  }

  const success: string[] = [];
  const failed: string[] = [];

  // 分批删除（每批最多 100 个）
  const batchSize = 100;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(batch);

    if (error) {
      console.error(`[Storage] 批量删除失败:`, error);
      failed.push(...batch);
    } else {
      success.push(...batch);
    }
  }

  return { success, failed };
}

/**
 * 移动/重命名资源
 */
export async function moveAsset(fromPath: string, toPath: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置');
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .move(fromPath, toPath);

  if (error) {
    throw new Error(`移动失败: ${error.message}`);
  }
}

/**
 * 复制资源
 */
export async function copyAsset(fromPath: string, toPath: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置');
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .copy(fromPath, toPath);

  if (error) {
    throw new Error(`复制失败: ${error.message}`);
  }
}

// =====================================================
// 元数据操作（可选，需要 assets_metadata 表）
// =====================================================

/**
 * 保存资源元数据
 */
export async function saveAssetMetadata(metadata: AssetMetadata): Promise<AssetMetadata> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置');
  }

  const { data, error } = await supabase
    .from('assets_metadata')
    .upsert({
      ...metadata,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'storage_path',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`保存元数据失败: ${error.message}`);
  }

  return data;
}

/**
 * 获取资源元数据
 */
export async function getAssetMetadata(storagePath: string): Promise<AssetMetadata | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('assets_metadata')
    .select('*')
    .eq('storage_path', storagePath)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 没有找到记录
    }
    throw new Error(`获取元数据失败: ${error.message}`);
  }

  return data;
}

/**
 * 删除资源元数据
 */
export async function deleteAssetMetadata(storagePath: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error('Supabase 未配置');
  }

  const { error } = await supabase
    .from('assets_metadata')
    .delete()
    .eq('storage_path', storagePath);

  if (error) {
    throw new Error(`删除元数据失败: ${error.message}`);
  }
}

/**
 * 按用途筛选资源元数据
 */
export async function listAssetMetadataByUsage(
  usage?: 'Lesson' | 'Reading' | 'Medical' | 'Other'
): Promise<AssetMetadata[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('assets_metadata')
    .select('*')
    .order('created_at', { ascending: false });

  if (usage) {
    query = query.eq('usage', usage);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Storage] 获取元数据列表失败:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// 检查服务可用性
// =====================================================

/**
 * 检查 Storage 服务是否可用
 */
export function isStorageAvailable(): boolean {
  return isSupabaseConfigured;
}

/**
 * 测试 Storage 连接
 */
export async function testStorageConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { 
      success: false, 
      error: 'Supabase 未配置' 
    };
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { 
      success: false, 
      error: 'Supabase 客户端初始化失败' 
    };
  }

  try {
    // 尝试列出桶中的文件（空列表也是成功）
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });

    if (error) {
      return { 
        success: false, 
        error: `Storage 访问失败: ${error.message}` 
      };
    }

    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: `连接测试失败: ${err instanceof Error ? err.message : '未知错误'}` 
    };
  }
}
