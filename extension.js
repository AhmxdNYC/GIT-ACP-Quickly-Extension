const vscode = require("vscode")
const os = require("os")
const fs = require("fs")
const path = require("path")

const VERSION = "0.9.0"

function activate(context) {
  console.log(
    'Congratulations, your extension "ACP-GIT-COMMAND" is now ACTIVE!'
  )
  let gitStatusIndicator = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  )
  gitStatusIndicator.text = `$(sync~spin) Initializing...`
  gitStatusIndicator.show()
  context.subscriptions.push(gitStatusIndicator)
  const acpCommandDisposable = vscode.commands.registerCommand(
    "extension.acpCommand",
    openTerminalAndRunAcp
  )
  updateGitStatus(gitStatusIndicator) // Initial update
  const gitWatcher = vscode.workspace.createFileSystemWatcher(
    "**/.git/{HEAD,refs/heads/*,refs/remotes/*,index}"
  )
  gitWatcher.onDidChange(() => updateGitStatus(gitStatusIndicator))
  context.subscriptions.push(gitWatcher)
  setupFetchInterval(gitStatusIndicator, context) // Periodic updates

  context.subscriptions.push(
    vscode.commands.registerCommand("acp-git-commands.installACPCommand", () =>
      updateGitStatus(gitStatusIndicator)
    ),
    vscode.window.onDidChangeActiveTextEditor(() =>
      updateGitStatus(gitStatusIndicator)
    ),
    vscode.window.onDidChangeWindowState((state) => {
      if (state.focused) updateGitStatus(gitStatusIndicator)
    })
  )
  const shellConfigFilePath = getShellConfigFilePath()
  if (shellConfigFilePath) {
    const wasUpdated = autoUpdateAcpCommand(shellConfigFilePath)
    if (wasUpdated) {
      return `ACP command was successfully updated.`
    }
  } else {
    createInstructionFile()
    vscode.window.showWarningMessage(
      "No shell configuration file found. Instructions file created on desktop."
    )
  }

  let disposable = vscode.commands.registerCommand(
    "acp-git-commands.installACPCommand",
    function () {
      const shellConfigFilePath = getShellConfigFilePath()
      if (shellConfigFilePath) {
        const wasUpdated = autoUpdateAcpCommand(shellConfigFilePath)
        if (wasUpdated) {
          vscode.window.showInformationMessage(
            "ACP command was successfully updated."
          )
        }
      } else {
        vscode.window.showWarningMessage(
          "No shell configuration file found. Please check the instructions on your desktop."
        )
      }
      updateGitStatus(gitStatusIndicator)
    }
  )

  context.subscriptions.push(disposable)
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      updateGitStatus(gitStatusIndicator)
    })
  )
  console.log("acp run command before push")

  context.subscriptions.push(acpCommandDisposable)
  console.log("acp run command pushed")
}

function openTerminalAndRunAcp() {
  console.log("Preparing to send 'acp' command...")

  // Check if there is an active terminal
  let currentTerminal = vscode.window.activeTerminal

  if (!currentTerminal) {
    // If no active terminal, create a new one with the name of the current workspace
    const workspaceName = vscode.workspace.name || "Default Workspace"
    currentTerminal = vscode.window.createTerminal({ name: workspaceName })
  }

  // Show the terminal window
  currentTerminal.show()

  // Delay the sendText to allow the terminal to initialize properly if it was newly created
  setTimeout(() => {
    currentTerminal.sendText("acp ", false) // This places 'acp' in the command line without executing it
  }, 230) // Adjust the delay as needed based on your environment
}

function setupFetchInterval(gitStatusIndicator, context) {
  const fetchInterval = 300000 // 5 minutes
  const intervalId = setInterval(
    () => updateGitStatus(gitStatusIndicator),
    fetchInterval
  )

  // Create a disposable from the intervalId and add it to the context.subscriptions array
  const disposable = {
    dispose: () => clearInterval(intervalId),
  }

  if (context.subscriptions) {
    context.subscriptions.push(disposable)
  } else {
    console.error("context.subscriptions is undefined")
  }
}

