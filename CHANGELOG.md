# ToyBox Changelog

本文件记录 ToyBox 的所有重要变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，条目按 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 类型归类，使用中文描述。

## [Unreleased]

待首次发布时将本段条目合并入首个版本（`0.1.0`）。

### Added

- 初始化项目脚手架：提供主入口 `toybox`、`json`、`mybatis` 命令骨架与共享工具注册表
- 添加 OpenSpec 规格与首次变更归档，建立规格驱动的工作流

### Docs

- 新增 `AGENTS.md` 贡献者与 AI Agent 指南
- 在 `README.md` 与 `AGENTS.md` 补充 [Raycast 官方开发文档](https://developers.raycast.com/) 链接

### Chore

- 完善仓库基础设施：补充 `src/utils` 与 `src/components` 目录结构说明，并新增 `tmp/` 忽略项
- 将 `tmp/` 目录从版本控制中移除，保留本地草稿区
