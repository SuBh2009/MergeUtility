import { LightningElement, track, api } from 'lwc';

export default class SelectionPalette extends LightningElement {
    @track recsLstMap = {};
    @track mapkeyvaluestore=[];
    @track hideTT = true;
    @track _lstDataTableColumns;
    @track _victimData;
    @track _masterData;
    @api masterRowId;
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
        // console.log('_victimData>>'+JSON.stringify(this._victimData));
    }
    @api
    get lstDataTableColumns(){
        return this._lstDataTableColumns;
    }
    set lstDataTableColumns(value){
        this._lstDataTableColumns = value;
        this._lstDataTableColumns.forEach(element => {
            // console.log('fld>>'+element.label+'>>'+element.fieldName);
            let fldLbl = element.label;
            let fldApi = element.fieldName;
            this.masterData.forEach(ele => {
                if(ele.Id === this.masterRowId){
                    let newLst;
                    if(ele[fldApi]){
                        newLst= [{radioLabel:ele[fldApi], selected:true}];
                    } else{
                        newLst = [{radioLabel:"", selected:true}];
                    }
                    this.recsLstMap[fldLbl] = newLst;
                }
            });
            this.victimData.forEach(ele => {
                if(this.recsLstMap.hasOwnProperty(fldLbl)){
                    if(ele[fldApi]){
                        this.recsLstMap[fldLbl].push({radioLabel:ele[fldApi], selected:false});
                    } else{
                        this.recsLstMap[fldLbl].push({radioLabel:"", selected:false});
                    }                    
                } 
            });
        });
        
        console.log('final>>'+JSON.stringify(this.recsLstMap));
        // console.log('masterRowId>>'+this.masterRowId);
        this.hideTT = (Object.keys(this.recsLstMap).length === 0);
        // console.log('this.hideTT?'+this.hideTT);
        
        if(this.recsLstMap){
            let dataMap = this.recsLstMap;
            for(var key in dataMap){
                this.mapkeyvaluestore.push({key:key,value:dataMap[key]});
            }
            console.log('mapkeyvaluestore>>'+JSON.stringify(this.mapkeyvaluestore));
        }
    } 
    
    handleRadioClick(event){
        console.log('name>>'+event.target.name+' val>>'+event.target.value);
    }
}