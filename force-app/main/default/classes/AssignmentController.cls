public without sharing class AssignmentController {
    
    @AuraEnabled(cacheable=true)
    public static List<Assignment__c> getAllAssignments() {
        return ([Select Title__c, Description__c, DueDate__c, Status__c From Assignment__c ORDER BY DueDate__c ASC]);
    }

    @AuraEnabled(cacheable=false)
    public static wrapperClass upsertAssignments(Assignment__c assg) {
        wrapperClass wrapClass = new wrapperClass();
        try{
            upsert assg;
            wrapClass.isSuccess = true;
            wrapClass.wrapperBody = new Map<String,Object>();
            wrapClass.wrapperBody.put('asg_Updated', assg);
        }
        catch(Exception e) {
            wrapClass.isSuccess = false;
            wrapClass.wrapperBody = new Map<String,Object>();
            wrapClass.wrapperBody.put('error', e);
        }
        return wrapClass;
    }

    public class wrapperClass {
        @AuraEnabled
        public Boolean isSuccess;
        @AuraEnabled
        public Map<String,Object> wrapperBody;
    }
}