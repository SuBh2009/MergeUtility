import { LightningElement, api, wire, track } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import readCSV from '@salesforce/apex/MergeController.readCSVFile';
import handleMerge from '@salesforce/apex/MergeController.handleMergeRecord';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import MERGE_CONCERN from '@salesforce/schema/Merge_Concern__c';
import OBJECT_FIELD from '@salesforce/schema/Merge_Concern__c.Object_Name__c';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import {exportCSVFile} from 'c/utils'
//import {exportSampleCSVFile} from 'c/utils'



const columns = [
    {
        label: 'View',  type: 'button-icon', initialWidth: 75,
        typeAttributes: {
            iconName: 'action:preview',
            title: 'Preview',
            variant: 'border-filled',
            alternativeText: 'View'
        }
    },
    { label: 'Master Record Name', fieldName: 'Name'}
    ];

export default class MergeSobjectRecord extends LightningElement {
   
    @track masterRowId;
    @api recordId;
    error;
    @api isLoaded = false;
    sObjectName;
    displayFileUpload = false;
    loadingMessage;
    columns = [];
    masterData=[];
    victimDataMap=[];
    modalContainer = false;
    hasVictimData = false;
    lstDataTableColumns =[];
    response;
    disableMergeButton = true;
    mergedCSVMap= [];
    // accepted parameters
    get acceptedFormats() {
        return ['.csv'];
    }

    headers = {
        id:"Id",
        masterId:"Master Id",
        status:"Status"
    }

    sampleDataheaders = {
        victimId:"Victim/Duplicate Id",
        masterId:"Master Id"
    }
    sampleData= [
        {
            victimId:"0015j00000CyagSAAR",
            masterId:"0015j00000CyagSAAR"
        },
        {
            victimId:"0015j00000D00N2AAJ",
            masterId:"0015j00000CyagSAAR"
        },
        {
            victimId:"0015j00000D00N3AAJ",
            masterId:"0015j00000CyagSAAR"
        }
    ]


    channelName = '/event/Merge_Event__e';
    isSubscribeDisabled = false;
    isUnsubscribeDisabled = !this.isSubscribeDisabled;
    subscription = {};

    @wire (getObjectInfo, { objectApiName: MERGE_CONCERN })

    sObjectMetadata;

    @wire(getPicklistValues,
        {
            recordTypeId: '$sObjectMetadata.data.defaultRecordTypeId', 
            fieldApiName: OBJECT_FIELD
        })
        objectPicklist;  

    displayFileUploadSec(event) {
        this.sObjectName = event.detail.value;
        this.displayFileUpload = true;
    }      
    handleChannelName(event) {
        this.channelName = event.target.value;
    }
     // Initializes the component
     connectedCallback() {       
        // Register error listener       
        this.registerErrorListener();     
        this.handleSubscribe(); 
    }

    handleUploadFinished(event) {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;

        // calling apex class
        readCSV({contentDocumentId : uploadedFiles[0].documentId,
                 sobjectName : this.sObjectName})
        .then(result => {
            this.response = JSON.parse(result);
            this.masterData = this.response.surviorDataList;
            this.victimDataMap = this.response.victimRecordMap;
            this.columns = columns;
            this.lstDataTableColumns = this.response.lstDataTableColumns;
            this.disableMergeButton = Object.keys(this.response.victimMasterRecordMap).length > 0 ? false : true;
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Accounts are fetched based CSV file!!!',
                    variant: 'success',
                }),
            );
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

    handleRowAction(event){
        const dataRow = event.detail.row;
        this.victimData= this.victimDataMap[dataRow.Id];
        this.hasVictimData  = this.victimData.length > 0 ? true : false;
        this.modalContainer=true;
        this.masterRowId = dataRow.Id;
     }
   
     closeModalAction(){
      this.modalContainer=false;
     }

     handleMergeRecord(event) {
        this.disableMergeButton = true;
        this.loadingMessage = "Merging in Progress!!";
        this.isLoaded = true;
        handleMerge({mergeRecords : JSON.stringify(this.response)})
        .then(result => {
			this.error = undefined;
		})
		.catch(error => {
			this.error = error;
			//this.accounts = undefined;
		})

     }

     handleSubscribe() {
        // Callback invoked whenever a new event message is received
        const thisReference = this;
        const messageCallback = function(response) {
           
            console.log('--length---', Object.keys(JSON.parse(response.data.payload.Records_Ids__c).resperror).length);
            var obj = JSON.parse(response.data.payload.Records_Ids__c).resperror;
            if(Object.keys(obj).length)
            {
                thisReference.createMergeStatusCSV(obj);
            }
            thisReference.isLoaded = false;
            console.log('New message received 5: ', this.channelName);
            //thisReference.dispatchEvent(evt);
            thisReference.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Merging proces completed!!!',
                    variant: 'success',
                }),
            );
            // Response contains the payload of the new message received
        };

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on subscribe call
            console.log('Subscription request sent to: ', JSON.stringify(response.channel));
            this.subscription = response;
        });
    }

    registerErrorListener() {
        // Invoke onError empApi method
        onError(error => {
            console.log('Received error from server: ', JSON.stringify(error));
            // Error contains the server-side error
        });
    }

    createMergeStatusCSV(obj){
        for(let masterId in obj){
            for( let index in obj[masterId]){
                this.mergedCSVMap.push({id:obj[masterId][index].victimId, masterId:masterId, status:obj[masterId][index].errorMsg});
            }
        }
        this.downloadAccountData();
    }
    downloadAccountData(){
        exportCSVFile(this.headers, this.mergedCSVMap, "Merge Duplicate Record Status")
    }

    dowmloadSampleCSV(){
        exportCSVFile(this.sampleDataheaders, this.sampleData, "Merge Duplicate Records")
    }
}