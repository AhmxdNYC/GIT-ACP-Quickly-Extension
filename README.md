# ACP Quickly: Git Add, Commit & Push with a Single Command. No ""

[Extension Link](https://marketplace.visualstudio.com/items?itemName=AhmadNYC.acp-git-commands)

This extension streamlines the git workflow by enabling you to add, commit, and push changes with a single command, without the need for quotation marks.

- **Successful Push**

  ![Successful Push](./images/SuccesfulPush.gif)

## Features

- **Efficient Git Operations**: Execute a single command to add all changes, commit them with your specified message, and push to a remote repository—all directly from the editor.
- **Customizable Commit Messages**: Input commit messages directly within the command, facilitating rapid updates and meaningful commit logs.
- **Broad Shell Compatibility**: Works seamlessly across bash, zsh, and Windows Command Line, ensuring reliable functionality no matter your development environment.

## Example Usage

Visual demonstrations of the extension in action:

- **Successful Push Above**

- **Commit Failed / Push Failed**

  ![Commit Failed](./images/CommitFailed.gif)

- **No Repository Found**

  ![No Repo](./images/NoRepo.png)

## Installation

1. **Install the Extension**: Download and install the extension from the Visual Studio Code Marketplace.
2. **Activate the Command**: Use the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) and type:
   - `Install ACP Command`: You will be prompted to enter a commit message. Your changes will then be committed and pushed to the configured remote repository.
3. **Restart Your Terminal**: To ensure the changes take effect, restart or refresh your terminal.

[Watch a 30-second tutorial on how to use ACP Quickly](https://www.youtube.com/watch?v=2lgWcGbtaz4)

## Usage Warning

- **Special Characters**: The `acp` command supports commit messages without quotation marks for simple texts. For including special characters (e.g., `!#^@&^@$@()&*&(!!!>:<{|}>`), you will still need to encapsulate the message in quotes like this:

- acp " !#^@&^@$@()&\*&(!!!>:<{|}> "

## Requirements

No additional requirements are needed for this extension, as it uses your existing git setup. Just restart or terminate your terminals after installation.

## Extension Settings

This extension does not require specific settings for basic operation but depends on your existing git configuration.

To fully remove the extension, go into the config (zshrc or bash) file and delete the code for the acp function.

## Known Issues

No known issues at this time. Please contact me with any issues you are experiencing.

## Release Notes

### 0.1.6

- Initial release of "ACP Quickly Git Add, Commit & Push with a Single Command!"

## For more information

- [My Github](https://github.com/AhmxdNYC)
- [My Linkedin](https://www.linkedin.com/in/ahmad-hamza-/)

**Enjoy using ACP Quickly! This tool is designed to make your coding and version control process smoother and faster.**
- trying to cause conflict !!!!!!!!!
# GIT-ACP-Shortcut-Extension
