import { LightningElement, track, api } from 'lwc';

export default class SelectionPalette extends LightningElement {
    @track recsLstMap = {};
    @track mapkeyvaluestore=[];
    @track hideTT = true;
    @track _lstDataTableColumns;
    @track _victimData;
    @track _masterData;
    @api masterRowId;
    @api sObjectName;
    @track recordToUpdate; 
    @api recordSelectedValues;
    @api
    get masterData(){
        return this._masterData;
    }
    set masterData(value){
        this._masterData = value;
    }
    @api
    get victimData(){
        return this._victimData;
    }
    set victimData(value){
        this._victimData = value;
    }
    @api
    get lstDataTableColumns(){
        return this._lstDataTableColumns;
    }
    set lstDataTableColumns(value){
        this._lstDataTableColumns = value;
        this._lstDataTableColumns.forEach(element => {
            let fldLbl = element.label;
            let fldApi = element.fieldName;
            this.masterData.forEach(ele => {
                if(ele.Id === this.masterRowId){
                    let newLst;
                    let selection = false;
                    /*if(ele[fldApi]){
                        selection = (this.recordSelectedValues[fldApi] === ele[fldApi]) ? true: false;
                        newLst= [{radioLabel:ele[fldApi], selected:selection}];
                    }else {
                        newLst = [{radioLabel:"", selected:true}];
                    }*/
                    if(this.recordSelectedValues[fldApi] === null) {
                        if(ele[fldApi]){
                            newLst= [{radioLabel:ele[fldApi], selected:true}];
                        } else {
                            newLst= [{radioLabel:"", selected:true}];
                        }
                    } else if(ele[fldApi]){
                        selection = (this.recordSelectedValues[fldApi] === ele[fldApi]) ? true: false;
                        newLst= [{radioLabel:ele[fldApi], selected:selection}];
                    }else if(!this.recsLstMap[fldLbl]){    // for 1st column selection on 1st click
                        newLst = [{radioLabel:"", selected:true}];
                    }else {
                        newLst = [{radioLabel:"", selected:false}];
                    }
                    this.recsLstMap[fldLbl] = newLst;
                }
            });
            this.victimData.forEach(ele => {
                if(this.recsLstMap.hasOwnProperty(fldLbl)){
                    let selection = false;
                    /*if(ele[fldApi]){
                        selection = (this.recordSelectedValues[fldApi] === ele[fldApi]) ? true: false;
                        this.recsLstMap[fldLbl].push({radioLabel:ele[fldApi], selected:selection});
                    } else{
                        this.recsLstMap[fldLbl].push({radioLabel:"", selected:false});
                    } */    
                    if(this.recordSelectedValues[fldApi] === null) {
                        if(ele[fldApi]){
                            this.recsLstMap[fldLbl].push({radioLabel:ele[fldApi], selected:true});
                        } else {
                            this.recsLstMap[fldLbl].push({radioLabel:"", selected:true});
                        }
                    } else if(ele[fldApi]){
                        selection = (this.recordSelectedValues[fldApi] === ele[fldApi]) ? true: false;
                        this.recsLstMap[fldLbl].push({radioLabel:ele[fldApi], selected:selection});
                    }else {
                        this.recsLstMap[fldLbl].push({radioLabel:"", selected:false});
                    }               
                } 
            });
        });
        
        this.hideTT = (Object.keys(this.recsLstMap).length === 0);
        
        if(this.recsLstMap){
            let dataMap = this.recsLstMap;
            for(var key in dataMap){
                this.mapkeyvaluestore.push({key:key,value:dataMap[key]});
            }
        }
    } 
    
    handleRadioClick(event){
        let currentVal = event.target.value;
        this.template.querySelector('[data-id="'+currentVal+'"]').className='selectedCol';
        // this.template.querySelector('[data-id="'+currentVal+'"]').classList.add("selectedCol");
        console.log('td>>'+event.target.dataset.targetId);
        this.recordToUpdate = {Id:this.masterRowId};
        this.lstDataTableColumns.forEach(element => {
            let fldLbl = element.label;
            let fldApi = element.fieldName;
            if(event.target.name === fldLbl) {
                this.recordToUpdate['updatedValue']=event.target.value ? event.target.value: null; 
                this.recordToUpdate['fieldApiName']=fldApi;
            }           
        });
        const selectedEvent = new CustomEvent('selected', { detail: this.recordToUpdate});
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }
}