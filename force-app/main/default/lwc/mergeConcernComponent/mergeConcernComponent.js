import { LightningElement, wire  } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import MERGE_CONCERN from '@salesforce/schema/Merge_Concern__c';
import OBJECT_FIELD from '@salesforce/schema/Merge_Concern__c.Object_Name__c';
import fetchSobjectFields from '@salesforce/apex/MergeController.getSobjectFields';
import handleMergeConRecord from '@salesforce/apex/MergeController.handleMergeConRecord';

export default class CustomModal extends LightningElement {

    showModal = false;
    sObjectName;
    sObjectFieldsList;
    selectedValues;
    response;
    disabledSaveBtn = true;

    // to get the default record type id, if you dont' have any recordtypes then it will get master

    @wire (getObjectInfo, { objectApiName: MERGE_CONCERN })

    sObjectMetadata;

    @wire(getPicklistValues,
        {
            recordTypeId: '$sObjectMetadata.data.defaultRecordTypeId', 
            fieldApiName: OBJECT_FIELD
        })
        objectPicklist;    
    openModal() {
        // Setting boolean variable to true, this will show the Modal
        this.showModal = true;
    }

    closeModal() {
        // Setting boolean variable to false, this will hide the Modal
        this.showModal = false;
    }

    handleChange(event) {
        this.selectedValues = event.detail;
        this.disabledSaveBtn = JSON.parse(JSON.stringify(this.selectedValues)).length > 0 ? false : true;
    }
    
    fetchRelatedFields(event) {
        this.sObjectName = event.detail.value;
        fetchSobjectFields({sobjectName : this.sObjectName})
        .then(result => {
            this.response = JSON.parse(result);
            this.sObjectFieldsList = this.response['sObjectFieldsListMap'][this.sObjectName];
        })
        .catch(error => {
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: JSON.stringify(error.body.message),
                    variant: 'error',
                }),
            );     
        })
    }

    handleSave(event) {
        const picklistFields = this.template.querySelectorAll('lightning-combobox');
        let savedData = {};
        if (picklistFields) {
            picklistFields.forEach(field => {
                savedData[field.name] = field.value;
            });
        }
        savedData['fieldApiList'] = JSON.parse(JSON.stringify(this.selectedValues));
        const chkBoxFields = this.template.querySelectorAll('lightning-input');
        if (chkBoxFields) {
            chkBoxFields.forEach(field => {
                savedData[field.name] = field.checked;
            });
        }
        console.log('--savedDatasavedData--', savedData);
        handleMergeConRecord({mergeConcernRecord : JSON.stringify(savedData)})
        .then(result => {
			this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Record saved successfully!!!',
                    variant: 'success',
                }),
            );
            this.closeModal();
		})
		.catch(error => {
			this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: JSON.stringify(error),
                    variant: 'error',
                }),
            ); 
		})
    }
}