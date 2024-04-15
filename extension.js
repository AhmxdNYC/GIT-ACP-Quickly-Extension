const vscode = require("vscode")
const os = require("os")
const fs = require("fs")
const path = require("path")

function activate(context) {
  console.log(
    'Congratulations, your extension "ACP-GIT-COMMAND" is now ACTIVE!'
  )

  // Automatically attempt to update the ACP command when the extension activates
  autoUpdateAcpCommand()

  let disposable = vscode.commands.registerCommand(
    "acp-git-commands.installACPCommand",
    function () {
      const shellConfigFilePath = getShellConfigFilePath()
      if (shellConfigFilePath) {
        updateAcpCommand(shellConfigFilePath)
      }
    }
  )

  context.subscriptions.push(disposable)
}

// Function to automatically update the ACP command in the user's shell configuration file

function autoUpdateAcpCommand() {
  const shellConfigFilePath = getShellConfigFilePath()
  if (shellConfigFilePath) {
    updateAcpCommand(shellConfigFilePath)
  }
}

// Function to get the shell configuration file path based on the user's operating system

function getShellConfigFilePath() {
  const shellConfigFiles = {
    darwin: ".zshrc", // macOS typically uses Zsh
    linux: ".bashrc", // Linux typically uses Bash
    win32: ".bash_profile", // Windows might use Bash if using Git Bash or similar
  }

  const shellConfigFile = shellConfigFiles[os.platform()]
  return shellConfigFile ? path.join(os.homedir(), shellConfigFile) : null
}

// Function to update the ACP command in the user's shell configuration file

function updateAcpCommand(shellConfigFilePath) {
  const currentVersion = "0.6.0" // The version should be updated in sync with the extension's version in package.json
  const versionRegex = /# ACP Version: (\d+\.\d+\.\d+)/ // Regex to extract the version
  const startMarker = "# BEGIN: ACP Function"
  const endMarker = "# END: ACP Function"
  const newAcpFunction = getNewAcpFunction(currentVersion)

  try {
    let content = fs.readFileSync(shellConfigFilePath, "utf8")
    const existingVersionMatch = content.match(versionRegex)
    const existingVersion = existingVersionMatch
      ? existingVersionMatch[1]
      : null

    if (existingVersion !== currentVersion) {
      let startIndex = content.indexOf(startMarker)
      let endIndex = content.indexOf(endMarker, startIndex + startMarker.length)

      if (startIndex !== -1 && endIndex !== -1) {
        endIndex += endMarker.length // Include the end marker length to remove it entirely
        let beforeFunction = content.substring(0, startIndex)
        let afterFunction = content.substring(endIndex)
        content = beforeFunction + newAcpFunction + afterFunction
      } else {
        content += `\n${newAcpFunction}`
      }
      // Write the updated content back to the shell configuration file

      fs.writeFileSync(shellConfigFilePath, content)
      vscode.window.showInformationMessage(
        `ACP Command automatically updated to version ${currentVersion} in ${shellConfigFilePath}`
      )
    } else {
      console.log("No update needed for ACP Command.")
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error occurred while updating ACP command: ${error.message}`
    )
  }
}

// Function to generate the new ACP function based on the current version

function getNewAcpFunction(version) {
  return `
# BEGIN: ACP Function
# ACP Version: ${version}
function acp() {
  echo -e "Checking repository status..."

  # Check if inside a git repository
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "\\n\\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
    echo "Please navigate to a directory that is part of a Git repository or initialize one with \\x1b[33m'git init'\\x1b[0m.\\n"
    return
  fi

  # Check if in a detached head state
  if ! git symbolic-ref --quiet --short HEAD; then
    echo -e "\\n\\x1b[31mError: Repository is in a detached head state.\\x1b[0m"
    echo "Please check out a branch to make your changes permanent."
    return
  fi
  
  # Fetch the latest changes from the remote

  git fetch origin
  local current_branch=$(git rev-parse --abbrev-ref HEAD)
  
  # Check if the current branch has an upstream set

  if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  echo -e "\n\x1b[31mError: No upstream set for the current branch '$current_branch'.\x1b[0m"
  echo -e "\\nTo push and set the remote as upstream, use:"
  echo -e "\\n\\x1b[33m'git push --set-upstream origin $current_branch'\\x1b[0m\\n"
    return
  fi

  # Check if the local branch is behind, ahead, or diverged from the remote branch

  local local_commit=$(git rev-parse @)
  local remote_commit=$(git rev-parse @{u})
  local base_commit=$(git merge-base @ @{u})

  if [ "$local_commit" = "$remote_commit" ]; then
    echo "Up-to-date with remote. No pull needed."
  elif [ "$local_commit" = "$base_commit" ]; then
    echo -e "\\n\\x1b[31mYour local branch is behind the remote branch.\\x1b[0m\\n"
    echo -e "Pull required before push. Please run: \\x1b[33m'git pull'\\x1b[0m.\\n"
    return
  elif [ "$remote_commit" = "$base_commit" ]; then
    echo "Local commits can be pushed."
  else
    echo -e "\\n\\x1b[33mDiverged from remote. Manual merge required & manual Git commands.\\x1b[0m\\n"
    echo -e "Please run: \\x1b[33m'git pull'\\x1b[0m & \\x1b[33m'git status'\\x1b[0m to see conflicts and resolve them manually.\\n"
    return
  fi

  # Add all changes, commit, and push to the remote

  echo -e "Adding \\x1b[36mall\\x1b[0m changes..."
  git add -A

  if [ $# -eq 0 ]; then
    echo -e "\\n\\x1b[31mError: No commit message provided.\\x1b[0m\\n"
    return 1
  fi

  commit_message="$*"
  echo -e "Committing \\x1b[36mwith\\x1b[0m message: '$commit_message'"
  git commit -m "$commit_message"
  if [[ $? -eq 0 ]]; then
    echo "Successfully committed. Pushing \\x1b[36mto\\x1b[0m remote..."
    git push
    if [[ $? -eq 0 ]]; then
      echo -e "\\n\\x1b[36mCommit Message:\\x1b[0m $commit_message\\n"
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
