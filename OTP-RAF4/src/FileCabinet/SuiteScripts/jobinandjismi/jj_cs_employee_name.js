/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url'],
/**
 * @param{currentRecord} currentRecord
 * @param{url} url
 */
function(currentRecord, url) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        window.onbeforeunload = null;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

        window.setTimeout(getValues(),30000)
    }
     /**
     * Function to get employee name.
     */
    function getValues(){
     try {
        let currRecord = currentRecord.get();
        let employeeName = currRecord.getValue({ fieldId: "custpage_jj_salesrep"});
        // let amount       = currRecord.getValue({ fieldId: "custpage_jj_emp_amount"});
        console.log("employee",employeeName);
        document.location = url.resolveScript({
            deploymentId: "customdeploy_jj_sl_emp_comcal_otp7448",
            scriptId:"customscript_jj_sl_emp_comcal_otp7448",
            params: {
                empName:employeeName
            }
        })

     } catch (e) {
        console.log("error",e.message)
     }
    }
    

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        getValues:getValues
    };
    
});
