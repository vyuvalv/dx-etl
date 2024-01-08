/*
 * @Author: Yuval Vardi
 * LightSpeed
 * - File Plan Tree Items
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class CsvFileTreeProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<FileItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;
  // readonly onDidChangeSelection: vscode.Event<vscode.TreeViewSelectionChangeEvent<void>>
  private parentMap: Map<string, FileItem>;
  private items:FileItem[] =[];
  constructor(private workspaceRoot: string) {
    this.parentMap = new Map();
  }

  getTreeItem(element: FileItem): vscode.TreeItem {
    return element;
  }
  async getChildren(element?: FileItem): Promise<FileItem[]|any> {

    const exludedFolder = [
      '/Users/yvardi/Code/Tooling/FileConverter/.vscode/tours',
      '/Users/yvardi/Code/Tooling/FileConverter/.tours'];

    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No csv in empty workspace');
      return Promise.resolve([]);
    }
    const folderPath = element ? element.path : this.workspaceRoot;
    if(this.pathExists(folderPath) && !exludedFolder.includes(folderPath)){
    // Gets all csv files
    let fileItems:FileItem[] =  await this.getFilesInFolder(folderPath);
    if(fileItems.length){
        // Build Parent folder and group files
        fileItems.forEach(item =>{
          if(!this.parentMap.has(item.parentPath)){
            const folderName =  path.basename(item.parentPath);
            this.parentMap.set(item.parentPath, new FileItem(folderName, item.parentPath, true)); 
          }
          else {
            const parent = this.parentMap.get(item.parentPath);
            parent?.children?.push(item);
            if(parent){
              this.parentMap.set(item.parentPath, parent);
            }
          }
        });
        this.parentMap.forEach((value,key) =>{
            this.items.push(value);
        });
       
      }

        if (element === undefined) {
          return this.items;
        }
        // else {
        //   element.children = this.items;
        // }
        return element.children;
    }
    else {
        vscode.window.showInformationMessage('No path');
        return Promise.resolve([]);
    }

  }

   /**
   * Given the workspace root path read all csv files
   */
  private async getFilesInFolder(folderPath: string): Promise<FileItem[]> {
    const dirents = await fs.promises.readdir(folderPath, { withFileTypes: true });
   // const files: fs.Dirent[] = [];
    let items:FileItem[] =[];
    for (const dirent of dirents) {
      const fullPath = path.join(folderPath, dirent.name);

      if (dirent.isDirectory()) {
        const nestedFiles = await this.getFilesInFolder(fullPath);
        items.push(...nestedFiles);
      } else if (dirent.isFile() && path.extname(dirent.name) === '.csv') {
        const fileItem = new FileItem(dirent.name, fullPath, false);
        items.push(fileItem);
        // files.push(dirent);
      }
    }

    return items;
  }
    

  // A method that returns the subfolders and CSV files of a given folder URI
async getFolderChildren(folder: vscode.Uri): Promise<vscode.TreeItem[]> {
  // Initialize an empty array for the children
  const children: vscode.TreeItem[] = [];
  // Find all the files and folders in the given folder URI
  const files = await vscode.workspace.fs.readDirectory(folder);
  // Loop through the files and folders
  for (const file of files) {
      // Get the file name and type
      const [fileName, fileType] = file;
      // Get the file URI
      const fileUri = folder.with({ path: path.join(folder.path, fileName) });
      // If the file type is a directory, create a Folder object and push it to the children array
      if (fileType === vscode.FileType.Directory) {
          children.push(new Folder(fileName, vscode.TreeItemCollapsibleState.Collapsed, fileUri));
      }
      // If the file type is a file and the file extension is .csv, create a CsvFile object and push it to the children array
      if (fileType === vscode.FileType.File && path.extname(fileName) === '.csv') {
          children.push(new CsvFile(fileName, vscode.TreeItemCollapsibleState.None, fileUri));
      }
  }
  // Return the children array
  return children;
}
  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
  

  getWorkspaceFolders(): vscode.ProviderResult<vscode.TreeItem[]> {
    // Get the workspace folders as URIs
    const folders = vscode.workspace.workspaceFolders?.map(folder => folder.uri);
    if (folders) {
        // Map each folder URI to a Folder object
        return folders.map(folder => new Folder(path.basename(folder.fsPath), vscode.TreeItemCollapsibleState.Collapsed, folder));
    } else {
        // If no workspace folders, return an empty array
        return [];
    }
}




    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

 

}
class CsvFile extends vscode.TreeItem {
  constructor(
      public readonly label: string,
      public readonly collapsibleState: vscode.TreeItemCollapsibleState,
      public readonly resourceUri: vscode.Uri
  ) {
      super(label, collapsibleState);
      this.contextValue = 'csvFile';
      this.command = {
          command: 'vscode.open',
          arguments: [this.resourceUri],
          title: 'Open CSV File'
      };
  }
}
// A class that represents a folder node in the tree view
class Folder extends vscode.TreeItem {
  constructor(
      public readonly label: string,
      public readonly collapsibleState: vscode.TreeItemCollapsibleState,
      public readonly resourceUri: vscode.Uri
  ) {
      super(label, collapsibleState);
      this.contextValue = 'folder';
  }
}
export class FileItem extends vscode.TreeItem {
  public children: FileItem[]|undefined;
  public label:string;
  public path:string;
  public parentPath: string;
  public isFolder?:boolean;
  constructor(label: string, path:string, isFolder:boolean) {
      super(label);

      this.children = [];
      this.label = label;
      this.path = path;
      this.parentPath = !isFolder ? path?.substring(0, path.lastIndexOf('/')):'root';
      this.isFolder = isFolder;
      this.tooltip =  this.isFolder ?'folder':'file';
      this.description = path;
      this.contextValue =  this.isFolder?'folder':'file';
      this.iconPath =  this.isFolder ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;
      this.collapsibleState = this.isFolder ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
      this.checkboxState = {
          state:vscode.TreeItemCheckboxState.Checked
      };
  }
}
