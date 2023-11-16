import { LightningElement, track, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import STATUS_FIELD from '@salesforce/schema/Assignment__c.Status__c';
import upsertAssignments from "@salesforce/apex/AssignmentController.upsertAssignments";
import { MessageContext, publish } from "lightning/messageService";
import ASSIGNMENT_MESSAGE_CHANNEL from "@salesforce/messageChannel/AssignmentMessageChannel__c";

export default class AssignmentForm extends LightningElement {
    @track assignmentRecord = { 'sobjectType': 'Assignment__c' };
    @track statusOptions = [];
    subscription = null;
    @track hideNShow = {
        hideSave: false
    }
    
    get title() {
        return this.assignmentRecord.Name ? this.assignmentRecord.Name : 'Create Assignment'
    }

    get upsertButtonLabel() {
        return this.assignmentRecord.Id ? 'Update' : 'Save'
    }

    @wire(MessageContext)
    messageContext;

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: STATUS_FIELD})
    getIndustryPicklistValues({ error, data }) {
        if (data) {
            let options = [];
            data.values.forEach(picklist => {
                options.push({label: picklist.label, value: picklist.value});
            });
            this.statusOptions = options;
        } else if (error) {
            console.log('Error fetching Status '+error);
        }
    }

    handleSave() {
        let validationPass = true;

        this.template.querySelectorAll('[data-id="input_field"]').forEach(inputField => {
            if(!inputField.reportValidity()) {
                validationPass = false;
            }
            this.assignmentRecord[inputField.dataset.name] = inputField.value;
        });

        if(validationPass) {
            this.hideNShow.hideSave = true;
            console.log(JSON.stringify(this.assignmentRecord));
            
            upsertAssignments({ assg: this.assignmentRecord })
            .then((result) => {
                if (result.isSuccess) {

                    let tempMessage = this.assignmentRecord.Id ? 'Record Updated' : 'Record Created'
                    this.assignmentRecord = result.wrapperBody.asg_Updated;
                    this.assignmentRecord.sobjectType = 'Assignment__c';

                    console.log('#res ' + JSON.stringify(this.assignmentRecord));

                    this.showNotification('Success', tempMessage, 'success');
                      
                    publish(this.messageContext, ASSIGNMENT_MESSAGE_CHANNEL, {messageBody: 'refresh_table'});
                }
                else {
                    console.log('Error Saving Record ' + result.wrapperBody.error);
                    this.showNotification('Error', '', 'error');
                }
            })
            .catch((error) => {
                console.log('Error Saving Record '+error);
                this.showNotification('Error', '', 'error');
            })
            .finally(() => {
                this.hideNShow.hideSave = false;
            });
        }
    }

    handleClear() {
        this.template.querySelector('form').reset();
        this.assignmentRecord = { 'sobjectType': 'Assignment__c' };
    }

    showNotification(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        }));
    }
}