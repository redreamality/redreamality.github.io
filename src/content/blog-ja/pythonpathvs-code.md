---
title: 'PYTHONPATH環境変数の設定：全プラットフォーム＆VS Code開発ガイド'
pubDate: 2025-08-21T09:24:07.954Z
description: '本記事では、Windows、macOS、Linuxシステム上でPYTHONPATHを設定する様々な方法と、Visual Studio Code（VS Code）でPythonプロジェクトのモジュール検索パスを設定する非常に便利で推奨される方法を詳しく説明します。'
author: 'Remy'
tags: ['python']
lang: 'ja'
translatedFrom: 'pythonpathvs-code'
---

## グローバル PYTHONPATH 

PYTHONPATHは環境変数で、ユーザーがPythonインタープリターがモジュールとパッケージを検索するパスリストに追加のディレクトリを追加できるようにします。これは開発中に特に便利で、標準ライブラリパスやインストール済みパッケージディレクトリにないカスタムモジュールをインポートする必要がある場合に役立ちます。本記事では、Windows、macOS、Linuxシステム上でPYTHONPATHを設定する様々な方法を詳しく説明します。

### いつPYTHONPATHを設定する必要があるか？

通常、PYTHONPATHを設定する必要はないかもしれません。pipを使用してパッケージをインストールすると、それらはPythonインタープリターが自動的に見つけられる場所に配置されます。しかし、以下のような状況では、PYTHONPATHを設定すると非常に便利です：

  * **カスタムモジュールやライブラリの開発：** 独自のPythonモジュールを書いており、プロジェクト内の他のスクリプトでそれらをインポートしたい場合、最初にインストールすることなく、PYTHONPATHを設定することでこれらのモジュールが存在するディレクトリを直接指定できます。
  * **非標準ディレクトリ内のライブラリの使用：** 時には、pipでインストールされておらず、特定のディレクトリに直接ダウンロードされたサードパーティライブラリを使用する必要があるかもしれません。
  * **一時的なテスト：** テストを実行したり実験を行ったりする際、テストスクリプトや実験的コードをインポートするために、特定のディレクトリを一時的に検索パスに追加したい場合があります。

### PYTHONPATHの設定方法

環境変数を設定する方法はオペレーティングシステムによって異なり、**一時的な設定**（現在のターミナルセッションでのみ有効）と**永続的な設定**（すべての新しいターミナルセッションで有効）に分けられます。

-----

### WindowsでのPYTHONPATH設定

#### 1\. 一時的な設定（コマンドライン）

この方法は現在のコマンドプロンプトまたはPowerShellセッションでのみ有効です。ウィンドウを閉じると設定は無効になります。

**コマンドプロンプト（cmd.exe）の場合:**

```bash
set PYTHONPATH=C:\path\to\your\module
```

複数のパスを追加する必要がある場合は、セミコロン（`;`）で区切ります：

```bash
set PYTHONPATH=C:\path\to\first\module;C:\path\to\second\module
```

**PowerShellの場合:**

```powershell
$env:PYTHONPATH="C:\path\to\your\module"
```

同様に、セミコロンで複数のパスを区切ります：

```powershell
$env:PYTHONPATH="C:\path\to\first\module;C:\path\to\second\module"
```

#### 2\. 永続的な設定（GUIインターフェース）

この方法は現在のユーザーに対してPYTHONPATHを永続的に設定します。

1.  スタートメニューで「環境変数の編集」または「Edit the system environment variables」を検索して開きます。
2.  ポップアップ表示される「システムのプロパティ」ウィンドウで、「環境変数...」ボタンをクリックします。
3.  「ユーザー環境変数」または「システム環境変数」セクション（現在のユーザーに設定することを推奨、つまり「ユーザー環境変数」）で、「新規...」をクリックします。
      * **変数名:** `PYTHONPATH`
      * **変数値:** `C:\path\to\your\module`（同様に、複数のパスはセミコロンで区切る）
4.  すべてのウィンドウを「OK」で閉じます。
5.  **重要な注意：** 既存のコマンドプロンプトまたはPowerShellウィンドウを再度開く必要があり、新しい環境変数設定が有効になります。

-----

### macOSとLinuxでのPYTHONPATH設定

Unixライクシステム（macOSやLinuxなど）では、環境変数を設定する方法は似ており、通常はシェルの設定ファイルを修正することで実現されます。パス間の区切り文字はコロン（`:`）です。

#### 1\. 一時的な設定（ターミナル）

この設定は現在のターミナルセッションでのみ有効です。

```bash
export PYTHONPATH="/path/to/your/module"
```

複数のパスを追加するには、コロンで区切ります：

```bash
export PYTHONPATH="/path/to/first/module:/path/to/second/module"
```

