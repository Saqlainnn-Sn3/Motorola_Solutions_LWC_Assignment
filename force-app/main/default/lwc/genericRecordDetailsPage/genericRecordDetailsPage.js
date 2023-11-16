import { LightningElement, api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class GenericRecordDetailsPage extends LightningModal {
    @api objectApiName;
    @api recordId;
    @api fields;
    @api mode;
    refreshAssignmentTable = false;
    
    closeModal() {
        this.dispatchEvent(new CustomEvent('closemodal', {
            detail: {
                closeModal: true,
                refreshTable: this.refreshAssignmentTable
            }
        }));
    }

    handleSuccess() {
        this.refreshAssignmentTable = true;
    }
}