function updateGitStatus(gitStatusIndicator) {
  const repoPath =
    vscode.workspace.rootPath ||
    vscode.workspace.workspaceFolders?.[0].uri.fsPath
  if (!repoPath || !fs.existsSync(path.join(repoPath, ".git"))) {
    gitStatusIndicator.text = `$(issue-opened) No Repo`
    gitStatusIndicator.show()
    return
  }

  require("child_process").exec(
    "git fetch && git status -sb",
    { cwd: repoPath },
    (err, stdout) => {
      if (err) {
        gitStatusIndicator.text = `$(alert) Failed to fetch Git status`
        console.error("Error fetching Git status:", err)
      } else {
        parseGitStatus(stdout, gitStatusIndicator)
      }
    }
  )
}
function parseGitStatus(stdout, gitStatusIndicator) {
  const status = stdout.trim()
  console.log("Git status output:", status) // Log output for debugging

  // Diverged check: often involves both 'ahead' and 'behind' text in the output
  if (
    status.includes("diverged") ||
    (status.includes("ahead") && status.includes("behind"))
  ) {
    gitStatusIndicator.text = `$(git-merge) Diverged`
    gitStatusIndicator.color = "#ff6348" // Tomato color for diverged status
    gitStatusIndicator.tooltip =
      "Your branch has diverged from the remote branch. Click for details."
  }
  // Specific checks for ahead or behind without being diverged
  else if (status.includes("[ahead") && !status.includes("behind")) {
    gitStatusIndicator.text = `$(arrow-up) Ahead`
    gitStatusIndicator.color = "#ffa502" // Orange color for ahead status
    gitStatusIndicator.tooltip =
      "Your branch is ahead of the remote branch. Click to push changes."
  } else if (status.includes("[behind") && !status.includes("ahead")) {
    gitStatusIndicator.text = `$(arrow-down) Behind`
    gitStatusIndicator.color = "#ff4757" // Red color for behind status
    gitStatusIndicator.tooltip =
      "Your branch is behind the remote branch. Click to pull changes."
  } else {
    gitStatusIndicator.text = `$(check) Up-to-date`
    gitStatusIndicator.color = "#2ed573" // Green color for up-to-date status
    gitStatusIndicator.tooltip =
      "Your branch is up-to-date with the remote branch."
  }
}

function getShellConfigFilePath() {
  const shell = process.env.SHELL || "/bin/bash"
  const shellName = path.basename(shell)
  let configFile

  switch (shellName) {
    case "bash":
      configFile = ".bash_profile"
      break
    case "zsh":
      configFile = ".zshrc"
      break
    default:
      console.log(`Unsupported shell: ${shellName}`)
      return
  }

  const configPath = path.join(os.homedir(), configFile)

  if (!fs.existsSync(configPath)) {
    console.log(
      `${configFile} not found. Creating and initializing with ACP function.`
    )
    fs.writeFileSync(configPath, getNewAcpFunction(VERSION)) // Make sure to use the current version
    vscode.window.showInformationMessage(
      `${configFile} created and initialized with ACP function. To check it out run \`code ${configPath}\` in the terminal.`
    )
  }

  return configPath
}

function autoUpdateAcpCommand(shellConfigFilePath) {
  if (shellConfigFilePath && fs.existsSync(shellConfigFilePath)) {
    return updateAcpCommand(shellConfigFilePath, false)
  } else {
    console.log(
      "Unable to find shell config file for updating:",
      shellConfigFilePath
    )
    return false
  }
}

function createInstructionFile() {
  const acpFunctionCode = getNewAcpFunction(VERSION) // Ensure this matches the current version
  const instructions = `
Please manually add the following script to your shell configuration file (e.g., .bashrc, .bash_profile, .zshrc):
${acpFunctionCode}
Save the file and source it to apply the changes, e.g., \`source ~/.bashrc\`
`
  vscode.workspace
    .openTextDocument({ content: instructions, language: "markdown" })
    .then((document) =>
      vscode.window.showTextDocument(document, { preview: false })
    )
  console.log("Instructions opened in a new VS Code editor tab.")
}

