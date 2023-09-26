/*
 * @Author: Yuval Vardi
 * LightSpeed
 * - File Plan Tree Items
 */
import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';

const SAMPLE_FILE_PLAN =  {"file_paths":"force-app/main/default/package.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/TLB_Case_Comments__c.object-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Data_Raised__c.field-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Entry__c.field-meta.xml\nforce-app/main/default/objects/TLB_Case_Comments__c/fields/TLB_Locked__c.field-meta.xml\nforce-app/main/default/profiles/TLB_Service_User.profile-meta.xml\nforce-app/main/default/permissionsets/TLB_HOC_Base.permissionset-meta.xml"};

export class FilesTreeProvider
  implements vscode.TreeDataProvider<FileItem>
{
    public filePlanNestedTree?: FileItem[];
    public filePlanFlatList: string[]|undefined;
    public selectedFilesPaths:Set<string>;
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<FileItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;
   // readonly onDidChangeSelection: vscode.Event<vscode.TreeViewSelectionChangeEvent<void>>


    constructor(private workspaceRoot?: string, filesPaths?:string[]) {
        if(filesPaths && filesPaths.length){
          this.filePlanNestedTree = this.convertToTreeItems(filesPaths);
        }
        this.selectedFilesPaths = new Set();
    }

    public setData(filePathArray:string[]){
      if(filePathArray && filePathArray.length){
          this.filePlanFlatList = filePathArray;
        // this.filePlanFlatList = filePathArray.split('\n');
          this.filePlanNestedTree = this.convertToTreeItems( this.filePlanFlatList );
          this.refresh();
      }
    }

    public getSelectedPathsSet(selected:any){
     // const selectedMap = new Map(selected.items);
      selected.items.forEach((element:any) => {
     // selectedMap.forEach((isChecked, treeItem, map) =>{
        const [ item, isChecked ] = element;
        if(!item.isFolder){
          if(isChecked === 1){
            this.selectedFilesPaths.add(item.path);
          }
          else {
            this.selectedFilesPaths.delete(item.path);
          }
        }
      });
      return this.selectedFilesPaths;
    }

    getTreeItem(element: FileItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
        return element;
      }
    
    getChildren(element?: FileItem|undefined): vscode.ProviderResult<FileItem[]> {
      if (element === undefined) {
          return this.filePlanNestedTree;
      }
      return element.children;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    findParent(treeItems?:FileItem[], parentId?:string, found?:FileItem[]): FileItem[]{
      if(treeItems && treeItems.length) {
        treeItems.forEach((item) =>{
            if(item.path === parentId) {
              found?.push(item);
            }
              found = this.findParent(item.children, parentId, found);
        });
      }
      return found ? found : [];
    }

    async delete(item:FileItem){
      const items = await this.getChildren();
      const parentsFound:FileItem[] | undefined = this.findParent(items!, item.parentPath, []);

      if( parentsFound ){
          const childIndex = parentsFound[0]?.children?.findIndex((line:FileItem) => line.path === item.path );
          if(childIndex !== -1){
            parentsFound[0].children?.splice(childIndex!, 1);
          }
          // In case parent folder is empty after delete - Delete it too
          if(!parentsFound[0].children?.length) {
            const emptyParentsFound = this.findParent(items!, parentsFound[0].parentPath, []); 
            if(emptyParentsFound) {
              const parentIndex = emptyParentsFound[0]?.children?.findIndex((line:FileItem) => line.path === parentsFound[0].path );
              if(parentIndex !== -1){
                emptyParentsFound[0].children?.splice(parentIndex!, 1);
              }
            }
          }
       
          this.refresh();
      }


    }

    public extractFilePaths(treeItems:FileItem[] | undefined | any, filePaths:string[]){
      if(treeItems && treeItems.length) {
        treeItems.forEach((item:FileItem) =>{
          if(!item.isFolder){
            filePaths.push(item.path);
          }
            filePaths = this.extractFilePaths(item.children, filePaths);
        });
      }
      return filePaths;
    }


    /**
     * @param filePaths - array of file paths
     * @returns Array of FileItem
     */
    convertToTreeItems(filePaths: string[]): FileItem[]|undefined {
      const root: FileItem = new FileItem('root', 'root', true);
      const fileMap: { [path: string]: FileItem } = {};
    
      filePaths.forEach((filePath) => {
        const parts = filePath.split('/');
        let currentPath = '';
    
        parts.forEach((part, index) => {
          currentPath += (index > 0 ? '/' : '') + part;
    
          if (!fileMap[currentPath]) {
            const isFolder = index < parts.length - 1;
            const file = new FileItem(part, currentPath, isFolder);
            file.parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
            fileMap[currentPath] = file;
    
            if (file.parentPath) {
              const parent = fileMap[file.parentPath];
              parent?.children?.push(file);
            } else {
              root?.children?.push(file);
            }
          }
        });
      });
    
      return root.children;
    }

}


export class FileItem extends vscode.TreeItem {
    public children: FileItem[]|undefined;
    public label:string;
    public path:string;
    public parentPath?: string;
    public isFolder?:boolean;
    constructor(label: string, path:string, isFolder:boolean) {
        super(label);

        this.children = [];
        this.label = label;
        this.path = path;
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
    
//   iconPath = {
//     light: path.join( __filename, '..', '..', 'media', 'icons', 'away.svg' ),
//     dark: path.join( __filename, '..', '..', 'media', 'icons', 'away.svg' )
//   };

    
 
}
