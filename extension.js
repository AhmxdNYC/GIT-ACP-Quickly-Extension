const vscode = require("vscode")
const os = require("os")
const fs = require("fs")
const path = require("path")

function activate(context) {
  console.log(
    'Congratulations, your extension "ACP-GIT-COMMAND" is now ACTIVE!'
  )

  let disposable = vscode.commands.registerCommand(
    "acp-git-commands.installACPCommand",
    async function () {
      const options = [
        ".zshrc (usually for macOS)",
        ".bash (usually for Linux/Windows)",
        "Detect based on system",
      ]
      const selectedOption = await vscode.window.showQuickPick(options, {
        placeHolder: "Select where to install the ACP command",
      })

      if (!selectedOption) {
        vscode.window.showErrorMessage("No option selected")
        return
      }

      let shellConfigFile
      switch (selectedOption) {
        case ".zshrc (usually for macOS)":
          shellConfigFile = ".zshrc"
          break
        case ".bash (usually for Linux/Windows)":
          shellConfigFile =
            os.platform() === "win32" ? ".bash_profile" : ".bashrc"
          break
        case "Detect based on system":
          shellConfigFile =
            os.platform() === "darwin"
              ? ".zshrc"
              : os.platform() === "win32"
              ? ".bash_profile"
              : ".bashrc"
          break
      }

      const acpFunction = `
function acp() {




echo -e "Adding \\e[36mall\\e[0m changes..."
git add -A

# Check if at least one argument is provided
if [ \$# -eq 0 ]; then
echo -e "\\n\\e[31mError: No commit message provided.\\e[0m\\n"
return 1  # Return with error
fi

# Use all arguments as the commit message
commit_message="\$*"
echo -e "Committing \\e[36mwith\\e[0m message: '\$commit_message'"

git commit -m "\$commit_message"
if [[ \$? -eq 0 ]]; then
echo -e "Successfully committed. Pushing \\e[36mto\\e[0m remote..."
git push
if [[ \$? -eq 0 ]]; then
    echo -e "\\n\\e[36mCommit Message:\\e[0m \$commit_message\\n"  # Cyan for "Commit Message:" label only
    echo -e "\\e[32m----> Push Successful <----\\e[0m\\n"
else
    echo -e "\\n\\e[31m----> Push FAILED <----\\e[0m\\n"
fi
else
echo -e "\\n\\e[31m----> Commit FAILED <----\\e[0m\\n"
fi
}
`
      const userHomeDir = os.homedir()
      const shellConfigFilePath = path.join(userHomeDir, shellConfigFile)

      try {
        // Check if the shell configuration file exists
        if (!fs.existsSync(shellConfigFilePath)) {
          vscode.window.showErrorMessage(
            `Could not find ${shellConfigFile} file in your home directory`
          )
          return
        }

        // Append the acp function to the shell configuration file
        fs.appendFileSync(shellConfigFilePath, acpFunction)

        vscode.window.showInformationMessage(
          `ACP Command successfully installed in ${shellConfigFile}`
        )
        vscode.window.showInformationMessage(
          `Please restart your terminal or source your ${shellConfigFile} for changes to take effect.`
        )
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error occurred while installing ACP command: ${error.message}`
        )
      }
    }
  )

  context.subscriptions.push(disposable)
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
