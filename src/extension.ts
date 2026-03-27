import * as vscode from 'vscode';
import { scanContent, loadConfig, allRules, allMultilineRules } from '@yuvrajangadsingh/vibecheck';
import type { Finding, Config, Severity } from '@yuvrajangadsingh/vibecheck';

const SUPPORTED_LANGUAGES = new Set([
  'javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'python',
]);

const SEVERITY_MAP: Record<Severity, vscode.DiagnosticSeverity> = {
  error: vscode.DiagnosticSeverity.Error,
  warn: vscode.DiagnosticSeverity.Warning,
  info: vscode.DiagnosticSeverity.Information,
};

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warn: 1, info: 2 };

let diagnostics: vscode.DiagnosticCollection;
let statusBar: vscode.StatusBarItem;
let config: Config | null = null;

function getConfig(): Config {
  if (config) return config;
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  try {
    config = loadConfig(workspaceRoot || process.cwd());
  } catch {
    // Default config: all rules at their default severity
    config = {
      rules: {},
      ignore: [],
      include: [],
    };
  }
  return config;
}

function getMinSeverity(): Severity {
  return vscode.workspace.getConfiguration('vibecheck').get<Severity>('severity') || 'info';
}

function lintDocument(doc: vscode.TextDocument) {
  if (!vscode.workspace.getConfiguration('vibecheck').get<boolean>('enable', true)) {
    diagnostics.delete(doc.uri);
    updateStatusBar(0);
    return;
  }

  if (!SUPPORTED_LANGUAGES.has(doc.languageId)) return;

  const content = doc.getText();
  const filePath = doc.uri.fsPath;
  const cfg = getConfig();
  const minSeverity = getMinSeverity();

  const findings = scanContent(content, filePath, cfg);

  const filtered = findings.filter(
    (f) => SEVERITY_ORDER[f.severity] <= SEVERITY_ORDER[minSeverity]
  );

  const diags = filtered.map((f) => {
    const line = Math.max(0, f.line - 1);
    const col = Math.max(0, f.column - 1);
    const lineText = doc.lineAt(line).text;
    const range = new vscode.Range(line, col, line, lineText.length);

    const diag = new vscode.Diagnostic(range, f.message, SEVERITY_MAP[f.severity]);
    diag.source = 'vibecheck';
    diag.code = f.rule;
    return diag;
  });

  diagnostics.set(doc.uri, diags);
  updateStatusBar(diags.length);
}

function updateStatusBar(count: number) {
  if (count === 0) {
    statusBar.text = '$(check) vibecheck';
    statusBar.backgroundColor = undefined;
  } else {
    statusBar.text = `$(warning) vibecheck: ${count}`;
    statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }
  statusBar.show();
}

export function activate(context: vscode.ExtensionContext) {
  diagnostics = vscode.languages.createDiagnosticCollection('vibecheck');
  context.subscriptions.push(diagnostics);

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'vibecheck.runFile';
  statusBar.tooltip = 'vibecheck: click to run on current file';
  context.subscriptions.push(statusBar);

  // Lint active editor on activation
  if (vscode.window.activeTextEditor) {
    lintDocument(vscode.window.activeTextEditor.document);
  }

  // Lint on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (vscode.workspace.getConfiguration('vibecheck').get<boolean>('runOnSave', true)) {
        lintDocument(doc);
      }
    })
  );

  // Lint when switching editors
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) lintDocument(editor.document);
    })
  );

  // Clear diagnostics when file is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnostics.delete(doc.uri);
    })
  );

  // Re-lint when config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vibecheck')) {
        config = null; // reset cached config
        if (vscode.window.activeTextEditor) {
          lintDocument(vscode.window.activeTextEditor.document);
        }
      }
    })
  );

  // Manual run command
  context.subscriptions.push(
    vscode.commands.registerCommand('vibecheck.runFile', () => {
      if (vscode.window.activeTextEditor) {
        lintDocument(vscode.window.activeTextEditor.document);
      }
    })
  );

  updateStatusBar(0);
}

export function deactivate() {
  diagnostics?.dispose();
  statusBar?.dispose();
}
