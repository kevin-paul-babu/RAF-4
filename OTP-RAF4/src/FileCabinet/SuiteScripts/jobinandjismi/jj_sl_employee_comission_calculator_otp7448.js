/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

/**************************************************
 * SuiteScript Training
 * OTP-7491 : Suitelet Form to Create Custom Record && Expense Report
 * 
 * *******************************************************************
 * 
 * Author : Jobin and Jismi IT Services LLP.
 * 
 * Date Created : 10 September 2024
 * 
 * Description : Create Suitelet Form to Create Custom Record && Expense Report using 2%commission amount for active sales rep 
 * REVISION HISTORY 
 * @version  1.0 : : 10 September 2024 : Created the initial build  by  JJ0341 
 * 
 * 
 *
 **********************************************************************************************/
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/url'],
    /**
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{url} url
 */
    (record, search, serverWidget, url) => {
     

          /**
     * Function to get search results of active salesrep.
     * @returns results -Search Results
     */
        function employeeSearch(){
          try {
            let searchObj = search.create({
                type: "employee",
                filters:
                [
                   ["salesrep","is","T"], 
                   "AND", 
                   ["isinactive","any","F"]
                ],
                columns:
                ['entityid','internalid']
             });
             let results = searchObj.run().getRange({
                start: 0,
                end: 1000
             });

             return results
            
          } catch (e) {
            log.error("Error",e.message+e.stack)
          }
        }
          /**
     * Function to get search results of 2%commission amount.
     * @param employeeName 
     * @returns results -Search Results
     */
        function comissionSearch(employeeName){
          try {
            let searchObj =  search.create({
                type: "transaction",
                filters:
                [   ["type","anyof","CustInvc","CashSale"],
                    "AND", 
                   ["mainline","is","T"], 
                   "AND", 
                   ["trandate","within","lastyear"], 
                   "AND", 
                   ["employee","anyof",employeeName]
                ],
                columns:
                [
                    search.createColumn({
                        name: "internalid",
                        join: "salesRep",
                        label: "Internal ID",
                        summary: "GROUP",
                        
                     }),
                     search.createColumn({name: "salesrep", label: "Sales Rep",summary: "GROUP",}),
                     search.createColumn({
                        name: "isinactive",
                        join: "salesRep",
                        label: "Inactive",
                        summary: "GROUP",
                        
                     }),
                     search.createColumn({name: "amount", label: "Amount",summary: "SUM",}),
                     search.createColumn({
                        name: "formulanumeric",
                        formula: "ROUND(({amount}*2)/100,2)",
                        label: "Formula (Numeric)",
                        summary: "SUM"
                     })
                ]
             });

             let results = searchObj.run().getRange({
                start: 0,
                end: 1000
             });

             return results

          } catch (e) {
            log.errror("error",e.message+e.stack)
          }

        }
       
          /**
     * Function to create custom record .
     * 
     * @param request
     * @returns recid  custom record id 
     */
        function createCustomRecord(empName,commAmount){
            try{
                let searchObj = search.create({
                    type: "customrecord_jj_emp_comm_rec_otp7448",
                    filters:
                    [
                        'custrecord_jj_emp_name','is',empName
                    ],
                    columns:
                    ['custrecord_jj_emp_name','internalid']
                 });
                 let results = searchObj.run().getRange({
                    start: 0,
                    end: 1
                 });
                 log.debug("results",results);
                 let employeeName,internalid;
                 results.forEach(result => {
                employeeName = result.getValue('custrecord_jj_emp_name');
                log.debug("employeeName02",employeeName);
                internalid =  result.getValue('internalid');
             });
            if(employeeName == empName){
                            record.submitFields({
                                type: "customrecord_jj_emp_comm_rec_otp7448",
                                id: internalid,
                                values: {
                                    'custrecord_jj_emp_comm_otp7448':commAmount
                                }
                            })
                            log.debug("record exists");
                        }
                        else{   
                                let recordObj = record.create({
                                    type: "customrecord_jj_emp_comm_rec_otp7448",
                                    isDynamic: true
                                })
                                    recordObj.setValue({
                                        fieldId: "custrecord_jj_emp_name",
                                        value: empName,
                                        ignoreFieldChange:true
                                    })
                                    recordObj.setValue({
                                        fieldId: "custrecord_jj_emp_comm_otp7448",
                                        value: commAmount,
                                        ignoreFieldChange:true
                                    })
                                    recid = recordObj.save();
           }
            return recid;
            }catch(e){
                log.error("error",e.message+e.stack) 
            }
        }
           /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                if(scriptContext.request.method ==="GET"){
                    let form = serverWidget.createForm({
                        title: "Employee Commission Calculator"
                    })
                    let filterGroup = form.addFieldGroup({
                        id: "custpage_jj_filter",
                        label: "Filter",
                    });
                    form.clientScriptFileId = 3055;
                    let employee = form.addField({
                        id: "custpage_jj_salesrep",
                        label: "Employee",
                        type: serverWidget.FieldType.SELECT,
                        container:"custpage_jj_filter"
                    });
                    
                    let results = employeeSearch();
                    employee.addSelectOption({
                        value: "",
                        text:""
                    })
                        
                    for(let i = 0;i<results.length;i++){
                        // let name =  results[i].getValue({
                        //     name: "entityid"
                        // })
                       
                        employee.addSelectOption({
                            value: results[i].getValue({
                                name: "internalid"
                            }),
                            text:  results[i].getValue({
                                name: "entityid"
                            })
                        })
                    }
                    let amount = form.addField({
                        id: "custpage_jj_emp_amount",
                        label: "Commission Amount",
                        type: serverWidget.FieldType.CURRENCY,
                        container:"custpage_jj_filter"
                    });
              
                    form.addSubmitButton({
                        label: "Submit"
                    })
                    let employeeName = scriptContext.request.parameters.empName;
                    log.debug("employeeName",employeeName);
                    employee.defaultValue = employeeName;
                  if(employeeName){
                    let results = comissionSearch(employeeName);
                    for(let i = 0;i<results.length;i++){
                    amount.defaultValue = results[i].getValue({
                        name: "formulanumeric",
                        formula: "ROUND(({amount}*2)/100,2)",
                        label: "Formula (Numeric)",
                        summary: "SUM",
                    })
                    }
                  }


                    scriptContext.response.writePage(form)
            }else{
                let employeeId = scriptContext.request.parameters.custpage_jj_salesrep;
                let commAmount  = scriptContext.request.parameters.custpage_jj_emp_amount;
                
                log.debug("employee Name0 ",employeeId);
                 let lookupSearchObj  = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: employeeId,
                    columns: ['entityid']
                    });
                let empName = lookupSearchObj.entityid;
                log.debug("employee Name ",empName);
                log.debug("amount",commAmount);
                let body;
                let recid = createCustomRecord(empName,commAmount);
                body = "recid"+recid;
                
                scriptContext.response.write(body)
            }
            } catch (e) {
                log.error("Error",e.message+e.stack)
            }

        }

        return {onRequest}

    });
