import { LightningElement } from 'lwc';

export default class App extends LightningElement {

  // vscode;

  connectedCallback() {
    // if (typeof acquireVsCodeApi === 'function') {
    //   this.vscode = acquireVsCodeApi(); // eslint-disable-line
    // }
  }

  // onSendEventToVsCode() {
  //   // Send message to server
  //   const message = {type:'create_button_clicked', payload: this.contents};
  //   console.log(this.contents);
  //   this.vscode?.postMessage(message);
  // }

}
