import { LightningElement, api } from 'lwc';

export default class Modal extends LightningElement {
    @api header;
    @api tagline;
    @api closeLabel;
    @api
    get modalId() {
        return this._modelId;
    }
    set modalId(value) {
        this._modelId = value;
    }
    _modelId = '01';
    @api size = 'small';

    connectedCallback() {
        // Handle modal size
        this.setModalSize();
    }

    setModalSize() {
        switch (this.size) {
            case 'small':
                this.classList.add('slds-modal_small');
                break;
            case 'medium':
                this.classList.add('slds-modal_medium');
                break;
            case 'large':
                this.classList.add('slds-modal_large');
                break;
            default:
                this.classList.add('slds-modal_medium');
        }
    }

    closeModal() {
        this.publishClose();
    }

    publishClose() {
        this.dispatchEvent(
            new CustomEvent('close', {
                detail: true
            })
        );
    }

    get headerTitle() {
        return this.header ? this.header : 'Title goes here...';
    }
    get headerTagline() {
        return this.tagline ? this.tagline : false;
    }
    get headingHtmlId() {
        return `modal-heading-${this.modalId}`;
    }
    get contentHtmlId() {
        return `modal-content-id-${this.modalId}`;
    }

    get closeText() {
        return this.closeLabel ? this.closeLabel : 'Close';
    }
}