function updateAcpCommand(shellConfigFilePath, forceUpdate) {
  try {
    let content = fs.readFileSync(shellConfigFilePath, "utf8")
    const versionRegex = /# ACP Version: (\d+\.\d+\.\d+)/
    const existingVersionMatch = content.match(versionRegex)
    const existingVersion = existingVersionMatch
      ? existingVersionMatch[1]
      : "none"

    const newAcpFunction = getNewAcpFunction(VERSION).trim() + "\n" // Ensure there is exactly one newline after the block

    if (existingVersion !== VERSION || forceUpdate) {
      const startMarker = "# BEGIN: ACP Function"
      const endMarker = "# END: ACP Function"
      let startIndex = content.indexOf(startMarker)
      let endIndex = content.indexOf(endMarker, startIndex)

      if (startIndex !== -1 && endIndex !== -1) {
        endIndex += endMarker.length
        // Managing newlines around the ACP block to avoid additional spaces
        while (content[startIndex - 1] === "\n" && startIndex > 0) {
          startIndex-- // Move back to remove extra newlines
        }
        if (content[endIndex] === "\n") {
          endIndex++ // Move forward to remove the newline following the end marker
        }
        content =
          content.substring(0, startIndex) +
          newAcpFunction +
          content.substring(endIndex)
      } else {
        // Ensure no multiple newlines at the end before appending
        content = content.trim() + "\n" + newAcpFunction
      }

      fs.writeFileSync(shellConfigFilePath, content)
      // vscode.window.showInformationMessage(
      //   `ACP command updated to version ${VERSION} in ${shellConfigFilePath}. To check it out run \`code ${shellConfigFilePath}\` in the terminal.`
      // )
      const activeTerminal = vscode.window.activeTerminal
      if (activeTerminal) {
        const terminalName = activeTerminal.name
        activeTerminal.dispose()
        const newTerminal = vscode.window.createTerminal({ name: terminalName })
        newTerminal.show()
      }
    } else {
      console.log("No update needed or force update not set.")
    }
  } catch (error) {
    console.error("Error occurred while updating ACP command:", error)
    vscode.window.showErrorMessage(
      `Error occurred while updating ACP command: ${error.message}`
    )
    return false // Indicate failure
  }
  return true // Indicate success
}

