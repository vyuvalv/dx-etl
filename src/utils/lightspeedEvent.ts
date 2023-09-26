import * as vscode from 'vscode';
import { generateConfigPlan, analyseMetadataDependencies, generateMetadata } from './lightspeedApi';
/* eslint-disable @typescript-eslint/naming-convention */
export enum Stage {
  init = 'init',
  prompt = 'prompt',
  metadata = 'filePlan',
  dependecy = 'depsPlan',
  build = 'build'
}
  // Commands exposed on package.json contributes
export class CMD {
  // EDITOR
  public static COPY_FROM_EDITOR:string = 'lightspeed-vscode.copyFromEditor';
  public static GENERATE_METADATA_PLAN_FROM_EDITOR:string = 'lightspeed-vscode.generateMetadataPlanFromEditor';
  // VIEWS
  public static LIGHTSPEED_WEBVIEW = 'lightspeed-vscode.view';
  public static LIGHTSPEED_PROMPT_VIEW = 'lightspeed-vscode.prompt';
  public static LIGHTSPEED_METADATA_TREE_PLAN = 'lightspeed-vscode.filePlan';
  public static LIGHTSPEED_DEPEDENCY_TREE_PLAN = 'lightspeed-vscode.depsPlan';
  public static LIGHTSPEED_PROMPT_COMMAND = 'lightspeed-vscode.promptCommand';
  // TOGGLE ON ?
  public static OPEN_METADATA_PLAN = 'lightspeed-vscode.openMetadataPlan';
  public static TOGGLE_LIGHTSPEED_TAB = 'lightspeed-vscode.openLightspeed';
  public static OPEN_DEPS_PLAN = 'lightspeed-vscode.openDepsPlan';
  public static OPEN_EXPLORER_TAB = 'lightspeed-vscode.showExplorer';
  public static LIGHTSPEED_TAB = 'workbench.view.extension.lightspeed-vscode';
  public static EXPLORER_TAB = 'workbench.view.explorer';
  // LIGHTSPEED
  public static LIGHTSPEED_SUBMIT_PROMPT = 'lightspeed-vscode.submitPrompt';
  
  public static LIGHTSPEED_ANALYSE_METADATA_PLAN = 'lightspeed-vscode.analyseMetadaPlan';
  public static LIGHTSPEED_SUBMIT_METADATA_PLAN = 'lightspeed-vscode.submitMetadataPlan';
  public static HANDLE_DEPENDECY_PLAN_RESULTS = 'lightspeed-vscode.analyseDependecies';

  public static LIGHTSPEED_GENERATE_MULTI_FILE_CONTENT = 'lightspeed-vscode.generateCodeFiles';
  public static LIGHTSPEED_GENERATE_FILE_CONTENT = 'lightspeed-vscode.generateCodeFromFile';
  // METHODS
  public static SYNC_FILES = 'lightspeed-vscode.syncFilePlan';
  public static DELETE_ITEM = 'lightspeed-vscode.deleteItem';
  public static DELETE_SELECTED = 'lightspeed-vscode.deleteSelected';
  public static EDIT_ITEM = 'lightspeed-vscode.editItem';
  // UTILS
  public static SFDX_CREATE_PROJECT = 'lightspeed-vscode.createProject';
  public static CREATE_METADATA_FILE = 'lightspeed-vscode.createFile';

}

export class LightSpeed {
  private _context:vscode.ExtensionContext;
  public llmKey: string;
  public prompt: string;
  public filePaths: string[];
  public filePathsText?: string;
  public dependencyPlanText?: string;
  public dependencyPlanItems: string[];
  public currentFile?: string;

  public activeProjectFolder:string;
  public outputPath:string;

  public stage: Stage;
 
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this.llmKey = '';
    this.prompt = '';
    this.filePaths = [];
    this.dependencyPlanItems = [];

    // Global vars
    this.activeProjectFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
    const configOutputFolder = vscode.workspace.getConfiguration().get('lightspeed-vscode.outputFolderName');
    this.outputPath = configOutputFolder ? `${configOutputFolder}` :'./lightspeed/vscode_ext/output';

