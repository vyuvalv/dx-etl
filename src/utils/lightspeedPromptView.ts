import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { HTML_FILE, LIGHTSPEED_UI_PATH } from './constants';
import { HtmlUtils } from './htmlUtils';
import { CMD } from './lightspeedEvent';

// eslint-disable-next-line @typescript-eslint/naming-convention
const SAMPLE_FILE_PLAN =  {"file_paths":"force-app/main/default/package.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/TLB_Case_Comments__c.object-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Data_Raised__c.field-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Entry__c.field-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Locked__c.field-meta.xml\nforce-app/main/default/profiles/TLB_Service_User.profile-meta.xml\nforce-app/main/default/permissionsets/TLB_HOC_Base.permissionset-meta.xml"};
const SAMPLE_DEPS_PLAN = "Shared Dependencies:\n1. TLB_Case_Comments__c - A custom object that represents the Case Comments with the following custom fields.\n2. Data_Raised__c - A custom field on the TLB_Case_Comments__c object.\n3. Entry__c - A custom field on the TLB_Case_Comments__c object.\n4. Locked__c - A custom field on the TLB_Case_Comments__c object.\n5. TLB_Service_User - A profile in Salesforce.\n6. TLB_HOC_Base - A permission set in Salesforce." ;
const PACKAGE_CONTENT_FILE = {
    "filename": "force-app/main/default/package.xml",
    "metadata": [
      "force-app/main/default/package.xml",
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Package xmlns=\"http://soap.sforce.com/2006/04/metadata\">\n    <types>\n        <members>TLB_Case_Comment</members>\n        <name>CustomObject</name>\n    </types>\n    <version>58.0</version>\n</Package>"
    ]
  };

export default class LightSpeedPrompt implements vscode.WebviewViewProvider {
    public static readonly viewType = 'lightspeed-vscode.prompt';
    private context: vscode.ExtensionContext;
    public panel?: vscode.WebviewView;

    public prompt?:string = '';
    public filePaths:string[]|undefined = [];
    public depsPlan?:any = '';
    public currentFile?:string = '';

    constructor(private _context: vscode.ExtensionContext) { 
        this.context = _context;
        this.prompt = 'Hello';
       
    }

    private updateWebview(context: vscode.ExtensionContext, webview: vscode.Webview): any  {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.prompt = activeEditor.document.getText();
            console.log(this.prompt);
            if(webview){
                this.panel!.webview.html = this.getHtml(context,  webview);
            }
        }
        return activeEditor;
      }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this.panel = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        this.panel.webview.html = this.getHtml(this.context, webviewView.webview);
  
        // Listen to Webview messages
        this.panel.webview.onDidReceiveMessage(async (data) => {
            if(data.type === 'prompt'){
                // recieved - requirementPrompt
                this.prompt = `${data.message}`;
                // Send Prompt to VsCode main
                vscode.commands.executeCommand(CMD.LIGHTSPEED_SUBMIT_PROMPT, data.message );
                // this.filePaths = SAMPLE_FILE_PLAN.file_path
            }
            else if(data.type === 'analyse'){
                vscode.window.showInformationMessage(`VsCode Dependency Call: ${data.message}`);

                const analysePayload = JSON.parse(data.message); // {prompt, file_plan}
                       // this.depsPlan = SAMPLE_DEPS_PLAN;
                vscode.commands.executeCommand(CMD.LIGHTSPEED_ANALYSE_METADATA_PLAN, analysePayload );
            }
            else if(data.type === 'generate'){
                vscode.window.showInformationMessage(`Generate Code: ${data.message}`);
                const generatePayload = JSON.parse(data.message);
                // const results = await this.generateMetadataContent(generatePayload.prompt, generatePayload.file_plan[0], generatePayload.file_plan, generatePayload.deps_analysis);
                  // const [fileName, content] = results.metadata;
                // const [fileName, content] = PACKAGE_CONTENT_FILE.metadata;
              
               
                vscode.commands.executeCommand(CMD.LIGHTSPEED_GENERATE_MULTI_FILE_CONTENT, generatePayload);
               
            }
            else if(data.type === 'syncfiles'){
                vscode.window.showInformationMessage(`Sync Files: ${data.message}`);
                  // Send Results to VsCode Tree
                vscode.commands.executeCommand(CMD.SYNC_FILES, true);

            }
            else if(data.type === 'submitPrompt'){
                console.log(`Event Type -: ${data.type}`);
                this.updateWebviewContent(this.context, webviewView.webview );
                // vscode.commands.executeCommand(CMD.COPY_FROM_EDITOR, data.message);
            }
            else {
                vscode.window.showInformationMessage(`Event Type -: ${data.type}`);
                console.log(`Event Type -: ${data.type}`);
            }
        });
      
    }

    public sendMessageToWebView(message: any): void {
        this.panel?.webview.postMessage(message);
    }

    // private getHtml(
    //     context: vscode.ExtensionContext,
    //     webview: vscode.Webview
    //   ) {
    //     const pathToApp = path.join(context.extensionPath, LIGHTSPEED_UI_PATH);
    //     const pathToHtml = path.join(pathToApp, HTML_FILE);
    //     let html = fs.readFileSync(pathToHtml).toString();
    //     html = HtmlUtils.transformHtml(html, pathToApp, webview);
    //     return html;
    // }
  
    private updateWebviewContent(
        context: vscode.ExtensionContext, 
        webview: vscode.Webview ) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        this.prompt = activeEditor.document.getText();
    
        webview.html = this.getHtml(context, webview);
    }
    private getHtml(
            context: vscode.ExtensionContext, 
            webview: vscode.Webview ) {

        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'app.js'));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css'));

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesMainUri}" rel="stylesheet">
				<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
			</head>
			<body class="overflow-hidden">
                <div class="main" data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>
                    <textarea id="editor" class="lightspeed-prompt-input" data-vscode-context='{"webviewSection": "prompt", "preventDefaultContextMenuItems": false}'>${this.prompt}</textarea>	
                <div class="prompt-buttons-area">
                    <button data-vscode-context='{"preventDefaultContextMenuItems": true, "webviewSection": "submitbutton" }' class="submit-button">Submit</button>
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
    
}