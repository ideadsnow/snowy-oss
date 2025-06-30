# 🗂️ Snowy OSS Manager

<div align="center">

![Snowy OSS Manager](https://img.shields.io/badge/Snowy_OSS_Manager-v0.1.0-blue?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-2.x-orange?style=for-the-badge&logo=tauri)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06b6d4?style=for-the-badge&logo=tailwindcss)

**现代化、美观、高性能的 OSS 对象存储管理桌面应用**

</div>

## ✨ 产品介绍

Snowy OSS Manager 是一款基于 Tauri 框架开发的跨平台桌面应用，专为管理各种 S3 兼容的对象存储服务而设计。相比市面上界面老旧的 OSS 管理工具，Snowy 提供了现代化的用户界面和流畅的用户体验。

### 🎯 设计目标

- **🎨 现代化界面**：采用最新的设计语言和组件库
- **⚡ 高性能**：基于 Rust + Tauri 架构，启动快速，内存占用低
- **🔗 广泛兼容**：支持所有 S3 兼容的对象存储服务
- **👥 团队友好**：直观的操作流程，降低学习成本

## 🚀 核心功能

### 📡 多云存储支持
- **AWS S3**：原生支持 Amazon S3
- **阿里云 OSS**：完整支持阿里云对象存储
- **腾讯云 COS**：支持腾讯云对象存储
- **Cloudflare R2**：支持 Cloudflare R2 存储
- **MinIO**：支持私有化部署的 MinIO
- **其他 S3 兼容服务**：支持任何实现 S3 API 的存储服务

### 🔧 配置管理
- **多配置预设**：支持保存多个不同的 OSS 配置
- **快速切换**：一键切换不同的存储服务
- **连接测试**：配置后即时测试连接可用性
- **安全存储**：本地安全存储访问凭证

### 🗃️ Bucket 管理
- **Bucket 列表**：展示所有有权限访问的 Bucket
- **权限识别**：自动识别读写权限
- **快速切换**：点击即可切换不同 Bucket
- **状态指示**：实时显示连接和加载状态

### 📁 文件管理
- **文件夹树形展示**：支持按路径分层展示文件结构
- **面包屑导航**：清晰的路径导航体验
- **文件类型识别**：自动识别并标记文件类型
- **批量操作**：支持多选文件进行批量操作
- **搜索过滤**：快速查找特定文件

### 🖼️ 图片预览
- **即时预览**：支持常见图片格式的即时预览
- **全屏查看**：全屏模式查看高清图片
- **缩放控制**：支持图片缩放和平移
- **旋转功能**：支持图片旋转查看
- **键盘快捷键**：支持键盘快捷键操作

### 📥 文件下载
- **原生下载**：使用系统原生文件保存对话框
- **进度显示**：实时显示下载进度
- **断点续传**：支持大文件断点续传（规划中）
- **批量下载**：支持批量下载多个文件（规划中）

### 🗑️ 文件删除
- **安全删除**：删除前弹窗二次确认
- **批量删除**：支持选择多个文件批量删除
- **权限检查**：自动检查删除权限
- **操作反馈**：删除结果实时反馈

## 🛠️ 技术栈

### 🖥️ 桌面应用框架
- **[Tauri 2.x](https://tauri.app/)**：现代化的桌面应用开发框架
- **[Rust](https://www.rust-lang.org/)**：高性能、内存安全的系统编程语言

### 🎨 前端技术
- **[React 18](https://react.dev/)**：现代化的前端框架
- **[TypeScript 5.6](https://www.typescriptlang.org/)**：类型安全的 JavaScript 超集
- **[Vite](https://vitejs.dev/)**：快速的前端构建工具

### 🎭 UI 组件与样式
- **[TailwindCSS 4.x](https://tailwindcss.com/)**：实用优先的 CSS 框架
- **[shadcn/ui](https://ui.shadcn.com/)**：高质量的 React 组件库
- **[Radix UI](https://www.radix-ui.com/)**：无样式、可访问的 UI 原语
- **[Lucide React](https://lucide.dev/)**：美观一致的图标库

### 📦 状态管理与工具
- **[Zustand](https://github.com/pmndrs/zustand)**：轻量级状态管理
- **[AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/)**：AWS S3 JavaScript SDK
- **[React Router](https://reactrouter.com/)**：声明式路由管理

## 🚀 快速开始

### 📋 系统要求

- **macOS**：macOS 10.15+ (推荐)
- **Windows**：Windows 10+ (支持)
- **Linux**：Ubuntu 18.04+ / 其他主流发行版 (规划中)

### 🔧 开发环境

#### 前置要求
- **Node.js**：18.0+
- **pnpm**：8.0+
- **Rust**：1.70+
- **Tauri CLI**：2.0+

#### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/snowy-oss.git
cd snowy-oss

# 安装前端依赖
pnpm install

# 安装 Tauri CLI (如果尚未安装)
cargo install tauri-cli@^2.0.0
```

#### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 或者使用 Tauri 命令
pnpm tauri dev
```

#### 构建应用

```bash
# 构建生产版本
pnpm build

# 打包桌面应用
pnpm tauri build
```

#### 清理项目

```bash
# 清理构建缓存
pnpm run clean

# 完全清理（包括安装包）
pnpm run clean:full
```

## 📝 使用指南

### 1️⃣ 配置 OSS 连接

1. 启动应用后，点击右上角的"配置"按钮
2. 选择你的 OSS 服务提供商或选择"自定义"
3. 填写必要的连接信息：
   - **Endpoint**：OSS 服务端点地址
   - **Access Key ID**：访问密钥 ID
   - **Secret Access Key**：访问密钥
   - **Region**：存储区域（如适用）
4. 点击"测试连接"验证配置
5. 保存配置

### 2️⃣ 浏览和管理文件

1. 连接成功后，左侧会显示可用的 Bucket 列表
2. 点击 Bucket 名称查看其中的文件
3. 使用文件夹导航浏览不同路径
4. 点击文件可进行预览（图片）或下载

### 3️⃣ 文件操作

- **下载文件**：点击文件的下载按钮，选择保存位置
- **预览图片**：点击图片文件进入全屏预览模式
- **删除文件**：选择文件后点击删除按钮，确认删除
- **批量操作**：按住 Ctrl/Cmd 键多选文件进行批量操作

## 🔒 安全说明

- **本地存储**：所有 OSS 配置信息都存储在本地，不会上传到任何服务器
- **加密存储**：敏感信息（如访问密钥）采用加密方式存储
- **权限最小化**：应用只请求必要的文件访问权限
- **HTTPS 传输**：所有网络请求都通过 HTTPS 加密传输

## 🛣️ 发展路线

### 🎯 近期目标 (v0.2.0)
- [ ] 文件上传功能
- [ ] 断点续传支持
- [ ] 更多文件类型预览
- [ ] 文件夹操作（创建、删除、重命名）

### 🚀 中期目标 (v0.3.0)
- [ ] 多线程下载
- [ ] 同步功能
- [ ] 文件权限管理
- [ ] 批量上传优化

### 🌟 长期目标 (v1.0.0)
- [ ] 插件系统
- [ ] 主题定制
- [ ] 多语言支持
- [ ] 云端配置同步

## 🤝 贡献指南

我们欢迎社区贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献指南。

### 💡 如何贡献

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 优秀的桌面应用开发框架
- [shadcn/ui](https://ui.shadcn.com/) - 高质量的组件库
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- 所有为这个项目做出贡献的开发者们

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by Snowy Team

</div>