    this.stage = Stage.init;
    this.init();
  }
  init(){
    // Visibility Settings
    vscode.commands.executeCommand('setContext', 'lightspeed-vscode.stage', this.stage);
    vscode.commands.executeCommand('setContext', 'lightspeed-vscode.isFilePlanAvailable', false);
    vscode.commands.executeCommand('setContext', 'lightspeed-vscode.isDepsPlanAvailable', false);
  }
  setStage(currentStage:Stage){
    this.stage = currentStage;
    vscode.commands.executeCommand('setContext', 'lightspeed-vscode.stage', this.stage);
  }
  setPrompt(value:string){
    this.prompt = value;
    this.stage = Stage.prompt;
    // Toggle Off Other Tabs
    vscode.commands.executeCommand('setContext', 'lightspeed-vscode.isFilePlanAvailable', false);
    vscode.commands.executeCommand('setContext', 'lightspeed-vscode.isDepsPlanAvailable', false);
  } 
  public setFilePaths(value:string){
    this.filePathsText = value;
    this.filePaths = value ? JSON.parse(value):[];
    this.stage = Stage.metadata;
  }
  setDependecyPlan(value:string){
    this.dependencyPlanText = value;
    this.dependencyPlanItems = value ? JSON.parse(value):[];
    this.stage = Stage.dependecy;
  }

  async validateApiKey(){
    	// Get ApiKey from VSCODE configuration settings 
    if(!this.llmKey){
      let lightspeedLlmKey = vscode.workspace.getConfiguration().get('lightspeed-vscode.llmKey');
      if(!lightspeedLlmKey){
        lightspeedLlmKey = await vscode.window.showInputBox({ 
            prompt: "Enter your LLM API KEY", 
            value: ''
          }) || "";
        
      }
      this.llmKey = `${lightspeedLlmKey}`;
    }
  }
   // API 1
  public async generateFilePlanFromPrompt(prompt:string): Promise<string| undefined> {
    // const SAMPLE_FILE_PLAN =  {"file_paths":"force-app/main/default/package.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/TLB_Case_Comments__c.object-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Data_Raised__c.field-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Entry__c.field-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Locked__c.field-meta.xml\nforce-app/main/default/profiles/TLB_Service_User.profile-meta.xml\nforce-app/main/default/permissionsets/TLB_HOC_Base.permissionset-meta.xml"};
    this.validateApiKey();

      try {
          const results = await generateConfigPlan(prompt, this.llmKey);
          if(results.status === 200){
            if(results.data){
                    const payload = results.data;
                    const filePlanRaw =  payload.file_paths ? payload.file_paths: [];
                    this.setFilePaths(filePlanRaw);
                return filePlanRaw;
            }
          }
          else {
            throw new Error(`${results.status}`);
          }
        } catch (error) {
            console.log('unable to call lightspeed fileplan ' + error);
        }
  }
 
    // API 2
  public async generateDependencyPlan(prompt:string, filePlan:string): Promise<any> {
      
    this.validateApiKey();  
    
    try {
      const results = await analyseMetadataDependencies(prompt, filePlan, this.llmKey);
      if(results.status === 200){
          if(results.data){
            // const SAMPLE_DEPS_PAYLOAD = "Shared Dependencies:\n1. TLB_Case_Comments__c - A custom object that represents the Case Comments with the following custom fields.\n2. Data_Raised__c - A custom field on the TLB_Case_Comments__c object.\n3. Entry__c - A custom field on the TLB_Case_Comments__c object.\n4. Locked__c - A custom field on the TLB_Case_Comments__c object.\n5. TLB_Service_User - A profile in Salesforce.\n6. TLB_HOC_Base - A permission set in Salesforce." 
            this.setDependecyPlan(results.data);
            return JSON.parse(results.data);
          }
        }
        else {
          throw new Error(`${results.status}`);
        }
      } catch (error) {
          console.log('unable to call lightspeed dependecy ' + error);
      }
  }

  // API 3
  public async generateMetadataContent(prompt:string, filename:string, filePaths:string, depsAnalysis:any): Promise<any> {
    
    this.validateApiKey(); 

    try {
    const results = await generateMetadata(prompt, filename, filePaths, depsAnalysis, this.llmKey);
        if(results.data){
          return results.data;
        }
    } catch (error) {
      console.log('unable to call lightspeed dependecy ' + error);
    }
  }

//   private runGenerateAllFiles(prompt:string, filePaths:any, depsAnalysis:any, metadataFiles:any[] ){

//     filePaths.forEach(async(currentFilePath:string) => {
//         const results = await generateMetadata(prompt, currentFilePath, filePaths, depsAnalysis);
//         metadataFiles.push(results);

//     });
//     return metadataFiles;

// }

}
  