function getNewAcpFunction(version) {
  return `
    # BEGIN: ACP Function - Git Add, Commit, Push - ACP Version: ${version} - DO NOT MODIFY THIS BLOCK MANUALLY # 
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
    
    function acm() {
      # Check if inside a Git repository
      if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo -e "\\n\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
        return
      fi
    
      echo -e "Preparing \\x1b[36mto\\x1b[0m add \\x1b[36mall\\x1b[0m changes and commit..."
    
      # First, check if a commit message was provided
      if [ "$#" -eq 0 ]; then
        echo -e "\\n\x1b[31mError: No commit message provided.\\x1b[0m\\n"
        return 1
      fi
    
      local commit_message="$*"
    
    
      # Check if the HEAD is detached or the branch is valid
      local current_branch=$(git symbolic-ref --quiet --short HEAD)
      if [ -z "$current_branch" ]; then
        echo -e "\\n\x1b[31mError: Repository is in a detached head state or the branch is not valid.\\x1b[0m"
        echo "Please check out a branch to make your changes permanent.\\n"
        return
      fi
    
      # Add all changes
      git add -A
      echo -e "\\x1b[36mAll\\x1b[0m changes added."
    
      # Commit changes
      echo -e "Committing with message: $commit_message"
      git commit -m "$commit_message"
      if [[ $? -eq 0 ]]; then
        echo -e "\\n\\x1b[36mCommit Message:\\x1b[0m $commit_message\\n"
        echo -e "\\x1b[32m----> Commit Successful <----\\x1b[0m\\n"
      else
        echo -e "\\n\x1b[31m----> Commit FAILED <----\\x1b[0m\\n"
      fi
    }
    
    function add() {
    
      # First, check if inside a Git repository
      if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo -e "\\n\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
      return
      fi
    
      echo -e "\\nPreparing \\x1b[36mto\\x1b[0m add changes."
    
      # Check if the HEAD is detached or the branch is valid
      local current_branch=$(git symbolic-ref --quiet --short HEAD)
      if [ -z "$current_branch" ]; then
          echo -e "\\n\x1b[31mError: Repository is in a detached head state or the branch is not valid.\\x1b[0m"
          echo "Please check out a branch to make your changes permanent.\\n"
          return
      fi
    
      # Determine what to add based on the argument provided
      if [ "$#" -eq 0 ]; then
          echo "No specific files provided. Adding \\x1b[36mall\\x1b[0m changes...\\n"
          git add -A
      else
          echo "Adding specified files...\\n"
          git add "$@"
      fi
    
      # Confirm what has been staged
      git status --short
      echo -e "\\n\x1b[32mFiles have been staged. Use \\x1b[33m'cm <message>'\\x1b[0m to commit these changes.\\x1b[0m\\n"
      echo -e "\\n\x1b[32mGreen = Ready for commit\\x1b[0m, \\x1b[31mRed = Not staged for commit\\x1b[0m\\n"
    }
    
    function cm () {
      # First, check if inside a Git repository
      if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo -e "\\n\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
      return
      fi
    
      # Check if a commit message was provided
      if [ "$#" -eq 0 ]; then
      echo -e "\\n\x1b[31mError: No commit message provided.\\x1b[0m\\n"
      return
      fi
    
      local commit_message="$*"
    
      # Check if the HEAD is detached or the branch is valid
      local current_branch=$(git symbolic-ref --quiet --short HEAD)
      if [ -z "$current_branch" ]; then
      echo -e "\\n\x1b[31mError: Repository is in a detached head state or the branch is not valid.\\x1b[0m"
      echo "Please check out a branch to make your changes permanent.\\n"
      return
      fi
    
      # Commit changes
      echo -e "Committing with message: $commit_message"
      git commit -m "$commit_message"
      if [[ $? -eq 0 ]]; then
      echo -e "\\n\x1b[36mCommit Message:\\x1b[0m $commit_message\\n"
      echo -e "\\x1b[32m----> Commit Successful <----\\x1b[0m\\n"
      else
      echo -e "\\n\x1b[31m----> Commit FAILED <----\\x1b[0m\\n"
      fi
    }
    
    function cm() {
      # First, check if inside a Git repository
      if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo -e "\\n\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
        return
      fi
    
      # Check if a commit message was provided
      if [ "$#" -eq 0 ]; then
        echo -e "\\n\x1b[31mError: No commit message provided.\\x1b[0m\\n"
        return 1
      fi
    
      local commit_message="$*"
    
      # Check if the HEAD is detached or the branch is valid
      local current_branch=$(git symbolic-ref --quiet --short HEAD)
      if [ -z "$current_branch" ]; then
        echo -e "\\n\x1b[31mError: Repository is in a detached head state or the branch is not valid.\\x1b[0m"
        echo "Please check out a branch to make your changes permanent.\\n"
        return
      fi
    
      # Commit changes
      echo -e "Committing with message: $commit_message"
      git commit -m "$commit_message"
      if [[ $? -eq 0 ]]; then
        echo -e "\\n\x1b[36mCommit Message:\\x1b[0m $commit_message\\n"
        echo -e "\\x1b[32m----> Commit Successful <----\\x1b[0m\\n"
      else
        echo -e "\\n\x1b[31m----> Commit FAILED <----\\x1b[0m\\n"
      fi
    }
    # END: ACP Function 
    `
}

function deactivate() {
  const shellConfigFilePath = getShellConfigFilePath()
  if (shellConfigFilePath && fs.existsSync(shellConfigFilePath)) {
    removeAcpCommand(shellConfigFilePath)
  }
}

function removeAcpCommand(shellConfigFilePath) {
  try {
    let content = fs.readFileSync(shellConfigFilePath, "utf8")
    const startMarker = "# BEGIN: ACP Function"
    const endMarker = "# END: ACP Function"
    const startIndex = content.indexOf(startMarker)
    const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length

    if (startIndex !== -1 && endIndex !== -1) {
      // Remove the ACP function block
      content = content.substring(0, startIndex) + content.substring(endIndex)
      // Remove any extra newlines that may create gaps in the config file
      content = content.replace(/\n{2,}/g, "\n")
      fs.writeFileSync(shellConfigFilePath, content)
      console.log("ACP function removed from the shell config file.")
    }
  } catch (error) {
    console.error("Failed to remove ACP function:", error)
  }
}

module.exports = {
  activate,
  deactivate,
}

// two version of extension
// quickly : acp-git-commands
// enhanced : git-acp-enhanced
// {
//   "name": "acp-git-commands",
//   "displayName": "Git ACP Quickly Add, Commit & Push",
//   "publisher": "AhmadNYC",
//
// Git ACP Enhanced: Add, Commit, Push   // second display name
