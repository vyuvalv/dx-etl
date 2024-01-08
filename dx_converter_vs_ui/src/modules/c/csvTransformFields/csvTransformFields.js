import { LightningElement, api, track } from 'lwc';

import {createUUID, reduceErrors } from '../commonUtils/commonUtils';

export default class CsvTransformFields extends LightningElement {
    @api columns;

    @track _fieldsMapping = [];

    outputMap = new Map();

    connectedCallback(){
        
    }
    handleSourceFieldChange(event){
        const mappingId = event.target.dataset.id;
        const activeSourceField = event.target.value;
        this.outputMap.set(mappingId, {
            id:mappingId,
            source: activeSourceField,
            target: ''
        });
        console.log(activeSourceField);
    }
    handleTargetFieldChange(event){
        const mappingId = event.target.dataset.id;
        const source = event.target.dataset.source;
        const target = event.target.value;
        console.log('source: ' + source);
        console.log('target: '+ target);
        if(this.outputMap.has(mappingId)){
            let row = this.outputMap.get(mappingId);
            row.target = target;
        }
        else {
            this.outputMap.set(mappingId, {
                id:mappingId,
                source: source,
                target: target
            });
        }
       
    }

    handleNewRow(){
        if( !this._fieldsMapping.length ){
            this._fieldsMapping = [{
                id:createUUID(),
                source:'Id',
                target:''
            }];
        }

        // this._fieldsMapping.push({
        //     id:createUUID(),
        //     source:'Id',
        //     target:''
        // });
        this._fieldsMapping.splice(0,0,{
            id:createUUID(),
            source:'Id',
            target:''
        });
    }
    handleDeleteRow(event){
        const mappingId = event.target.dataset.id;
        const filteredOut = this._fieldsMapping.filter(item => item.id !== mappingId);
        if(filteredOut.length >0){
            this._fieldsMapping = filteredOut;
        }
        
    }
    submitMap(){
        this.dispatchEvent(new CustomEvent('convert',{
            detail:{
                mappings:this.outputMap
            }
        }));
    }

    get fieldOptions(){
        return this.columns;
    }
    get fieldsMapping(){
        return this._fieldsMapping.length > 0 ? this._fieldsMapping : [
            {
                id:createUUID(),
                sourceField:'',
                targetField:''
            }
        ];
    }
}