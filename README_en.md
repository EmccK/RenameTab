# Rename Tab

A simple Chrome extension that allows you to rename tabs manually or automatically based on URL rules.

## Features

*   **Manually Rename Tabs:** Enter a new title in the extension popup to change the current tab's title.
*   **Auto Add Host Rule:** When renaming manually, you can choose to automatically add the current website's host to the renaming rules for convenient automatic renaming later.
*   **Rule-Based Automatic Renaming:** Add multiple renaming rules to automatically change tab titles based on URL or host.
*   **Regular Expression Matching:** Use regular expressions in rules for more flexible URL matching, catering to more complex renaming needs.
*   **Rule Management:** Easily add, edit, delete, and view saved renaming rules.
*   **Title Placeholder:** Use the `${title}` placeholder in the new title of a rule to preserve part of the original title. For example, you can change the title to "Reading - ${title}".

## Installation

1. Download or clone this repository to your local machine.
2. In Chrome browser, navigate to `chrome://extensions/`.
3. Enable "Developer mode" (usually in the top right corner).
4. Click "Load unpacked".
5. Select the `RenameTab` folder you cloned or downloaded.

## Usage

### Manually Renaming

1. Click the "Rename Tab" extension icon in the browser toolbar.
2. In the popup window, enter the new title you want to set in the "Manually Rename Tab" section.
3. (Optional) Check the "Auto Add Host Rule" checkbox to save this renaming operation as a new rule.
4. Click the "Rename" button.

### Adding and Managing Renaming Rules

1. Click the "Rename Tab" extension icon in the browser toolbar.
2. In the popup window, in the "Manage Rename Rules" section:
    *   **Rule Name:** Add a descriptive name for your rule (optional).
    *   **Match Type:** Select "Host Match" or "Regex Match".
    *   **URL or Host Pattern:** Enter the URL pattern or host address you want to match.
    *   **New Tab Title:** Enter the new title you want to set. You can use the `${title}` placeholder.
    *   Click the "Add Rule" button to save the rule.
3. Added rules will be displayed in the list below, and you can click the "Edit" button to modify the rule, or click the "Delete" button to remove unwanted rules.
4. After modifying or adding rules, the new rules will be applied automatically. You may need to refresh the page to see the effect.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests if you encounter any problems or have suggestions.

## License

This project is licensed under the [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0).

## Chinese Version

[README.md](README.md)

---

**GitHub Repository:** [https://github.com/EmccK/RenameTab](https://github.com/EmccK/RenameTab)