export type ShellType = 'bash' | 'zsh' | 'fish';

export function getShellFunctionScript(version: string, shell: ShellType): string {
	if (shell === 'fish') {
		return getFishFunctionScript(version);
	}
	return getBashZshFunctionScript(version);
}

function getBashZshFunctionScript(version: string): string {
	return `
# BEGIN: ACP Function - Git Add, Commit, Push - ACP Version: ${version} - DO NOT MODIFY THIS BLOCK MANUALLY #
# ACP Version: ${version}
function acp() {
  echo -e "Checking repository status..."

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "\\n\\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
    echo "Please navigate to a Git repository or initialize one with \\x1b[33m'git init'\\x1b[0m.\\n"
    return 1
  fi

  if ! git symbolic-ref --quiet --short HEAD; then
    echo -e "\\n\\x1b[31mError: Repository is in a detached HEAD state.\\x1b[0m"
    echo "Please check out a branch to make your changes permanent."
    return 1
  fi

  git fetch origin
  local current_branch=$(git rev-parse --abbrev-ref HEAD)

  if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
    echo -e "\\n\\x1b[31mError: No upstream set for branch '$current_branch'.\\x1b[0m"
    echo -e "\\nSet upstream with: \\x1b[33m'git push --set-upstream origin $current_branch'\\x1b[0m\\n"
    return 1
  fi

  local local_commit=$(git rev-parse @)
  local remote_commit=$(git rev-parse @{u})
  local base_commit=$(git merge-base @ @{u})

  if [ "$local_commit" = "$remote_commit" ]; then
    echo "Up-to-date with remote. No pull needed."
  elif [ "$local_commit" = "$base_commit" ]; then
    echo -e "\\n\\x1b[31mYour local branch is behind the remote.\\x1b[0m\\n"
    echo -e "Run \\x1b[33m'git pull'\\x1b[0m before pushing.\\n"
    return 1
  elif [ "$remote_commit" = "$base_commit" ]; then
    echo "Local commits can be pushed."
  else
    echo -e "\\n\\x1b[33mDiverged from remote. Manual merge required.\\x1b[0m\\n"
    echo -e "Run \\x1b[33m'git pull'\\x1b[0m and resolve conflicts.\\n"
    return 1
  fi

  if [ $# -eq 0 ]; then
    echo -e "\\n\\x1b[31mError: No commit message provided.\\x1b[0m\\n"
    return 1
  fi

  echo -e "Adding \\x1b[36mall\\x1b[0m changes..."
  git add -A

  local commit_message="$*"
  echo -e "Committing with message: '$commit_message'"
  git commit -m "$commit_message"
  if [ $? -eq 0 ]; then
    echo "Successfully committed. Pushing to remote..."
    git push
    if [ $? -eq 0 ]; then
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
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "\\n\\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
    return 1
  fi

  if [ "$#" -eq 0 ]; then
    echo -e "\\n\\x1b[31mError: No commit message provided.\\x1b[0m\\n"
    return 1
  fi

  local current_branch=$(git symbolic-ref --quiet --short HEAD)
  if [ -z "$current_branch" ]; then
    echo -e "\\n\\x1b[31mError: Repository is in a detached HEAD state.\\x1b[0m"
    echo "Please check out a branch to make your changes permanent."
    return 1
  fi

  local commit_message="$*"
  echo -e "Preparing to add all changes and commit..."

  git add -A
  echo -e "\\x1b[36mAll\\x1b[0m changes added."

  echo -e "Committing with message: $commit_message"
  git commit -m "$commit_message"
  if [ $? -eq 0 ]; then
    echo -e "\\n\\x1b[36mCommit Message:\\x1b[0m $commit_message\\n"
    echo -e "\\x1b[32m----> Commit Successful <----\\x1b[0m\\n"
  else
    echo -e "\\n\\x1b[31m----> Commit FAILED <----\\x1b[0m\\n"
  fi
}

function add() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "\\n\\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
    return 1
  fi

  local current_branch=$(git symbolic-ref --quiet --short HEAD)
  if [ -z "$current_branch" ]; then
    echo -e "\\n\\x1b[31mError: Repository is in a detached HEAD state.\\x1b[0m"
    return 1
  fi

  echo -e "\\nPreparing to add changes."

  if [ "$#" -eq 0 ]; then
    echo "No specific files provided. Adding all changes..."
    git add -A
  else
    echo "Adding specified files..."
    git add "$@"
  fi

  git status --short
  echo -e "\\n\\x1b[32mFiles staged. Use \\x1b[33m'cm <message>'\\x1b[0m to commit.\\x1b[0m\\n"
  echo -e "\\x1b[32mGreen = Ready for commit\\x1b[0m, \\x1b[31mRed = Not staged\\x1b[0m\\n"
}

function cm() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "\\n\\x1b[31mError: Not inside a Git repository.\\x1b[0m\\n"
    return 1
  fi

  if [ "$#" -eq 0 ]; then
    echo -e "\\n\\x1b[31mError: No commit message provided.\\x1b[0m\\n"
    return 1
  fi

  local current_branch=$(git symbolic-ref --quiet --short HEAD)
  if [ -z "$current_branch" ]; then
    echo -e "\\n\\x1b[31mError: Repository is in a detached HEAD state.\\x1b[0m"
    return 1
  fi

  local commit_message="$*"
  echo -e "Committing with message: $commit_message"
  git commit -m "$commit_message"
  if [ $? -eq 0 ]; then
    echo -e "\\n\\x1b[36mCommit Message:\\x1b[0m $commit_message\\n"
    echo -e "\\x1b[32m----> Commit Successful <----\\x1b[0m\\n"
  else
    echo -e "\\n\\x1b[31m----> Commit FAILED <----\\x1b[0m\\n"
  fi
}
# END: ACP Function
`;
}

