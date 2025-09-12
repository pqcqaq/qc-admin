# RBAC管理页面 - 后端接口需求

## 新增/扩展的接口需求

### 1. 角色树形结构接口
**接口**: `GET /api/rbac/roles/tree`
**功能**: 获取角色的树形结构，包含层级关系
**返回参数**:
```typescript
{
  success: boolean;
  data: Role[]; // 树形结构的角色数组，包含children字段
}
```

### 2. 角色详细权限信息接口
**接口**: `GET /api/rbac/roles/{roleId}/permissions/detailed`
**功能**: 获取角色的详细权限信息，区分直接分配和继承的权限
**返回参数**:
```typescript
{
  success: boolean;
  data: {
    role: Role;
    directPermissions: Permission[]; // 直接分配的权限
    inheritedPermissions: { // 继承的权限及来源
      permission: Permission;
      fromRole: Role;
    }[];
    allPermissions: Permission[]; // 所有权限（直接+继承）
  };
}
```

### 3. 创建子角色接口
**接口**: `POST /api/rbac/roles/{parentRoleId}/children`
**功能**: 在指定父角色下创建子角色，自动建立继承关系
**入参**:
```typescript
{
  name: string;
  description?: string;
}
```

### 4. 角色继承关系管理接口

#### 4.1 解除父角色依赖
**接口**: `DELETE /api/rbac/roles/{roleId}/parents/{parentRoleId}`
**功能**: 解除指定角色对某个父角色的继承关系

#### 4.2 添加父角色依赖
**接口**: `POST /api/rbac/roles/{roleId}/parents/{parentRoleId}`
**功能**: 为指定角色添加父角色继承关系

### 5. 获取可分配权限接口
**接口**: `GET /api/rbac/roles/{roleId}/permissions/assignable`
**功能**: 获取角色可以分配的权限（排除已有的直接权限和继承权限）
**返回参数**:
```typescript
{
  success: boolean;
  data: Permission[];
}
```

### 6. 角色用户管理接口

#### 6.1 获取角色用户（支持分页）
**接口**: `GET /api/rbac/user-roles/roles/{roleId}/users`
**功能**: 获取拥有指定角色的用户列表，支持分页和搜索
**入参**:
```typescript
{
  page?: number;
  pageSize?: number;
  keyword?: string; // 搜索关键字
}
```
**返回参数**:
```typescript
{
  success: boolean;
  data: User[]; // 用户列表，每个用户包含其他角色信息
  pagination: Pagination;
}
```

#### 6.2 批量分配用户到角色
**接口**: `POST /api/rbac/roles/{roleId}/users/batch`
**功能**: 批量将用户分配到指定角色
**入参**:
```typescript
{
  userIds: string[];
}
```

#### 6.3 批量从角色移除用户
**接口**: `DELETE /api/rbac/roles/{roleId}/users/batch`
**功能**: 批量从指定角色移除用户
**入参**:
```typescript
{
  userIds: string[];
}
```

### 7. 用户列表接口扩展
**接口**: `GET /api/users` (扩展现有接口)
**功能**: 获取用户列表，支持排除特定角色的用户
**新增入参**:
```typescript
{
  excludeRoleId?: string; // 排除拥有指定角色的用户
  keyword?: string; // 搜索关键字（用户名、昵称）
}
```

### 8. 权限域相关接口

#### 8.1 获取所有权限域（不分页）
**接口**: `GET /api/rbac/scopes/all`
**功能**: 获取所有权限域，用于下拉选择
**返回参数**:
```typescript
{
  success: boolean;
  data: Scope[];
}
```

## 数据模型要求

### 1. Role 模型扩展
```typescript
interface Role {
  id: string;
  name: string;
  description?: string;
  // 继承关系
  inheritsFrom?: Role[]; // 继承的父角色
  inheritedBy?: Role[]; // 被哪些角色继承
  children?: Role[]; // 子角色（树形结构用）
  // 统计信息
  userCount?: number; // 拥有该角色的用户数量
  permissionCount?: number; // 拥有的权限数量
  createTime: string;
  updateTime: string;
}
```

### 2. User 模型扩展
```typescript
interface User {
  id: string;
  name: string;
  nickname?: string;
  // 关联信息
  roles?: Role[]; // 用户的所有角色
  otherRoles?: Role[]; // 除了当前查询角色外的其他角色
  createTime: string;
  updateTime: string;
}
```

### 3. Permission 模型保持现有结构
```typescript
interface Permission {
  id: string;
  name: string;
  action: string;
  description?: string;
  scope?: Scope;
  createTime: string;
  updateTime: string;
}
```

## 业务逻辑要求

### 1. 角色继承逻辑
- 子角色自动继承父角色的所有权限
- 支持多重继承（一个角色可以继承多个父角色）
- 防止循环继承（不能继承自己的子孙角色）
- 删除角色时需要处理子角色的继承关系

### 2. 权限分配逻辑
- 直接分配的权限可以被撤销
- 继承的权限不能被直接撤销，只能通过修改继承关系来影响
- 获取可分配权限时要排除已有的直接权限和继承权限

### 3. 用户角色关系
- 用户可以拥有多个角色
- 用户的实际权限是所有角色权限的并集
- 支持批量操作以提高效率

### 4. 数据一致性
- 所有关联操作需要保证事务一致性
- 删除操作需要检查依赖关系
- 统计信息需要实时更新或定期同步

## 性能优化建议

### 1. 缓存策略
- 角色树结构可以缓存，仅在角色关系变更时更新
- 用户权限可以缓存，提高权限检查效率
- 权限继承关系可以预计算并缓存

### 2. 数据库优化
- 为角色继承关系建立索引
- 为用户角色关系建立复合索引
- 考虑使用闭包表或嵌套集合模型优化树形查询

### 3. 分页和搜索
- 所有列表接口都应支持分页
- 搜索功能使用数据库全文索引或搜索引擎
- 大数据量时考虑使用游标分页

## 安全考虑

### 1. 权限验证
- 所有角色管理操作都需要相应的管理权限
- 不能让用户修改自己无权管理的角色
- 批量操作需要逐项验证权限

### 2. 数据校验
- 角色名称唯一性校验
- 继承关系循环检测
- 权限有效性验证

### 3. 操作日志
- 记录所有角色权限变更操作
- 记录操作人和操作时间
- 支持操作回滚或审计
