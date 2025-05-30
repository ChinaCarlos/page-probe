// 批量导入的数据结构（JSON文件格式）
export interface ImportTarget {
  name: string;
  url: string;
  deviceType?: "desktop" | "mobile";
  groupId?: string;
  tagIds?: string[];
}

export interface ImportData {
  targets: ImportTarget[];
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
