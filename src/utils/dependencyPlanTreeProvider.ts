/*
 * @Author: Yuval Vardi
 * LightSpeed
 * Dependency Plam Tree Items
 */
import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';

export class PromptHistoryTreeProvider
  implements vscode.TreeDataProvider<TreeLineItem>
{
    public dependencyPlanItems: TreeLineItem[];

    private _onDidChangeTreeData: vscode.EventEmitter<TreeLineItem | undefined | void> = new vscode.EventEmitter<TreeLineItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeLineItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot?: string) {
      this.dependencyPlanItems = [];
    }

    getTreeItem(element: TreeLineItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
        return element;
      }
    
    getChildren(element?: TreeLineItem|undefined): vscode.ProviderResult<TreeLineItem[]> {
    if (element === undefined) {
        return this.dependencyPlanItems;
    }
    return element.children;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    // Response has changed - TODO - need to adapt to array tree
    public setTree(depsPlan:string[]){
      let items: TreeLineItem[] = [];
      depsPlan.forEach((planItem:any, index:number) => {
        if(planItem){
          items.push( new TreeLineItem(`${index}-${planItem}`,index,true, []));
        }
      });
      this.dependencyPlanItems = items;
      this.refresh();
    }
    public setData(depsPlanRaw:string){
      const depsPlan = this.parseDependenciesText(depsPlanRaw);
      let items: TreeLineItem[] = [];
      depsPlan.forEach((planItem:any) => {
        if(planItem){
          items.push( new TreeLineItem(`${planItem.order}-${planItem.value}`,planItem.order,true, planItem.dependencies));
        }
      });

      this.dependencyPlanItems = items;
    }


    private parseDependenciesText(inputText:string):any[] {
      const items:any[] = [];
     // const sections = inputText.split(/\d+\.\s/).filter(Boolean);
      const sections = JSON.parse(inputText);
    
      for (let i = 1; i < sections.length; i++) {
        const lines = sections[i].split(' ');
      const sectionOrder = i;
      const value = lines[0];
      const description = `${lines[1]?lines[1]:''} ${lines[2]?lines[2]:''}`.trim(); 
     // const dependencies =[];
      
      items.push({ value, order: sectionOrder, dependencies:[], description });
      }
    
      return items;
  }

}


class TreeLineItem extends vscode.TreeItem {
    public children: TreeLineItem[]|undefined;
    public label:string;
    public order:number;
    public dependencies: string[]|undefined;
    constructor(label: string, order:number, isParent:boolean, dependencies:string[]) {
        super(label);
        const details = this.dependencies ? this.dependencies.join('\n') : '';
        this.order = order;
        this.dependencies = dependencies;

        this.children = isParent ? this.buildChildren(dependencies) :undefined;
        this.label = label;
        this.tooltip = isParent ? this.dependencies.join('\n') : label;
        this.description = details;
        this.contextValue =  isParent ? 'depsPlanFile' : 'depItemDescription';
       // this.iconPath = vscode.ThemeIcon.Folder;
        this.collapsibleState =  this.children && this.children.length ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
        this.checkboxState = {
            state:vscode.TreeItemCheckboxState.Checked
        };
    }
    buildChildren(deps:string[]){
      return deps.length ? deps.map((depItem:string, ind:number)=> new TreeLineItem(depItem, ind,false, [])):[];
    }
    
//   iconPath = {
//     light: path.join( __filename, '..', '..', 'media', 'icons', 'away.svg' ),
//     dark: path.join( __filename, '..', '..', 'media', 'icons', 'away.svg' )
//   };

    
 
}