既存のPYTHONPATHに新しいパスを追加したい場合は、次のようにできます：

```bash
export PYTHONPATH="/new/path${PYTHONPATH:+:$PYTHONPATH}"
```

#### 2\. 永続的な設定（シェル設定ファイル）

PYTHONPATHを新しいターミナルを開くたびに利用可能にするには、シェル設定ファイルに追加する必要があります。一般的なシェルとその設定ファイルは以下の通りです：

  * **Bash:** `~/.bashrc` または `~/.bash_profile`
  * **Zsh（macOSデフォルト）:** `~/.zshrc`

**手順：**

1.  シェル設定ファイルを開きます。例えば、Zshを使用している場合：

    ```bash
    nano ~/.zshrc
    ```

2.  ファイルの末尾に以下の行を追加します：

    ```bash
    export PYTHONPATH="/path/to/your/module:/another/path"
    ```

3.  ファイルを保存して閉じます（nanoの場合、`Ctrl + X`を押してから`Y`を押して保存を確認）。

4.  変更を現在のターミナルセッションで即座に有効にするには、ファイルを「source」します：

    ```bash
    source ~/.zshrc
    ```

    または、単に新しいターミナルウィンドウを開くこともできます。

### PYTHONPATHの設定を検証

PYTHONPATHが正しく設定されているかどうかを確認するには、ターミナルまたはコマンドプロンプトで以下を実行できます：

  * **Windows（cmd.exe）の場合:**

    ```bash
    echo %PYTHONPATH%
    ```

  * **Windows（PowerShell）の場合:**

    ```powershell
    $env:PYTHONPATH
    ```

  * **macOSとLinuxの場合:**

    ```bash
    echo $PYTHONPATH
    ```

さらに、Pythonインタープリターで`sys.path`をチェックすることもできます。これはすべてのモジュール検索パスを含むリストです。PYTHONPATHで指定されたディレクトリがこのリストに表示されるはずです。

```python
import sys
print(sys.path)
```

### まとめと注意事項

  * **区切り文字：** Windowsはセミコロン（`;`）を使用し、macOSとLinuxはコロン（`:`）を使用します。
  * **パス形式：** 使用するパス形式がオペレーティングシステムに適合していることを確認してください。
  * **代替手段：** PYTHONPATHは便利ですが、より複雑なプロジェクトでは、仮想環境（venvやcondaなど）とパッケージ管理ツール（pipなど）を使用するのが通常はより良い方法です。仮想環境にプロジェクトの依存関係をインストールすることで、グローバルPYTHONPATHがもたらす可能性のある混乱を避けることができます。
  * **慎重に使用：** グローバルにPYTHONPATHを設定すると、異なるプロジェクト間でモジュールの競合が発生する可能性があります。したがって、一時的な設定または特定のプロジェクトの開発環境設定ファイルでの設定を優先することをお勧めします。

---

## VS CodeでPythonパスを設定する主な方法：

### 1\. デバッガーとターミナルの `.env` 設定

`.env` は変数をプロジェクト内に保存できますが、ファイルを置くだけでは Python の環境は変わりません。起動するツールが読み込む設定を確認します。

1.  **プロジェクトのルートディレクトリに`.env`という名前のファイルを作成します。**
    プロジェクト構造は以下のようになります：

    ```
    your_project/
    ├── .env
    ├── your_script.py
    └── src/
        └── my_package/
            └── __init__.py
    ```

2.  **`.env`ファイルでPYTHONPATHを設定します。**
    `.env` ファイルに以下を追加します。Python 自体は `.env` を自動では読み込みません。

      * **構文：** `VARIABLE=value`

      * **例：** カスタムモジュールがプロジェクトルートディレクトリ下の`src`フォルダにある場合、次のように書けます：

        ```
        PYTHONPATH=./src
        ```

        プロジェクトルートディレクトリ自体を追加したい場合（ルートディレクトリ下のモジュールを直接インポートできるようにする）、次のように書けます：

        ```
        PYTHONPATH=.
        ```

        または、絶対パスを使用することもできます。複数のパス間はOS固有の区切り文字を使用します（Windowsは`;`、macOS/Linuxは`:`）。

        ```
        # macOS/Linux の例
        PYTHONPATH=./src:/path/to/another/lib

        # Windows の例
        PYTHONPATH=./src;C:\path\to\another\lib
        ```

