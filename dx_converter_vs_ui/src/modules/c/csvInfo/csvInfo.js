import { LightningElement, track } from 'lwc';

import {createUUID, reduceErrors } from '../commonUtils/commonUtils';

import {SAMPLE_CSV} from './data/sample';
//const APP_LOGO = './resources/images/rocket-einstein.png';

export default class CsvInfo extends LightningElement {
    vscode;
    // logo = APP_LOGO;
    // Files
    @track _columns = [];
    @track _rows = [];
    fieldMap = new Map();
    sourceField = '';
    targetField = '';

   connectedCallback(){
    const {headers,rows} = SAMPLE_CSV;
    console.log(`X found ${headers.length} columns`);
    console.log(`found ${rows.length} rows`);
    
    this._columns = [...headers];
    this._rows = rows;
    
    try {
      if (typeof window.acquireVsCodeApi === 'function') {
        this.vscode = window.acquireVsCodeApi(); // eslint-disable-line
        this.listenToVsCode();
      }
    } catch (error) {
        console.log('could not get vscode.. ' + error);
       
    }
     
   }

   listenToVsCode(){
      window.addEventListener("message", (event) => {
        const {type, payload} = event.data;
        //
        switch (type) {
          case 'file_content':
           
            console.log('got csv ');
            const {headers,rows} = payload;
            console.log(`X found ${headers.length} columns`);
            console.log(`found ${rows.length} rows`);
            
            this._columns = [...headers];
            this._rows = rows;
         
           
            break;
          case 'editor':
           // 
     
            break;
          case 'toggle_tab':
         
            break;
          default:
            break;
        }
       console.log('type: ' + type);
       console.log('payload: ' + JSON.stringify(payload));
     
      });
   }

   get columns(){
    return this._columns ? this._columns :[];
   }
   get totalRows(){
    return this._rows ? this._rows.length: 0;
   }
 
   get rows(){
    const cols = this.columns;
    return cols.length ? this._rows.map((row,ind) =>({
      id:createUUID(),
      fields:cols.map(col =>({
        fieldName:col,
        fieldValue:row[col]
      }))
    })):[];
   }

get fieldOptions(){
  const cols = this.columns;
  return cols.length ? cols.map(col =>({
    label: col, 
    value: col,
  })):[];
}

handleUpdateData(event){
  const {mappings} = event.detail;
  console.log(mappings);
  console.log('mapping');
}

  syncFilePlan(){
    this.sendToVsCode('syncfiles', true);
  }
 
}