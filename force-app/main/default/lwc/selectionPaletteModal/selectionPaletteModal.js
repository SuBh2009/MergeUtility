import { LightningElement, api, track } from 'lwc';

export default class SelectionPaletteModal extends LightningElement {

    @track _hasVictimData;
    @track modalBlock;
    @api masterRowId;
    _response;
    _recordDataMap;
    masterData;
    victimDataMap;
    lstDataTableColumns;
    victimData;
    disableSave = true;
    updatedMasterRecord;
    @api recordSelectedValues;
    @api sObjectName;
    @api
    get hasVictimData(){
        return this._hasVictimData;
    }
    set hasVictimData(value){
        this._hasVictimData = value;
        if(this._hasVictimData){
            this.modalBlock = "slds-modal--large slds-modal slds-fade-in-open";
        } else {
            this.modalBlock = "slds-modal--medium slds-modal slds-fade-in-open";
        }
    }
    @api
    get response(){
        return this._response;
    }
    set response(value){
        this._response = value;
        this.masterData = this._response.surviorDataList;
        this.victimDataMap = this._response.victimRecordMap;
        this.victimData= this.victimDataMap[this.masterRowId];
        this.lstDataTableColumns = this._response.lstDataTableColumns;
    }
    @api
    get recordDataMap(){
        return this._recordDataMap;
    }
    set recordDataMap(value){
        this._recordDataMap = value;
        // console.log('recordDataMap>>'+JSON.stringify(this.recordDataMap));
        this.updatedMasterRecord = JSON.parse(JSON.stringify(this.recordDataMap[this.masterRowId]));
    }
    closeModalAction(){
        // this.modalContainer=false;
        this.disableSave = true;
        const selectedEvent = new CustomEvent('closemodal', { detail: false});
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }
    collectData(event){
        this.disableSave = false;
        let fldApi = event.detail.fieldApiName;
        this.updatedMasterRecord[fldApi] = event.detail.updatedValue;
    }
    saveModalAction(){
        if(this.updatedMasterRecord){
            const selectedEvent = new CustomEvent('savemodal', { detail: {recId :this.masterRowId, recData :this.updatedMasterRecord}});
            // Dispatches the event.
            this.dispatchEvent(selectedEvent);
        }
    }
}