function getFishFunctionScript(version: string): string {
	return `
# BEGIN: ACP Function - Git Add, Commit, Push - ACP Version: ${version} - DO NOT MODIFY THIS BLOCK MANUALLY #
# ACP Version: ${version}

function acp
    echo "Checking repository status..."

    if not git rev-parse --is-inside-work-tree >/dev/null 2>&1
        echo (set_color red)"Error: Not inside a Git repository."(set_color normal)
        echo "Navigate to a Git repository or run "(set_color yellow)"'git init'"(set_color normal)"."
        return 1
    end

    if not git symbolic-ref --quiet --short HEAD >/dev/null 2>&1
        echo (set_color red)"Error: Repository is in a detached HEAD state."(set_color normal)
        echo "Check out a branch to make your changes permanent."
        return 1
    end

    git fetch origin
    set -l current_branch (git rev-parse --abbrev-ref HEAD)

    if not git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1
        echo (set_color red)"Error: No upstream set for branch '$current_branch'."(set_color normal)
        echo "Set upstream with: "(set_color yellow)"'git push --set-upstream origin $current_branch'"(set_color normal)
        return 1
    end

    set -l local_commit (git rev-parse @)
    set -l remote_commit (git rev-parse '@{u}')
    set -l base_commit (git merge-base @ '@{u}')

    if test "$local_commit" = "$remote_commit"
        echo "Up-to-date with remote. No pull needed."
    else if test "$local_commit" = "$base_commit"
        echo (set_color red)"Your local branch is behind the remote."(set_color normal)
        echo "Run "(set_color yellow)"'git pull'"(set_color normal)" before pushing."
        return 1
    else if test "$remote_commit" = "$base_commit"
        echo "Local commits can be pushed."
    else
        echo (set_color yellow)"Diverged from remote. Manual merge required."(set_color normal)
        echo "Run "(set_color yellow)"'git pull'"(set_color normal)" and resolve conflicts."
        return 1
    end

    if test (count $argv) -eq 0
        echo (set_color red)"Error: No commit message provided."(set_color normal)
        return 1
    end

    echo "Adding all changes..."
    git add -A

    set -l commit_message (string join ' ' $argv)
    echo "Committing with message: '$commit_message'"
    if git commit -m "$commit_message"
        echo "Successfully committed. Pushing to remote..."
        if git push
            echo (set_color cyan)"Commit Message:"(set_color normal)" $commit_message"
            echo (set_color green)"----> Push Successful <----"(set_color normal)
        else
            echo (set_color red)"----> Push FAILED <----"(set_color normal)
        end
    else
        echo (set_color red)"----> Commit FAILED <----"(set_color normal)
    end
end

function acm
    if not git rev-parse --is-inside-work-tree >/dev/null 2>&1
        echo (set_color red)"Error: Not inside a Git repository."(set_color normal)
        return 1
    end

    if test (count $argv) -eq 0
        echo (set_color red)"Error: No commit message provided."(set_color normal)
        return 1
    end

    set -l current_branch (git symbolic-ref --quiet --short HEAD)
    if test -z "$current_branch"
        echo (set_color red)"Error: Repository is in a detached HEAD state."(set_color normal)
        return 1
    end

    set -l commit_message (string join ' ' $argv)
    echo "Preparing to add all changes and commit..."

    git add -A
    echo (set_color cyan)"All"(set_color normal)" changes added."

    echo "Committing with message: $commit_message"
    if git commit -m "$commit_message"
        echo (set_color cyan)"Commit Message:"(set_color normal)" $commit_message"
        echo (set_color green)"----> Commit Successful <----"(set_color normal)
    else
        echo (set_color red)"----> Commit FAILED <----"(set_color normal)
    end
end

function add
    if not git rev-parse --is-inside-work-tree >/dev/null 2>&1
        echo (set_color red)"Error: Not inside a Git repository."(set_color normal)
        return 1
    end

    set -l current_branch (git symbolic-ref --quiet --short HEAD)
    if test -z "$current_branch"
        echo (set_color red)"Error: Repository is in a detached HEAD state."(set_color normal)
        return 1
    end

    echo "Preparing to add changes."

    if test (count $argv) -eq 0
        echo "No files specified. Adding all changes..."
        git add -A
    else
        echo "Adding specified files..."
        git add $argv
    end

    git status --short
    echo (set_color green)"Files staged. Use "(set_color yellow)"'cm <message>'"(set_color green)" to commit."(set_color normal)
    echo (set_color green)"Green = Ready for commit"(set_color normal)", "(set_color red)"Red = Not staged"(set_color normal)
end

function cm
    if not git rev-parse --is-inside-work-tree >/dev/null 2>&1
        echo (set_color red)"Error: Not inside a Git repository."(set_color normal)
        return 1
    end

    if test (count $argv) -eq 0
        echo (set_color red)"Error: No commit message provided."(set_color normal)
        return 1
    end

    set -l current_branch (git symbolic-ref --quiet --short HEAD)
    if test -z "$current_branch"
        echo (set_color red)"Error: Repository is in a detached HEAD state."(set_color normal)
        return 1
    end

    set -l commit_message (string join ' ' $argv)
    echo "Committing with message: $commit_message"
    if git commit -m "$commit_message"
        echo (set_color cyan)"Commit Message:"(set_color normal)" $commit_message"
        echo (set_color green)"----> Commit Successful <----"(set_color normal)
    else
        echo (set_color red)"----> Commit FAILED <----"(set_color normal)
    end
end
# END: ACP Function
`;
}
