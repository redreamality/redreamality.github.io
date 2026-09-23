---
title: 'How to Set PYTHONPATH on Windows, Linux, macOS and VS Code'
pubDate: 2025-08-21T09:24:07.954Z
description: 'Set and check PYTHONPATH with PowerShell or export commands. Configure VS Code terminals and debugging, and diagnose Python import errors.'
author: 'Remy'
tags: ['python']
---

## What is PYTHONPATH?

`PYTHONPATH` adds directories to Python's module search path, `sys.path`. It does not select the Python executable: that is the job of your shell's `PATH` or the interpreter selected in VS Code.

For a project containing `src/my_package/`, add the `src` directory, not `src/my_package` or an individual `.py` file. Use an absolute path when the working directory may change.

## Quick Reference: Set and Check PYTHONPATH

The following examples replace PYTHONPATH for the current shell session:

| Shell | Set one directory | Check the variable |
| :--- | :--- | :--- |
| Windows PowerShell | `$env:PYTHONPATH = 'C:\project\src'` | `$env:PYTHONPATH` |
| Windows Command Prompt | `set "PYTHONPATH=C:\project\src"` | `echo %PYTHONPATH%` |
| Linux/macOS Bash or Zsh | `export PYTHONPATH="/path/to/project/src"` | `echo "$PYTHONPATH"` |

Separate multiple directories with `;` on Windows and `:` on Linux/macOS. Check the interpreter and its effective search path in the same terminal where the import fails:

```bash
python -c "import os, sys; print(sys.executable); print(os.environ.get('PYTHONPATH')); print(*sys.path, sep='\n')"
```

Use `python3` instead of `python` if that is the command for your intended interpreter.

## Configure PYTHONPATH for Your Project

PYTHONPATH is an environment variable that allows users to add extra directories to the list of paths that the Python interpreter searches for modules and packages. This is particularly useful during development when you need to import custom modules that are not located in the standard library path or in the installed package directories. This article will detail various methods for setting PYTHONPATH on Windows, macOS, and Linux systems.

### When to Set PYTHONPATH?

Usually, you may not need to set PYTHONPATH. When you install packages using pip, they are placed in locations that the Python interpreter can automatically find. However, setting PYTHONPATH can be very convenient in the following situations:

  * **Developing Custom Modules or Libraries:** If you are writing your own Python modules and want to import them in other scripts within your project without installing them first, setting PYTHONPATH allows you to specify the directories where these modules are located.
  * **Using Libraries in Non-standard Directories:** Sometimes, you might need to use a third-party library that was not installed via pip but was downloaded directly to a specific directory.
  * **Temporary Testing:** When running tests or experiments, you might want to temporarily add a directory to the search path to import test scripts or experimental code.

### How to Set PYTHONPATH

The methods for setting environment variables differ by operating system and can be categorized into **temporary settings** (valid only for the current terminal session) and **permanent settings** (valid in all new terminal sessions).

---

### Setting PYTHONPATH on Windows

#### 1\. Temporary Setting (Command Line)

This method is only valid for the current Command Prompt or PowerShell session. The setting will be lost when the window is closed.

**In Command Prompt (cmd.exe):**

```bash
set PYTHONPATH=C:\path\to\your\module
```

If you need to add multiple paths, use a semicolon (`;`) to separate them:

```bash
set PYTHONPATH=C:\path\to\first\module;C:\path\to\second\module
```

**In PowerShell:**

```powershell
$env:PYTHONPATH="C:\path\to\your\module"
```

Similarly, use a semicolon to separate multiple paths:

```powershell
$env:PYTHONPATH="C:\path\to\first\module;C:\path\to\second\module"
```

#### 2\. Permanent Setting (Graphical Interface)

This method will permanently set PYTHONPATH for the current user.

1.  Search for "Edit the system environment variables" in the Start menu and open it.
2.  In the "System Properties" window, click the "Environment Variables..." button.
3.  In the "User variables" or "System variables" section (recommended to set for the current user, i.e., "User variables"), click "New...".
      * **Variable name:** `PYTHONPATH`
      * **Variable value:** `C:\path\to\your\module` (use a semicolon to separate multiple paths)
4.  Click "OK" to close all windows.
5.  **Important Note:** You need to reopen any existing Command Prompt or PowerShell windows for the new environment variable settings to take effect.

