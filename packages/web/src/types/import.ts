// 批量导入的数据结构（JSON文件格式）
export interface ImportTarget {
  name: string;
  url: string;
  deviceType?: "desktop" | "mobile";
  groupId?: string; // 兼容旧格式，但在新的批量导入中将被忽略
  tagIds?: string[]; // 兼容旧格式，但在新的批量导入中将被忽略
}

export interface ImportData {
  targets: ImportTarget[];
  batchGroupId?: string; // 用户选择的批量分组ID
  batchTagIds?: string[]; // 用户选择的批量标签ID数组
}

// 导入结果
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  details: {
    target: ImportTarget;
    success: boolean;
    error?: string;
  }[];
}
