import { LightningElement, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getAllAssignments from '@salesforce/apex/AssignmentController.getAllAssignments';
import { MessageContext, subscribe, APPLICATION_SCOPE } from "lightning/messageService";
import ASSIGNMENT_MESSAGE_CHANNEL from "@salesforce/messageChannel/AssignmentMessageChannel__c";

const columns = [
    { label: 'Title', fieldName: 'Title__c', type: 'text' },
    { label: 'Description', fieldName: 'Description__c', type: 'text' },
    { label: 'DueDate', fieldName: 'DueDate__c', type: 'date-local' },
    { label: 'Status', fieldName: 'Status__c', type: 'text' },
    {
        label: 'Action', type: 'action', initialWidth: 50,
        typeAttributes: {
            rowActions: [
                { label: 'View', name: 'view' },
                { label: 'Edit', name: 'edit' }
            ]
        }
    }
];

export default class AssignmentList extends LightningElement {
    pageSize = 5;   // can store in label/custom metadata for easy manupulation
    currentPage = 1;
    totalPages = 0;
    @track wiredAssignmentsList = [];
    @track tableData = [];
    @track allTableData = [];
    @track tableColumn = columns;
    detailPageRecordId;
    detailPageFields = ['Name', 'Title__c', 'Description__c', 'DueDate__c', 'Status__c'];
    detailPageMode;
    subscription = null;

    @track HideNShowFlags = {
        showDetailsPage: false,
        isLoading: true
    }

    get dynamicHideNShowFlags() {
        return {
            prevButton: this.currentPage == 1,
            nextButton: this.currentPage == this.totalPages,
            showTable: this.tableData.length > 0
        }
    };

    @wire(MessageContext)
    messageContext;

    @wire(getAllAssignments) wiredResult(result) {
        this.wiredAssignmentsList = result;
        if (result.data) {
            this.processRecords(result.data);
        } else if (result.error) {
            console.log('Error Fetching Records: ' + result.error)
        }
        this.HideNShowFlags.isLoading = false;
    }

    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                ASSIGNMENT_MESSAGE_CHANNEL,
                (message) => this.handleMessage(message),
                { scope: APPLICATION_SCOPE },
            );
        }
    }

    handleMessage(lmsData) {
        if(lmsData.messageBody == 'refresh_table') {
            this.refreshTable();
        }
    }

    async refreshTable() {
        this.HideNShowFlags.isLoading = true;
        await refreshApex(this.wiredAssignmentsList);
        this.HideNShowFlags.isLoading = false;
    }

    handleSearch(event) {
        let searchKey = event.target.value.trim().toLowerCase();
        let tempData = [];

        if (searchKey) {
            this.wiredAssignmentsList.data.forEach(rec => {
                if (rec.Title__c.toLowerCase().includes(searchKey)) {
                    tempData.push(rec);
                }
            });
        }
        if (event.target.value.length == 0) {
            tempData = this.wiredAssignmentsList.data;
        }
        this.processRecords(tempData);
    }

    processRecords(allRecords) {
        this.allTableData = allRecords;
        this.totalPages = Math.ceil(allRecords.length / this.pageSize);
        this.tableData = allRecords.slice(0, this.pageSize);
    }

    handleRowAction(event) {
        if (event.detail.action.name == 'view') {
            this.detailPageRecordId = event.detail.row.Id;
            this.detailPageMode = 'readonly';
            this.HideNShowFlags.showDetailsPage = true;
        }
        else if (event.detail.action.name == 'edit') {
            this.detailPageRecordId = event.detail.row.Id;
            this.detailPageMode = 'edit';
            this.HideNShowFlags.showDetailsPage = true;
        }

    }

    previousHandler() {
        if (this.currentPage > 1) {
            this.currentPage = this.currentPage - 1;
            this.processPageRecords(this.currentPage);
        }
    }

    nextHandler() {
        if (this.currentPage < this.totalPages && this.currentPage != this.totalPages) {
            this.currentPage = this.currentPage + 1;
            this.processPageRecords(this.currentPage);
        }
    }

    processPageRecords(pageNo) {
        let startingRecord = ((pageNo - 1) * this.pageSize);
        let endingRecord = (this.pageSize * pageNo);
        let totalRecountCount = this.allTableData.length;

        endingRecord = (endingRecord > totalRecountCount) ? totalRecountCount : endingRecord;

        this.tableData = this.allTableData.slice(startingRecord, endingRecord);
    }

    handleModal(event) {
        this.HideNShowFlags.showDetailsPage = !event.detail.closeModal;
        this.refreshTable();
    }

}