3.  **VS Codeを設定して`.env`ファイルを読み込みます。**
    `python.envFile` はファイルの場所を指定します。新しい統合ターミナルにも変数を渡すには、既定値が `false` の `python.terminal.useEnvFile` を有効にします。デバッグでは対象の `launch.json` 構成に `envFile` を設定します。
    `.vscode/settings.json`ファイルを開くか作成し、以下を追加します：

    ```json
    {
        "python.envFile": "${workspaceFolder}/.env",
        "python.terminal.useEnvFile": true
    }
    ```

    `${workspaceFolder}`はVS Codeの事前定義変数で、現在開いているプロジェクトのルートディレクトリを表します。

変更後はターミナルを新規作成するかデバッグを再起動します。`./src` の基準は実行プロセスの作業ディレクトリです。`python.analysis.extraPaths` は Pylance の解析用であり、実行時の `PYTHONPATH` を設定しません。

プロジェクトのルートで同じサンプルを確認します。

```bash
python -c "import sys, my_package; print(sys.executable); print(my_package.__file__)"
```

選択したインタープリターと `src/my_package/__init__.py` が出力されることを確認します。ターミナルで成功してもデバッグで失敗する場合は、デバッグ中のプロセスでも同じ情報を調べます。

### 2\. ワークスペース設定で`settings.json`を変更

VS Codeのワークスペース設定（`.vscode/settings.json`）でターミナルに追加のモジュール検索パスを直接追加できます。これはVS Codeの統合ターミナルで実行されるPythonスクリプトに影響します。

1.  VS Codeで、ショートカット`Ctrl + Shift + P`（macOSでは`Cmd + Shift + P`）を使用してコマンドパレットを開きます。

2.  「Preferences: Open Workspace Settings (JSON)」を検索して選択します。

3.  開いた`.vscode/settings.json`ファイルに、以下の設定を追加します：

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

      * `${workspaceFolder}` はプロジェクトルートディレクトリを指します。
      * `${env:PYTHONPATH}` は既存のシステムレベルのPYTHONPATH設定を保持します。

### 3\. 正しいPythonインタープリターを選択（仮想環境の管理）

多くの場合、**最良の方法は手動でPYTHONPATHを設定することではなく、Python仮想環境を使用すること**です。VS Codeは仮想環境（`venv`や`conda`など）との統合が非常に優れています。

インタープリターの選択は実行環境を決めますが、ローカルソースのインストールや任意の `src` ディレクトリの追加までは行いません。パッケージをインストールするか、検索パスを明示する必要があります。

1.  **仮想環境の作成**：
    プロジェクトルートディレクトリでターミナルを開き、次を実行します：

    ```bash
    # venv を使用
    python -m venv .venv
    ```

    これにより、独立したPython環境を含む`.venv`という名前のフォルダが作成されます。

2.  **インタープリターの選択**：

      * ショートカット`Ctrl + Shift + P`（または`Cmd + Shift + P`）を使用してコマンドパレットを開きます。
      * 「Python: Select Interpreter」を検索して選択します。
      * VS Codeは検出されたすべてのPythonインタープリター（`.venv`で作成したものを含む）をリストします。それを選択します。

3.  **環境の有効化とパッケージのインストール**：
    選択した環境で新しいターミナルを開きます。パッケージ定義があるプロジェクトは `uv pip install -e .` で編集可能な形式としてインストールできます。パッケージ定義がないディレクトリに対する万能な解決方法ではありません。

### まとめと比較

| 方法 | 利点 | 欠点 | 最適な使用シナリオ |
| :--- | :--- | :--- | :--- |
| **`.env` ファイル** | **プロジェクト隔離**、設定が簡単、システム環境に影響せず、チームコラボレーションに便利（`.env.example`をバージョン管理に追加可能）。 | ターミナルまたはデバッグセッションを再起動する必要あり。 | プロジェクト内の非インストールモジュールを参照する開発時。 |
| **`settings.json`** | VS Codeワークスペース設定に直接統合。 | 設定がやや複雑で、主にVS Codeの統合ターミナルに影響。 | VS Codeターミナルの複雑な環境変数のカスタマイズが必要な場合。 |
| **インタープリターの選択（仮想環境）** | インストールした依存パッケージを環境ごとに分離。 | ローカルパッケージは別途インストールまたは検索パスの設定が必要。 | 独立した依存関係を持つ Python プロジェクト。 |

パッケージ定義がある場合は、仮想環境と編集可能なインストールを優先します。未インストールのソースを一時的に参照する場合に、プロジェクト単位の `PYTHONPATH` を選びます。失敗したプロセスの `sys.executable`、`sys.path`、作業ディレクトリを確認してください。

## 参考資料

- [VS Code Python 環境とターミナル設定](https://code.visualstudio.com/docs/python/environments)
- [VS Code Python デバッグ](https://code.visualstudio.com/docs/python/debugging)
- [Python のモジュール検索パス初期化](https://docs.python.org/3/library/sys_path_init.html)
