public class MergerBatch implements Database.Batchable<sObject>,Database.Stateful,Database.RaisesPlatformEvents
{
    private Map<String, sObject> recordDataMap;
    private Map<Id, List<sObject>> victimRecordMap;
    private Map<Id, sObject> victimMasterRecordMap;
    private Set<String> fieldsList;
    public Map<Id, List<ResponseError>> errorMasVicRecIdMap =new Map<Id, List<ResponseError>>();
    
    public MergerBatch(MergeController.SobjectWrapperData mergerRecords){
        this.recordDataMap = mergerRecords.recordDataMap;    
        this.victimRecordMap = mergerRecords.victimRecordMap;   
        this.victimMasterRecordMap = mergerRecords.victimMasterRecordMap; 
        this.fieldsList = fetchDataColList(mergerRecords.lstDataTableColumns);
    }
    
    private Set<String> fetchDataColList(List<MergeController.DataTableColumns> lstDataTableColumns)
    {
        Set<String> fieldList = new Set<String>();
        for(MergeController.DataTableColumns dataCol: lstDataTableColumns)
        {
            fieldList.add(dataCol.fieldName);
        }
        return fieldList;
    }
    public List<SObject> start(Database.BatchableContext BC){
        
        List<SObject> victimRecordList = new List<sObject>();
        for(Id victimId :victimMasterRecordMap.keySet())
        {
            victimRecordList.add(recordDataMap.get(victimId));
        }
        return victimRecordList;
    }
    
    public void execute(Database.BatchableContext BC, List<sObject> scope)
    {
        sObject sObj = scope[0];
        Id victimRecId = sObj.Id;
        Id masterId = victimMasterRecordMap.get(victimRecId).Id;
        //sObject masterRecord = []
        String sobjectType = victimRecId.getSObjectType().getDescribe().getName();
        //String sObjectQuery = 'Select Id, '+String.join((Iterable<String>)fieldsList, ', ') +' from '+sobjectType+' where Id =: masterId LIMIT 1' ;
        sObject masterRecord = /*Database.query(sObjectQuery)*/ recordDataMap.get(masterId);  
        system.debug('---masterRecord---'+masterRecord);
        Database.MergeResult res = MergeService.getInstance(sobjectType).mergeOne(masterRecord, recordDataMap.get(victimRecId));
        if (!res.isSuccess())
        {
            for(Database.Error err : res.getErrors()) {
                if(!errorMasVicRecIdMap.containsKey(masterId))
                {
                    errorMasVicRecIdMap.put(masterId, new List<ResponseError>());
                }
                errorMasVicRecIdMap.get(masterId).add(new ResponseError(victimRecId, err.getMessage()));
            }
        }
    }
    
    public void finish(Database.BatchableContext BC){
        Response resp = new Response();
        resp.resperror = errorMasVicRecIdMap;
        Merge_Event__e mergeEvent = new Merge_Event__e(
            Event_Info__c='Account records failed during merge processing', 
            Is_Event_Valid__c=true, 
            Event_Publisher__c='MergerBatch',
            Records_Ids__c= JSON.serialize(resp));
        // Call method to publish events
        Database.SaveResult sr = EventBus.publish(mergeEvent);
        // Inspect publishing result 
        if (sr.isSuccess()) {
            System.debug('Successfully published event.');
        } else {
            for(Database.Error err : sr.getErrors()) {
                System.debug('Error returned: ' +  err.getStatusCode() +' - ' + err.getMessage());
            }
        }
    
    }
    
    public class Response{
        public Map<Id, List<ResponseError>> resperror; 
    }
         
    public class ResponseError {
        public Id victimId;
        public String errorMsg;
        public ResponseError(Id victimId, String errorMsg)
        {
            this.victimId = victimId;
            this.errorMsg = errorMsg;
        }
    }
}