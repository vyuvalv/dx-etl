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

export default class LightSpeedViewProvider implements vscode.WebviewViewProvider {

    public panel?: vscode.WebviewView;
    public prompt?:string = '';
    public filePaths:string[]|undefined = [];
    public depsPlan?:any = '';
    public currentFile?:string = '';

    constructor(private context: vscode.ExtensionContext) { }


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
                const [fileName, content] = PACKAGE_CONTENT_FILE.metadata;
              
                await this.insertResponseToEditor(`\n\n${fileName}\n${content}`);
                vscode.commands.executeCommand(CMD.LIGHTSPEED_GENERATE_MULTI_FILE_CONTENT, generatePayload);
               
            }
            else if(data.type === 'syncfiles'){
                vscode.window.showInformationMessage(`Sync Files: ${data.message}`);
                  // Send Results to VsCode Tree
                vscode.commands.executeCommand(CMD.SYNC_FILES, true);

            }
            else if(data.type === 'active_tab'){
                const activeUiTab = data.message;
                switch (activeUiTab) {
                    case '0': 
                        break;
                    case '1': 
                    vscode.commands.executeCommand(CMD.OPEN_METADATA_PLAN);
                        break;
                    case '2': 
                    vscode.commands.executeCommand(CMD.OPEN_DEPS_PLAN);
                        break;
                    case '3': 
                   // vscode.commands.executeCommand(CMD.OPEN_EXPLORER_TAB);
                        break;
                }
            }
        });
      
    }


    // Utils
    public async insertResponseToEditor(message: string, newTab?:boolean): Promise<void> {
        const editor = vscode.window.activeTextEditor;

        if (editor && !newTab) {
    
            const selection = editor.selection;
                editor.edit(function (editBuilder) {
                    editBuilder.insert(selection.end, `${message}`);
                });
        }
        else {

            const doc = await vscode.workspace.openTextDocument({content:message});

            await vscode.window.showTextDocument(doc);
           
        }
    }
    public sendMessageToWebView(message: any): void {
        this.panel?.webview.postMessage(message);
    }

    private getHtml(
        context: vscode.ExtensionContext,
        webview: vscode.Webview
      ) {
        const pathToApp = path.join(context.extensionPath, LIGHTSPEED_UI_PATH);
        const pathToHtml = path.join(pathToApp, HTML_FILE);
        let html = fs.readFileSync(pathToHtml).toString();
        html = HtmlUtils.transformHtml(html, pathToApp, webview);
        return html;
    }
    
}