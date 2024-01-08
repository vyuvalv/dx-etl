import { LightningElement, api, track } from 'lwc';
import { copyToClipboard, createUUID } from '../commonUtils/commonUtils';
import { EXAMPLES } from './data/examples';


export default class PromptWindow extends LightningElement {

  @track _prompt = {
    description:'Short Description',
    role:'Salesforce Admin',
    action:'Create',
    output:'report',
    acceptanceCriterias: [`All metadata entries will use the prefix of YV_`]
  }
  @api
  updatePrompt(value){
    this._prompt = JSON.parse(value);
  }

  connectedCallback(){

  }
  
  get prompt(){
    return this._prompt ? {
      ...this._prompt,
      acceptanceCriterias: this._prompt.acceptanceCriterias.map((ac,index)=>({
        value:ac,
        order:index + 1,
        id: createUUID() 
      }))
    } : null;
  }

  handleItemChange(event){
    const inputIndex = parseInt(event.currentTarget.dataset.index);
    const inputValue = event.target.value;
    const section = event.currentTarget.dataset.section;
    switch (section) {
      case 'ac':
          // window.setTimeout(()=>{
          this._prompt.acceptanceCriterias[inputIndex] = inputValue;
          // },200);
        break;
    
      default:
        console.log('Could not save value...');
        break;
    }
  }

  handleChangeInput(event){
    const inputType = event.target.dataset.section;
    const inputValue = event.target.value;
    // update prompt attributes
    this._prompt[inputType] = inputValue;
  }


  handleSubmit(){
    const requirementPrompt = `
        Description: ${this.prompt.description} \n 
        As a : ${this.prompt.role} \n 
        I want to : ${this.prompt.action} \n 
        So that I can : ${this.prompt.output} \n 
        Acceptance Criteria: ${this.prompt.acceptanceCriterias.map(ac=>ac.value).join(',')}
    `;
    console.log(`requirementPrompt : ${requirementPrompt}`);
    this.publish('generatePlan', requirementPrompt);
  }
  handleSubmitForRefinment(){
    const requirementPrompt = `
        Description: ${this.prompt.description} \n 
        As a : ${this.prompt.role} \n 
        I want to : ${this.prompt.action} \n 
        So that I can : ${this.prompt.output} \n 
        Acceptance Criteria: ${this.prompt.acceptanceCriterias.map(ac=>ac.value).join(',')}
    `;
    console.log(`requirementPrompt : ${requirementPrompt}`);
    this.publish('userStory', requirementPrompt);
  }

  publish(mode='generatePlan', prompt){
    this.dispatchEvent(new CustomEvent('submitprompt',{
      detail:{
        prompt,
        mode
      }
    }))
  }

  handleClear(){
    // const textarea = this.template.querySelector('textarea');
    // textarea.value = '';
    this._prompt.description = '';
  }

  /**
   * Examples Library 
   */

  // intro = `You are a helpful Salesforce AI code assistant that can teach a junior developer how to code. Your language of choice is Apex and Javascript. Don't explain the code, just generate the code block itself.`;

  _promptExamples = EXAMPLES;

  handleCopyToClipboard(event){
    const copiedValue = event.currentTarget.dataset.value;
    copyToClipboard(copiedValue);
    const buttons = this.template.querySelectorAll('.copy-button');
    const copyButton = [...buttons].filter(but => but.title='copy');
    if(copyButton){
      // Highlight being copy
      copyButton[0].iconName = 'utility:check';

      window.setTimeout(()=>{
        copyButton[0].iconName = 'utility:copy';
      },500);
  
    console.log('copied: ' + copiedValue);
    }
  }
  
  pageIndex =0;
  pageSize = 1;

  get promptExamples(){
    const sliced = this._promptExamples.map(ex=>({ value: ex, id: createUUID() }));
    return sliced.slice(this.pageIndex,this.pageSize);
  }
  get first(){
    return this.pageIndex === 0;
  }
  get last(){
    return this.pageIndex === (this._promptExamples.length-1);
  }
  handleNext(){
    this.pageIndex++;
    this.pageSize++;
  }

  handleBack(){
    this.pageIndex--;
    this.pageSize--;
  }


  /* 
  * Handle acceptanceCriterias array
  */
  addCriteriaLine(){
    this._prompt.acceptanceCriterias.push('');
  }
  deleteCriteriaLine(event){
    const index = parseInt(event.currentTarget.dataset.index);
    this._prompt.acceptanceCriterias.splice(index, 1);
  }
}