---

### Setting PYTHONPATH on macOS and Linux

On Unix-like systems (such as macOS and Linux), setting environment variables is similar and typically involves modifying the shell configuration files. The path separator is a colon (`:`).

#### 1\. Temporary Setting (Terminal)

This setting is only valid for the current terminal session.

```bash
export PYTHONPATH="/path/to/your/module"
```

To add multiple paths, use a colon to separate them:

```bash
export PYTHONPATH="/path/to/first/module:/path/to/second/module"
```

If you want to add new paths to the existing PYTHONPATH, you can do this:

```bash
export PYTHONPATH="/new/path${PYTHONPATH:+:$PYTHONPATH}"
```

#### 2\. Permanent Setting (Shell Configuration File)

To make PYTHONPATH available every time you open a new terminal, you need to add it to your shell configuration file. Common shells and their configuration files are as follows:

  * **Bash:** `~/.bashrc` or `~/.bash_profile`
  * **Zsh (default on macOS):** `~/.zshrc`

**Steps:**

1.  Open your shell configuration file. For example, if you use Zsh:

    ```bash
    nano ~/.zshrc
    ```

2.  Add the following line at the end of the file:

    ```bash
    export PYTHONPATH="/path/to/your/module:/another/path"
    ```

3.  Save and close the file (in nano, press `Ctrl + X`, then `Y` to confirm save).

4.  To make the changes take effect immediately in the current terminal session, "source" the file:

    ```bash
    source ~/.zshrc
    ```

    Alternatively, you can simply open a new terminal window.

### Verifying PYTHONPATH Settings

To check if PYTHONPATH has been set correctly, you can execute the following in your terminal or command prompt:

  * **In Windows (cmd.exe):**

    ```bash
    echo %PYTHONPATH%
    ```

  * **In Windows (PowerShell):**

    ```powershell
    $env:PYTHONPATH
    ```

  * **In macOS and Linux:**

    ```bash
    echo $PYTHONPATH
    ```

Additionally, you can check `sys.path` in the Python interpreter, which is a list of all module search paths. The directories specified in PYTHONPATH should appear in this list.

```python
import sys
print(sys.path)
```

### Summary and Notes

  * **Separator:** Windows uses a semicolon (`;`), while macOS and Linux use a colon (`:`).
  * **Path Format:** Ensure the path format you use is compatible with your operating system.
  * **Alternative Solutions:** Although PYTHONPATH is convenient, using virtual environments (such as venv or conda) and package management tools (such as pip) is generally a better practice for more complex projects. By installing project dependencies in a virtual environment, you can avoid the confusion that might arise from a global PYTHONPATH.
  * **Caution:** Globally setting PYTHONPATH can lead to module conflicts between different projects. Therefore, it is recommended to prioritize temporary settings or configuring the PYTHONPATH in the development environment configuration file of a specific project.

---

## Several Main Ways to Set Python Path in VS Code:

### 1\. Using a `.env` File for Debugging and Opt-in Terminal Loading

This is the most commonly used and recommended method because it confines environment variable configuration within the project workspace and does not affect other projects.

1.  **Create a file named `.env` in your project root directory.**
    Project structure:

    ```
    your_project/
    ├── .env
    ├── your_script.py
    └── your_modules/
        └── my_module.py
    ```

2.  **Set PYTHONPATH in the `.env` file.**
    Open the `.env` file and add the following content. Python itself does not automatically read `.env`; the launching tool must load it.

      * **Syntax:** `VARIABLE=value`

      * **Example:** Suppose your custom modules are located in the `src` folder under the project root directory, you can write it as follows:

        ```
        PYTHONPATH=./src
        ```

        If you want to add the project root directory itself (so you can directly import modules in the root directory), you can write it as follows:

        ```
        PYTHONPATH=.
        ```

        Alternatively, you can use absolute paths. Separate multiple paths with the operating system-specific delimiter (Windows uses `;`, macOS/Linux uses `:`).

        ```
        # macOS/Linux Example
        PYTHONPATH=./src:/path/to/another/lib

        # Windows Example
        PYTHONPATH=./src;C:\path\to\another\lib
        ```

