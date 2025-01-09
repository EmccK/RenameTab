# Rename Tab

一个简单的 Chrome 扩展，允许你手动或根据 URL 规则重命名标签页。

## 功能特性

*   **手动重命名标签页:**  在扩展的弹出窗口中输入新的标题，即可更改当前标签页的标题。
*   **自动添加 Host 规则:**  在手动重命名时，可以选择自动将当前网站的 Host 添加到重命名规则中，方便后续自动重命名。
*   **基于规则的自动重命名:**  可以添加多个重命名规则，根据标签页的 URL 或 Host 自动更改标题。
*   **支持正则表达式匹配:**  在规则中使用正则表达式来更灵活地匹配 URL，满足更复杂的重命名需求。
*   **规则管理:**  方便地添加、编辑、删除和查看已保存的重命名规则。
*   **标题占位符:**  在规则的新标题中使用 `${title}` 占位符来保留原始标题的一部分，例如可以将标题修改为 "阅读 - ${title}"。

## 安装

1. 下载或克隆此仓库到本地。
2. 在 Chrome 浏览器中访问 `chrome://extensions/`。
3. 开启 “开发者模式”（通常在页面右上角）。
4. 点击 “加载已解压的扩展程序”。
5. 选择你克隆或下载的 `RenameTab` 文件夹。

## 使用方法

### 手动重命名

1. 点击浏览器工具栏上的 “Rename Tab” 扩展图标。
2. 在弹出的窗口中，于 “手动重命名标签页” 部分输入你想要设置的新标题。
3. （可选）勾选 “自动添加 Host 规则” 复选框，以便将此重命名操作保存为一个新的规则。
4. 点击 “重命名” 按钮。

### 添加和管理重命名规则

1. 点击浏览器工具栏上的 “Rename Tab” 扩展图标。
2. 在弹出的窗口中，于 “管理重命名规则” 部分：
    *   **规则名称:**  为你的规则添加一个描述性的名称（可选）。
    *   **匹配类型:**  选择 “Host 匹配” 或 “正则表达式匹配”。
    *   **URL 或 Host 模式:**  输入你要匹配的 URL 模式或 Host 地址。
    *   **新的标签页标题:**  输入你想要设置的新标题。可以使用 `${title}` 占位符。
    *   点击 “添加规则” 按钮来保存规则。
3. 已添加的规则会显示在下方的列表中，你可以点击 “编辑” 按钮来修改规则，或点击 “删除” 按钮来移除不需要的规则。
4. 修改或添加规则后，新规则会自动应用，你可能需要刷新页面来观察效果。

## 贡献

欢迎提交 issue 和 pull request! 如果你在使用过程中遇到任何问题或有任何建议，请随时提出。

## 许可证

本项目使用 [GPL-3.0 许可证](https://www.gnu.org/licenses/gpl-3.0).

## English Version

[README_en.md](README_en.md)

---

**GitHub 仓库地址:** [https://github.com/EmccK/RenameTab](https://github.com/EmccK/RenameTab)