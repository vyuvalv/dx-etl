
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import {CsvFileTreeProvider} from './utils/csvFilesTree';
// import {runCommand} from './utils/cliHelper';
import { WebviewInstance } from './utils/webviewInstance';

const CMD_OPEN_VIEW = 'dxtransformer.openView';
const CSV_TREE_VIEW = 'dxtransformer.csvFiles';

export function activate(context: vscode.ExtensionContext) {
	console.log('CSV Converter is Active!');
	// const workspaceFolders = vscode.workspace.workspaceFolders;
	const workspaceFolders = vscode.workspace.workspaceFolders || [];
	// const explorerPath = workspaceFolders ? workspaceFolders[0].uri.fsPath: '';
	const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
	const csvFileTree = new CsvFileTreeProvider(rootPath);
	// vscode.window.registerTreeDataProvider('csvFiles', csvFileTree);
	const dataProvider = vscode.window.createTreeView(CSV_TREE_VIEW, { treeDataProvider: csvFileTree });

	// Refresh the tree view whenever a file is created, deleted, or renamed in the workspace
	// vscode.workspace.onDidChangeWorkspaceFolders(() => csvFileTree.refresh());
	// vscode.workspace.onDidCreateFiles(() => csvFileTree.refresh());
	// vscode.workspace.onDidDeleteFiles(() => csvFileTree.refresh());
	// vscode.workspace.onDidRenameFiles(() => csvFileTree.refresh());

	// vscode.commands.registerCommand('dxtransformer.refresh', () => {
	// 	csvFileTree.refresh();
	//   });
	
	  context.subscriptions.push(dataProvider);
	  context.subscriptions.push(vscode.commands.registerCommand(CMD_OPEN_VIEW, async (item)=>{

		const csvFilePath = item.path;
		// const csvContent = fs.readFileSync(csvFilePath); 
		const {headers, rows} = await parseCsvToJson(csvFilePath);
	
		console.log(`found ${headers.length} columns`);
		console.log(`found ${rows.length} rows`);
		const transformerView = new WebviewInstance(context);
		console.log('send file_content');
		transformerView.sendMessageToWebView({
			type:'file_content', 
			payload: {
				headers,
				rows
			}
		});
	
		// const activeEditor = getActiveEditor();
		// const panel = await openWebviewPanel(context);
		// // Update Content to Webview
		// panel.webview.postMessage({
		// 	message:jsonData,
		// 	fileName:activeEditor.document.uri.fsPath
		// });

	  }));
	 

}

interface CsvContent {
	headers:string[],
	rows:any[]
  }
async function parseCsvToJson(filePath:string): Promise<CsvContent> {
	return new Promise((resolve, reject) => {
		let outputRows:any[] = [];


		fs.createReadStream(filePath)
		.pipe(csv())
		.on('data', (row) => {
			const modifiedRow :any= {};
			for (const key in row) {
				if (Object.hasOwnProperty.call(row, key)) {
					modifiedRow[key] = row[key];
				}
			}
			outputRows.push(modifiedRow);
		})
		.on('end', () => {
			
			const headers = Object.keys(outputRows[0]);
			const rows = outputRows;
			resolve({
				headers,
				rows
			});
		})
		.on('finish', () => {
			console.log('CSV file with escaped commas has been created!');
			
		});
		// const csvBuffer =  fs.readFileSync(filePath);
		// const csvData = Buffer.from(csvBuffer).toString('utf-8');
		// const lines = csvData.split('\n');
		// const [headerRow, ...otherRows] = lines;
		// const headers = headerRow.split(',');
		// const richTextFields = ['Description__c'];
		// const richTextIndex = headers.findIndex(item => richTextFields.includes(item));
		// const rows = otherRows.map(line => {
		// 	// const regex = new RegExp(`(?:[^,]*,){0,${headers.length - 1}}[^,]*`);
		// 	// const fixedLine = line.match(regex);
		// 	// if(fixedLine){
		// 	const values = fixedLine[0].split(',').map(value => `${value}`);
			
		// 		return headers.reduce((row:any, header, index) => {
		// 		row[header] = values[index];
		// 		return row;
		// 		}, {});
		// 	}
		//   );
		
		//   return {
		// 	headers,
		// 	rows
		//   };
		// return {
		// 	headers,
		// 	rows
		// };
	});	
}

function getActiveEditor():any {
	// Create and show a new webview
	const activeEditor = vscode.window.activeTextEditor;
	// const activeEditor = await vscode.workspace.openTextDocument();

	if (!activeEditor) {
		return;
	}
return activeEditor;
}
function openWebviewPanel(context:vscode.ExtensionContext):vscode.WebviewPanel{
	// Webview
	const panel = vscode.window.createWebviewPanel(
	   'jsonViewer', // Identifies the type of the webview. Used internally
	   'JSON Viewer', // Title of the panel displayed to the user
	   vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
	   {
		   localResourceRoots: [context.extensionUri],
		   enableScripts: true,
		   retainContextWhenHidden: true
	   } // Webview options. More on these later.
	   );

	   // Listen to Messages from UI Panel
	   panel.webview.onDidReceiveMessage( async (data) => {
	   
		   switch (data.type) {
			   case 'xmlfile':
					   vscode.window.showInformationMessage(`Converting Json to xml`);
					 
				   break;
			   case 'jsonfile':
				   vscode.window.showInformationMessage(`open Json file`);
				   // const jsonContent = JSON.parse(data.value);
				
			   break;
			   case 'refreshfile':
				   vscode.window.showInformationMessage(`Try to refresh`);
				   
			   break;
			   default:
				   vscode.window.showInformationMessage(`No Such command ${data.type}`);
		   }
	   });

	   panel.webview.html = getWebviewContent(context, panel.webview);
   return panel;
}
// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(context:vscode.ExtensionContext, webview: vscode.Webview) {
	// Load Scripts and CSS from media folder
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'jsoneditor.min.js'));
	const scriptMainUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'index.js'));
	const stylesJsonEditorUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'jsoneditor.min.css'));
	const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'main.css'));
	
	return `<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${stylesJsonEditorUri}" rel="stylesheet" type="text/css">
			<link href="${stylesMainUri}" rel="stylesheet" type="text/css">
		</head>
		<body>
			<div class="top-bar">
				<h1 id="filetitle" class="panel-file-title"></h1>
				<div class="panel-actions">
					<button id="refresh" class="nav-button" >Refresh</button>
					<button id="writejson" class="nav-button" >Write JSON</button>
					<button id="writexml" class="nav-button" >Write XML</button>
				</div>
			</div>
			<div id="jsoneditor" style="width: 100%; height: 800px;"></div>

			<script src="${scriptUri}"></script>
			<script src="${scriptMainUri}"></script>	
		</body>
	</html>`;
}
