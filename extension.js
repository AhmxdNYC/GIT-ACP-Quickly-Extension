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

      const shellConfigFilePath = path.join(os.homedir(), shellConfigFile)
      updateAcpCommand(shellConfigFilePath)
    }
  )

  context.subscriptions.push(disposable)
}

function updateAcpCommand(shellConfigFilePath) {
  const startMarker = "# BEGIN: ACP Function"
  const endMarker = "# END: ACP Function"
  const newAcpFunction = getNewAcpFunction()

  try {
    let content = fs.readFileSync(shellConfigFilePath, "utf8")
    let startIndex = content.indexOf(startMarker)
    let endIndex = content.indexOf(endMarker)

    if (startIndex !== -1 && endIndex !== -1) {
      endIndex += endMarker.length // Include the end marker length to remove it entirely
      let beforeFunction = content.substring(0, startIndex)
      let afterFunction = content.substring(endIndex)
      content = beforeFunction + newAcpFunction + afterFunction
    } else {
      content += `\n${newAcpFunction}`
    }

    fs.writeFileSync(shellConfigFilePath, content)
    vscode.window.showInformationMessage(
      `ACP Command successfully updated in ${shellConfigFilePath}`
    )
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error occurred while updating ACP command: ${error.message}`
    )
  }
}

function getNewAcpFunction() {
  return `
# BEGIN: ACP Function
function acp() {
  echo -e "Checking repository status..."

  if ! git symbolic-ref --quiet --short HEAD; then
    echo -e "\\n\\x1b[31mError: Repository is in a detached head state.\\x1b[0m"
    echo "Please check out a branch to make your changes permanent."
    return
  fi

  git fetch origin
  local current_branch=\$(git rev-parse --abbrev-ref HEAD)

  if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
    echo -e "\\n\\x1b[31mError: No upstream set for the current branch '\$current_branch'.\\x1b[0m"
    echo -e "To push and set the remote as upstream, use:\\n\\x1b[33m'git push --set-upstream origin \$current_branch'\\x1b[0m\\n"
    return
  fi

  local local_commit=\$(git rev-parse @)
  local remote_commit=\$(git rev-parse @{u})
  local base_commit=\$(git merge-base @ @{u})

  if [ "\$local_commit" = "\$remote_commit" ]; then
    echo "Up-to-date with remote. No pull needed."
  elif [ "\$local_commit" = "\$base_commit" ]; then
    echo -e "\\n\\x1b[31mYour local branch is behind the remote branch.\\x1b[0m"
    echo -e "Pull required before push. Please run: \\x1b[33m'git pull'\\x1b[0m.\\n"
    return
  elif [ "\$remote_commit" = "\$base_commit" ]; then
    echo "Local commits can be pushed."
  else
    echo -e "\\n\\x1b[33mDiverged from remote. Manual merge required & manual Git commands.\\x1b[0m\\n"
    echo -e "Please run: \\x1b[33m'git pull'\\x1b[0m & \\x1b[33m'git status'\\x1b[0m to see conflicts and resolve them manually.\\n"
    return
  fi

  echo -e "Adding \\x1b[36mall\\x1b[0m changes..."
  git add -A

  if [ $# -eq 0 ]; then
    echo -e "\\n\\x1b[31mError: No commit message provided.\\x1b[0m\\n"
    return 1
  fi

  commit_message="\$*"
  echo -e "Committing \\x1b[36mwith\\x1b[0m message: '\$commit_message'"
  git commit -m "\$commit_message"
  if [[ \$? -eq 0 ]]; then
    echo "Successfully committed. Pushing \\x1b[36mto\\x1b[0m remote..."
    git push
    if [[ \$? -eq 0 ]]; then
      echo -e "\\n\\x1b[36mCommit Message: \$commit_message\\x1b[0m\\n"
      echo -e "\\x1b[32m----> Push Successful <----\\x1b[0m\\n"
    else
      echo -e "\\n\\x1b[31m----> Push FAILED <----\\x1b[0m\\n"
    fi
  else
    echo -e "\\n\\x1b[31m----> Commit FAILED <----\\x1b[0m\\n"
  fi
}
# END: ACP Function
`
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
