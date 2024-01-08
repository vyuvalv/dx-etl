
import * as vscode from 'vscode';
import * as path from 'path';

import { LightSpeed, Stage, CMD } from './utils/lightspeedEvent';
import { WebviewInstance } from './utils/webviewInstance';
import LightSpeedViewProvider from './utils/lightspeedWebviewProvider';
import LightSpeedPrompt from './utils/lightspeedPromptView';
import { FilesTreeProvider } from './utils/filesPlanTreeProvider';
import {PromptHistoryTreeProvider} from './utils/dependencyPlanTreeProvider';
import {runCommand} from './utils/cliHelper';


export function activate(context: vscode.ExtensionContext) {
	console.log('LightSpeed is Active!');
	const lightspeed = new LightSpeed(context);

	// Init Providers
	// VIEW
	const lightSpeedPanel = new LightSpeedViewProvider(context);
	const lightSpeedView = vscode.window.registerWebviewViewProvider(CMD.LIGHTSPEED_WEBVIEW, lightSpeedPanel, {
		webviewOptions: { retainContextWhenHidden: true }
	});
	const promptPanel = new LightSpeedPrompt(context);
	const LightSpeedPromptView = vscode.window.registerWebviewViewProvider(CMD.LIGHTSPEED_PROMPT_VIEW, promptPanel, {
		webviewOptions: { retainContextWhenHidden: true }
	});
	// FILE PLAN TREE
	const lightSpeedFilesTreeProvider = new FilesTreeProvider(lightspeed.activeProjectFolder,[]);
	const lightspeedFilesTree =  vscode.window.createTreeView(CMD.LIGHTSPEED_METADATA_TREE_PLAN, {
		treeDataProvider: lightSpeedFilesTreeProvider,
		canSelectMany:true,
		manageCheckboxStateManually:false
	});

	// METADATA PLAN - Track Selected Items
	lightspeedFilesTree.onDidChangeCheckboxState((selected)=>{
		const selectedFilePaths = lightSpeedFilesTreeProvider.getSelectedPathsSet(selected);

		const selectedFilePathsText = JSON.stringify(Array.from(selectedFilePaths));
		// Send to Webview
		lightSpeedPanel.sendMessageToWebView({type: 'prompt_response', payload:selectedFilePathsText });
	});

	// DEPENDENCY PLAN TREE
	const depsPlantreeProvider = new PromptHistoryTreeProvider(lightspeed.activeProjectFolder);
	const depsPlanTree = vscode.window.createTreeView(CMD.LIGHTSPEED_DEPEDENCY_TREE_PLAN, {
		treeDataProvider: depsPlantreeProvider,
		canSelectMany:true,
		manageCheckboxStateManually:false,
	});
	// Subscribe to LightSpeed UI and Tree
	context.subscriptions.push(lightSpeedView, LightSpeedPromptView, lightspeedFilesTree,  depsPlanTree);


	// views Commands - General Commands
	context.subscriptions.push(
	vscode.commands.registerCommand(CMD.TOGGLE_LIGHTSPEED_TAB, () => {
		lightspeed.setStage(Stage.prompt);
		// Toggle LightSpeed View
		vscode.commands.executeCommand(CMD.LIGHTSPEED_TAB);
		// lightSpeedPanel.panel?.show?.(true);
	}),
	vscode.commands.registerCommand(CMD.OPEN_METADATA_PLAN, () => {
		lightspeed.setStage(Stage.metadata);
		lightSpeedPanel.sendMessageToWebView({type: 'toggle_tab', payload: {tabName:lightspeed.stage}});
	}),
	vscode.commands.registerCommand(CMD.OPEN_DEPS_PLAN, () => {
		lightspeed.setStage(Stage.dependecy);
		lightSpeedPanel.sendMessageToWebView({type: 'toggle_tab', payload: {tabName:lightspeed.stage}});
	}),
	// vscode.commands.registerCommand(CMD.OPEN_EXPLORER_TAB, () => {
	// 	// Toggle Explorer View
	// 	vscode.commands.executeCommand(CMD.EXPLORER_TAB);
	// }),
	// GENERATE
	vscode.commands.registerCommand(CMD.LIGHTSPEED_GENERATE_MULTI_FILE_CONTENT, async (uiPayload?) => {
		const filePlan = Array.from(lightSpeedFilesTreeProvider.selectedFilesPaths);
		vscode.window.showInformationMessage(`${filePlan.length} files to create`);
		const changedPrompt = await vscode.window.showInputBox({ 
			prompt: `Lightspeed will create the content of (${filePlan?.length}) files with this prompt:`, 
			value: lightspeed.prompt
		}) || "";
		// Loop through all files
		await filePlan.forEach( async (currentFile) => {
			const results = await lightspeed.generateMetadataContent(changedPrompt, currentFile, filePlan!.join('\n'), lightspeed.dependencyPlanText);
			if(results && results.data){
				vscode.window.showInformationMessage(`Success File generated: ${currentFile}`);

				await vscode.commands.executeCommand(CMD.CREATE_METADATA_FILE, results.data.metadata);
				
				lightSpeedPanel.sendMessageToWebView({type: 'build_response', payload: JSON.stringify(results.data)});
				
				vscode.window.showInformationMessage(`Generated!`);
			}
		});

		vscode.window.showInformationMessage(`Finished generation of multiple files!`);
	}),
	// Create Files
	vscode.commands.registerCommand(CMD.CREATE_METADATA_FILE, async (metadata) => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if(!workspaceFolders) {
			vscode.window.showErrorMessage('No Project was open');
			await vscode.commands.executeCommand(CMD.SFDX_CREATE_PROJECT);
		}
		else{
		const [fileName, content] = metadata;
		// selectedFilePaths.forEach(async (filePath:string)=>{
			const folderPathParts = fileName.split('/');
			const currentFileName = folderPathParts.pop();
			const currentFolder = folderPathParts.join('/');
			// Uint8Array
			const encoder = new TextEncoder();
			const fileContent = encoder.encode(content);
			const explorerPath = workspaceFolders ? workspaceFolders[0].uri.fsPath + '/' + currentFolder : '';
			const explorerFilePath =workspaceFolders ? workspaceFolders[0].uri.fsPath + '/' + currentFolder + '/' + currentFileName : '';
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(explorerPath));
	
			await vscode.workspace.fs.writeFile(vscode.Uri.file(explorerFilePath), fileContent );

			vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(explorerFilePath));

			vscode.window.showTextDocument(vscode.Uri.file(explorerFilePath));
		// });
		}
		
	}),
	// Create SFDX Project Structure
	vscode.commands.registerCommand(CMD.SFDX_CREATE_PROJECT, async () => {
		
		const projectName = await vscode.window.showInputBox({ 
			prompt: "Project Name", 
			value:  "LightSpeedAiProject"
		}) || "";
		if(!projectName){
			vscode.window.showErrorMessage(`Must enter project name`);
		}
		const projectCommand = `sf project generate --name ${projectName} --template empty -d ${lightspeed.outputPath} -x --json`;
       try {
		// Toggle to explorer
		vscode.commands.executeCommand('workbench.view.explorer');
		
		const results = await runCommand(projectCommand);
	
		if (results) {
		
			const payload = JSON.parse(results);
			vscode.window.showInformationMessage(`Successfully created project: ${projectName} - ${JSON.stringify(payload.results)}`);

			// Create a new workspace folder object
			const newWorkspaceFolder = {
				uri: vscode.Uri.file(`${lightspeed.outputPath}/${projectName}`),
				name: 'Generated Project'
			};

			// Update the workspace folders
			vscode.workspace.updateWorkspaceFolders(0, null, newWorkspaceFolder);
			vscode.window.showInformationMessage(`Successfully update workspace: ${projectName}`);


		}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Project ${error}`);
		}
		})
	);


	context.subscriptions.push(vscode.commands.registerCommand(CMD.LIGHTSPEED_EDITOR,()=>{
		const editorView = new WebviewInstance(context);
	}));
	// UI Actions
	context.subscriptions.push(
		// API 1
		vscode.commands.registerCommand(CMD.LIGHTSPEED_SUBMIT_PROMPT, async (prompt: string) => {
			vscode.commands.executeCommand(CMD.LIGHTSPEED_EDITOR,'');
			
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Submitting prompt",
				cancellable: true
			}, async (progress, token) => {
				token.onCancellationRequested(() => {
					console.log("User canceled the operation");
				});
	
				progress.report({ increment: 0, message: `Submitting prompt: ${lightspeed.prompt}` });

				lightspeed.setPrompt(prompt);

				progress.report({ increment: 40, message: `Generating metadata config plan..}`});
				// API 1 - Submit Prompt To Get File Plan
				await lightspeed.generateFilePlanFromPrompt(lightspeed.prompt);
				
				progress.report({ increment: 80, message: `Sending response to UI: ${lightspeed.filePathsText}`});
				// log
				// vscode.window.showInformationMessage(`prompt_response: ${lightspeed.filePathsText})}`);
				
				// Send Results to WebView
				lightSpeedPanel.sendMessageToWebView({type: 'prompt_response', payload: lightspeed.filePathsText});
				
				progress.report({ increment: 90, message: `Building file tree`});
				// Build Tree view from file paths plan
				lightSpeedFilesTreeProvider.setData(lightspeed.filePaths);
				// Toggle File Plan Tree
				vscode.commands.executeCommand('setContext', 'lightspeed-vscode.isFilePlanAvailable', true);
				vscode.commands.executeCommand('setContext', 'lightspeed-vscode.stage', 'filePlan');

				progress.report({ increment: 100, message: `success`});

				return new Promise<void>(resolve => {
					resolve();
				});
			});

		}),
		// API 2
		vscode.commands.registerCommand(CMD.LIGHTSPEED_ANALYSE_METADATA_PLAN, async(analysePayload:any) => {
			
			const { prompt,file_plan:filePlan} = analysePayload;
			
			const analyseResults = await lightspeed.generateDependencyPlan(prompt, filePlan);
			
			if(analyseResults){
				vscode.window.showInformationMessage(`LIGHTSPEED_ANALYSE_METADATA_PLAN: ${analyseResults}`);
					
				await lightSpeedPanel.insertResponseToEditor(`\n\n# Analyse Dependecy Call \n## prompt(2) \n${prompt} \n\n## file_plan : \n${filePlan.join('\n')}\n\n## deps_plan : \n${lightspeed.dependencyPlanText}`);

				lightSpeedPanel.sendMessageToWebView({type: 'deps_response', payload: lightspeed.dependencyPlanText});
				// Format results into tree
				vscode.commands.executeCommand(CMD.HANDLE_DEPENDECY_PLAN_RESULTS,lightspeed.dependencyPlanText);
			}
		}),
		vscode.commands.registerCommand(CMD.HANDLE_DEPENDECY_PLAN_RESULTS, (depsPlan) => {
			console.log(depsPlan);
			depsPlantreeProvider.setTree(lightspeed.dependencyPlanItems);
			// Toggle Dependecy Tree
			vscode.commands.executeCommand('setContext', 'lightspeed-vscode.isDepsPlanAvailable', true);
		}),
		// API 3
		vscode.commands.registerCommand(CMD.LIGHTSPEED_GENERATE_FILE_CONTENT, async (item) => {
			const prompt = lightspeed.prompt ? lightspeed.prompt : 'Build this file';
			// const filePlan = Array.from(lightSpeedFilesTreeProvider.selectedFilesPaths);
			const filePlan = lightspeed.filePaths;
			const depsPlan = lightspeed.dependencyPlanText;
			const currentFile = item && item.path ? item.path : item;
	
			const changedPrompt = await vscode.window.showInputBox({ 
				prompt: `Lightspeed will create the content of (${filePlan?.length}) files with this prompt:`, 
				value: prompt
			}) || "";
			// Send to WebView to show loading on screen
			lightSpeedPanel.sendMessageToWebView({type: 'loading_build', payload: JSON.stringify({
				filePlan,
				depsPlan,
				currentFile,
				prompt:changedPrompt
			})});
	
			await lightSpeedPanel.insertResponseToEditor(`\n prompt: ${changedPrompt}
			\n filePlan: ${filePlan}
			\n depsPlan: ${depsPlan}
			\n file: ${currentFile}
			`, true);
	
			const results = await lightspeed.generateMetadataContent(changedPrompt, currentFile, filePlan!.join('\n'), depsPlan);
			if(results && results.data){
				vscode.window.showInformationMessage(`Success File generated: ${results.data}`);
	
				await vscode.commands.executeCommand(CMD.CREATE_METADATA_FILE, results.data.metadata);
				
	
				lightSpeedPanel.sendMessageToWebView({type: 'build_response', payload: JSON.stringify(results.data)});
				
				// await lightSpeedPanel.insertResponseToEditor(`\n## metadata: ${JSON.stringify(results.data)}`);
	
				vscode.window.showInformationMessage(`Generated!`);
			}
		}),
		vscode.commands.registerCommand(CMD.SYNC_FILES, () => {
			const selectedFilePaths = lightSpeedFilesTreeProvider.extractFilePaths(lightspeedFilesTree.selection,[]);
			const selectedFilePathsText = JSON.stringify(selectedFilePaths);
			lightSpeedPanel.sendMessageToWebView({type: 'prompt_response', payload:selectedFilePathsText });
			
		}),
	);

	// menus / "editor/context" - From Active Editor right click on context
	context.subscriptions.push(
		vscode.commands.registerCommand( CMD.COPY_FROM_EDITOR, (webviewContext: any) => { 
				const mouseCount = webviewContext?.mouseCount;
				const webviewSection = webviewContext?.webviewSection;
				console.log('webviewSection ' + webviewSection);
				// Get active editor content
				const activeEditor = getActiveEditor();
				const openFileContent = activeEditor.document.getText();

				lightSpeedPanel.sendMessageToWebView({type: 'editor', payload: openFileContent});

			}
		),
		vscode.commands.registerCommand( CMD.GENERATE_METADATA_PLAN_FROM_EDITOR, (uri: vscode.Uri) => { 
			// Get active editor content
			const activeEditor = getActiveEditor();
			const openFileContent = activeEditor.document.getText();


			lightSpeedPanel.sendMessageToWebView({type: 'editor', payload: openFileContent});

		}
	),
	);

	// menus / view/title - for all tree items
	context.subscriptions.push(
		vscode.commands.registerCommand(CMD.LIGHTSPEED_SUBMIT_METADATA_PLAN, () => {
			if(lightspeedFilesTree.selection.length){
				const selectedFilePaths = lightSpeedFilesTreeProvider.extractFilePaths(lightspeedFilesTree.selection,[]);
				const selectedFilePathsText = JSON.stringify(selectedFilePaths);

				vscode.window.showInformationMessage(`files selected: ${selectedFilePathsText} `);
				
				lightSpeedPanel.sendMessageToWebView({type: 'prompt_response', payload:selectedFilePathsText });
			
				vscode.commands.executeCommand(CMD.LIGHTSPEED_ANALYSE_METADATA_PLAN, {
							prompt:lightspeed.prompt,
							file_plan:lightspeed.filePaths
						});
			}
			else {
				vscode.window.showErrorMessage(`No files selected `);
			}
			// Move to Dependency plan
			// vscode.commands.executeCommand('setContext', 'lightspeed-vscode.stage', 'prompt');
		})
		
	);

	// menus / view/item/context - For each line item actions
	context.subscriptions.push(vscode.commands.registerCommand(CMD.DELETE_ITEM, (node: any) => {
		if(node.label){
			lightSpeedFilesTreeProvider.delete(node);
			// const treeItems = lightSpeedFilesTreeProvider.getChildren();
			vscode.window.showInformationMessage(`Successfully called deleted entry - ${node.label}. `);
		}
	})),
	context.subscriptions.push(vscode.commands.registerCommand(CMD.EDIT_ITEM, async (node: any) => {
			
			const userInput = await vscode.window.showInputBox({ 
				prompt: "Edit File Name", 
				value: node.label
			}) || "";

			vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}. ${userInput}`);
			// vscode.commands.executeCommand('setContext', 'lightspeed-vscode.stage', 'depsPlan');
			//depsPlantreeProvider.refresh();
		}
	));
	

	/**
	 * @description - Get the open file content from the active editor
	 * @returns - Open file content
	 */
	function getActiveEditor():any {
		// Create and show a new webview
		const activeEditor = vscode.window.activeTextEditor;
		// const activeEditor = await vscode.workspace.openTextDocument();

		if (!activeEditor) {
			return;
		}
	return activeEditor;
	}


	/** 
	 * Open Editor Document with Content in specific Language 
	 * */
	async function openDoc(documentContent:any, language:string){
		// create a new document editor with content
		const newDoc = await vscode.workspace.openTextDocument({
			content: documentContent,
			language: language
		});
		await vscode.window.showTextDocument(newDoc);
	}

}

// This method is called when your extension is deactivated
export function deactivate() {}
