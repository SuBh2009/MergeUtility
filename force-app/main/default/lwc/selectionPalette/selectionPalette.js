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
    @track selectedValuesMap;
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
        this.selectedValuesMap = this.recordSelectedValues;
        this._lstDataTableColumns.forEach(element => {
            let fldLbl = element.label;
            let fldApi = element.fieldName;
            this.masterData.forEach(ele => {
                if(ele.Id === this.masterRowId){
                    let newLst;
                    let selection = false;
                    if(this.recordSelectedValues[fldApi] === null) {
                        if(ele[fldApi]){
                            newLst= [{radioLabel:ele[fldApi], selected:true, fldApi:fldApi, cls:"selectedCol"}];
                        } else {
                            newLst= [{radioLabel:"", selected:true, fldApi:fldApi, cls:"selectedCol"}];
                        }
                    } else if(ele[fldApi]){
                        selection = (this.recordSelectedValues[fldApi] === ele[fldApi]) ? true: false;
                        let clsName = (selection === true) ? "selectedCol" : "unselectedCol";
                        newLst= [{radioLabel:ele[fldApi], selected:selection, fldApi:fldApi, cls:clsName}];
                    }else if(!this.recsLstMap[fldLbl]){    // for 1st column selection on 1st click
                        newLst = [{radioLabel:"", selected:true, fldApi:fldApi, cls:"selectedCol"}];
                    }else {
                        newLst = [{radioLabel:"", selected:false, fldApi:fldApi, cls:"unselectedCol"}];
                    }
                    this.recsLstMap[fldLbl] = newLst;
                }
            });
            this.victimData.forEach(ele => {
                if(this.recsLstMap.hasOwnProperty(fldLbl)){
                    let selection = false;   
                    if(this.recordSelectedValues[fldApi] === null) {
                        if(ele[fldApi]){
                            this.recsLstMap[fldLbl].push({radioLabel:ele[fldApi], selected:true, fldApi:fldApi, cls:"selectedCol"});
                        } else {
                            this.recsLstMap[fldLbl].push({radioLabel:"", selected:true, fldApi:fldApi, cls:"selectedCol"});
                        }
                    } else if(ele[fldApi]){
                        selection = (this.recordSelectedValues[fldApi] === ele[fldApi]) ? true: false;
                        let clsName = (selection === true) ? "selectedCol" : "unselectedCol";
                        this.recsLstMap[fldLbl].push({radioLabel:ele[fldApi], selected:selection, fldApi:fldApi, cls:clsName});
                    }else {
                        this.recsLstMap[fldLbl].push({radioLabel:"", selected:false, fldApi:fldApi, cls:"unselectedCol"});
                    }               
                } 
            });
        });
        
        this.hideTT = (Object.keys(this.recsLstMap).length === 0);
        
        if(this.recsLstMap){
            let dataMap = this.recsLstMap;
            for(var key in dataMap){
                /*let dMap = dataMap[key];
                for(var keyy in dMap){
                    console.log('keyyyy>>'+keyy+'=='+JSON.stringify(dMap[keyy]));
                    console.log('dMap[keyy]selected>>>'+dMap[keyy]['selected']);
                    let clssName = (dMap[keyy]['selected'] === true) ? "selectedCol" : "unselectedCol";
                    dMap[keyy]['cssCls'] = clssName;
                    // dataMap[key]['cssCls'] = clssName;
                }*/
                this.mapkeyvaluestore.push({key:key,value:dataMap[key]});
            }
            // console.log('this.mapkeyvaluestore>>>'+JSON.stringify(this.mapkeyvaluestore));
        }
    } 
    
    handleRadioClick(event){
        let preSelectedValue = this.selectedValuesMap[event.target.dataset.targetKey];
        let targetKey = event.target.dataset.targetKey;
        console.log('td>>'+targetKey+'='+preSelectedValue);
        let currentVal = event.target.value;
        console.log('currentVal>>'+currentVal);
        // this.template.querySelector('[data-id="'+currentVal+'"]').classList.add("selectedCol");
        // this.template.querySelector('[data-id="'+currentVal+'"]').className='selectedCol';
        if(this.recsLstMap){
            let dataMap = this.recsLstMap;
            for(var key in dataMap){
                if(key === targetKey){
                    let keyData = dataMap[key];
                    // console.log('keyData>>>'+JSON.stringify(keyData));
                    for(var keyy in keyData){
                        if(keyData[keyy]['radioLabel'] === currentVal){
                            // console.log('kdddddd>>>'+keyy+'=='+JSON.stringify(keyData[keyy]['radioLabel']));
                            this.template.querySelector('[data-id="'+preSelectedValue+'"]').className='unselectedCol';
                            this.template.querySelector('[data-id="'+currentVal+'"]').className='selectedCol';
                        }                        
                    }
                }
            }
        }               
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