3.  **Configure VS Code to load the `.env` file.**
    Set `python.envFile` to identify the environment file. To inject these variables into new integrated terminals, also enable `python.terminal.useEnvFile`, which defaults to `false`.
    Open or create the `.vscode/settings.json` file and add:

    ```json
    {
        "python.envFile": "${workspaceFolder}/.env",
        "python.terminal.useEnvFile": true
    }
    ```

    `${workspaceFolder}` is a predefined variable in VS Code that represents the root directory of the project you currently have open.

Open a new terminal after changing these settings. For a specific debug configuration, set `"envFile": "${workspaceFolder}/.env"` in `.vscode/launch.json` and restart debugging. Relative paths such as `./src` depend on the launched process's working directory.

These are separate from `python.analysis.extraPaths`: that setting helps Pylance resolve imports in the editor but does not set the runtime's PYTHONPATH.

### 2\. Modifying `settings.json` in Workspace Settings

You can directly modify the workspace settings (`.vscode/settings.json`) to add extra module search paths for the terminal integrated in VS Code. This affects Python scripts run through the VS Code integrated terminal.

1.  In VS Code, use the shortcut `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS) to open the command palette.

2.  Search for and select "Preferences: Open Workspace Settings (JSON)."

3.  In the opened `.vscode/settings.json` file, add the following configuration:

    ```json
    {
        "terminal.integrated.env.windows": {
            "PYTHONPATH": "${workspaceFolder}\\src;${env:PYTHONPATH}"
        },
        "terminal.integrated.env.linux": {
            "PYTHONPATH": "${workspaceFolder}/src:${env:PYTHONPATH}"
        },
        "terminal.integrated.env.osx": {
            "PYTHONPATH": "${workspaceFolder}/src:${env:PYTHONPATH}"
        }
    }
    ```

      * `${workspaceFolder}` points to your project root directory.
      * `${env:PYTHONPATH}` retains any existing system-level PYTHONPATH settings.

### 3\. Selecting the Correct Python Interpreter (Managing Virtual Environments)

In many cases, **the best practice is not to manually set PYTHONPATH but to use a Python virtual environment**. VS Code integrates well with virtual environments (such as `venv` or `conda`).

Select the environment containing your project's dependencies as the workspace interpreter. This avoids using packages from a different Python installation, but it does not automatically make an uninstalled `src` directory importable.

1.  **Create a virtual environment:**
    In your project root directory, open the terminal and run:

    ```bash
    uv venv
    ```

    This will create a folder named `.venv` that contains an independent Python environment.

2.  **Select the interpreter:**

      * Use the shortcut `Ctrl + Shift + P` (or `Cmd + Shift + P`) to open the command palette.
      * Search for and select "Python: Select Interpreter."
      * VS Code will list all detected Python interpreters, including the one in `.venv`. Select it.

3.  **Activate the environment and install packages:**
    Open a new terminal using the selected environment. For a project with packaging metadata, `uv pip install -e .` installs the local package in editable mode, so imports can resolve without a global PYTHONPATH.

### Summary and Comparison

| Method | Advantages | Disadvantages | Best Use Cases |
| :--- | :--- | :--- | :--- |
| **`.env` File** | Keeps environment variables in a project-local file. | Must be loaded by the debugger or an opted-in terminal; Python alone does not read it. | Development requiring references to non-installed modules within the project. |
| **`settings.json`** | Directly integrated into VS Code workspace settings. | Configuration is slightly more complex, mainly affects the VS Code integrated terminal. | Needing to customize complex environment variables for the VS Code terminal. |
| **Selecting Interpreter (Virtual Environment)** | Separates installed dependencies from other environments. | Local packages still need installation or an explicit search path. | Projects with their own dependencies. |

## Why Is PYTHONPATH Not Working?

Check `sys.executable` and `sys.path` in the failing process, not only in a different terminal. Confirm the directory exists, contains the package you import, and uses the correct path separator. Restart terminals or debugging after changing their environment.

If imports work at runtime but Pylance still reports an error, check the selected interpreter and `python.analysis.extraPaths`. If only the editor resolves the import, configure the runtime environment or install the local package; editor analysis settings alone cannot fix a runtime `ModuleNotFoundError`.

For packaged projects, prefer a virtual environment and an editable installation. Use project-local PYTHONPATH settings when you specifically need to import uninstalled source directories.
