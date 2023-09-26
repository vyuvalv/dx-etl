import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { HTML_FILE, LIGHTSPEED_UI_PATH } from './constants';
import { HtmlUtils } from './htmlUtils';
import {generateConfigPlan} from './lightspeedApi';

export class WebviewInstance {
  public subscriptions: vscode.Disposable[] = [];
  public webviewPanel: vscode.WebviewPanel;
  public currentMessage:any;


  constructor(context: vscode.ExtensionContext, uri: vscode.Uri) {
    // Create webview panel
    this.webviewPanel = vscode.window.createWebviewPanel(
      'lightSpeedAI',
      'lightSpeedAI',
      vscode.ViewColumn.Two,
      {
        // Enable scripts in the webview
				enableScripts: true,
				retainContextWhenHidden: true
      }
    );

    // Set webview panel content
    this.webviewPanel.webview.html = this.getWebviewContent(
      context,
      this.webviewPanel.webview
    );

    // Define handler for received messages
    this.webviewPanel.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this,
      this.subscriptions
    );

    // Make sure we get rid of the event listeners when our editor is closed
    this.webviewPanel.onDidDispose(this.dispose, this, this.subscriptions);

      
  }
  public sendMessage(eventType:string = '', payload:string = ''){
      this.webviewPanel.webview.postMessage({
        message: eventType,
        payload: payload
      });
    //}
  }

  public sendMessageToWebView(message: any): void {
    if (this.webviewPanel) {
        this.webviewPanel.webview.postMessage(message);
    } else {
        this.currentMessage = message;
    }
  }

  private getWebviewContent(
    context: vscode.ExtensionContext,
    webview: vscode.Webview
  ) {
    const pathToApp = path.join(context.extensionPath, LIGHTSPEED_UI_PATH);
    const pathToHtml = path.join(pathToApp, HTML_FILE);
    let html = fs.readFileSync(pathToHtml).toString();
    html = HtmlUtils.transformHtml(html, pathToApp, webview);
    return html;
  }

  protected onDidReceiveMessageHandler(event: any): void {
    // Handle messages from the webview
    switch (event.type) {
      case 'init':
        vscode.window.showInformationMessage(`Received event: ${JSON.stringify(event.message)}`);
        console.log('first call');
        this.sendMessage(event.type, event.message);
     
        break;
      case 'prompt':
        vscode.window.showInformationMessage(`Received event: ${JSON.stringify(event.message)}`);
        // Handle UI message
      
        this.sendMessage(event.type, 'send back');

        break;
      case 'error':
        vscode.window.showErrorMessage(event.error);
        break;
      default:
        vscode.window.showInformationMessage(`Unknown event: ${event.type}`);
    }
  }

  protected dispose(): void {
    this.subscriptions.forEach((disposable) => disposable.dispose());
  }



}
