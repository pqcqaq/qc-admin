import { http } from "@/utils/http";

export type Attachment = {
  /** 附件ID */
  id: string;
  /** 文件名 */
  filename: string;
  /** 文件大小 */
  size: number;
  /** 文件类型 */
  contentType: string;
  /** 存储路径 */
  path: string;
  /** 存储类型 */
  storageProvider: string;
  /** 文件URL */
  url?: string;
  /** 状态 */
  status: string;
  /** 标签 */
  tags?: string[];
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
};

export type Pagination = {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
};

export type AttachmentResult = {
  success: boolean;
  data: Attachment;
  message?: string;
};

export type AttachmentListResult = {
  success: boolean;
  data: Array<Attachment>;
  pagination: Pagination;
};

export type UploadPrepareResult = {
  success: boolean;
  data: {
    /** 上传URL */
    uploadUrl: string;
    /** 文件ID */
    attachmentId: string;
    /** 上传会话ID */
    uploadSessionId: string;
    /** 过期时间 */
    expiresAt: number;
  };
  message?: string;
};

export type UploadConfirmResult = {
  success: boolean;
  data: Attachment;
  message?: string;
};

/** 获取附件列表 */
export const getAttachmentList = (data?: object) => {
  return http.request<AttachmentListResult>("get", "/api/attachments", {
    params: data
  });
};

/** 获取附件分页列表 */
export const getAttachmentListWithPagination = (data?: object) => {
  return http.request<AttachmentListResult>(
    "get",
    "/api/attachments/paginated",
    {
      params: data
    }
  );
};

/** 获取单个附件 */
export const getAttachment = (id: string) => {
  return http.request<AttachmentResult>("get", `/api/attachments/${id}`);
};

/** 获取附件URL */
export const getAttachmentURL = (id: string) => {
  return http.request<{ success: boolean; data: { url: string } }>(
    "get",
    `/api/attachments/${id}/url`
  );
};

/** 创建附件记录 */
export const createAttachment = (data: object) => {
  return http.request<AttachmentResult>("post", "/api/attachments", {
    data
  });
};

/** 更新附件 */
export const updateAttachment = (id: string, data: object) => {
  return http.request<AttachmentResult>("put", `/api/attachments/${id}`, {
    data
  });
};

/** 删除附件 */
export const deleteAttachment = (id: string) => {
  return http.request<any>("delete", `/api/attachments/${id}`);
};

/** 准备上传 - 获取上传凭证 */
export const prepareUpload = (data: {
  filename: string;
  contentType: string;
  size: number;
}) => {
  return http.request<UploadPrepareResult>(
    "post",
    "/api/attachments/prepare-upload",
    {
      data
    }
  );
};

/** 确认上传完成 */
export const confirmUpload = (data: {
  etag?: string;
  actualSize?: string;
  uploadSessionId: string;
}) => {
  return http.post<UploadConfirmResult, any>(
    "/api/attachments/confirm-upload",
    {
      data
    }
  );
};

/** 直接上传文件 */
export const directUpload = (formData: FormData) => {
  return http.post<AttachmentResult, any>("/api/attachments/direct-upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
