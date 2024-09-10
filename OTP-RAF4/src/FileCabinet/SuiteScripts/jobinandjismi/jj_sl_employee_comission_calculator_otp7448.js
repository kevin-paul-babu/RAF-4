/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/url'],
    /**
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{url} url
 */
    (record, search, serverWidget, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
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
            log.error("Error",e.message)
          }
        }
        function comissionSearch(employeeName){
          try {
            let searchObj =  search.create({
                type: "salesorder",
                filters:
                [
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
                        label: "Internal ID"
                     }),
                     search.createColumn({name: "salesrep", label: "Sales Rep"}),
                     search.createColumn({
                        name: "isinactive",
                        join: "salesRep",
                        label: "Inactive"
                     }),
                     search.createColumn({name: "amount", label: "Amount"}),
                     search.createColumn({
                        name: "formulanumeric",
                        formula: "({amount}*2)/100",
                        label: "Formula (Numeric)"
                     })
                ]
             });

             let results = searchObj.run().getRange({
                start: 0,
                end: 1000
             });

             return results

          } catch (e) {
            log.errror("error",e.message)
          }

        }
        function createCustomRecord(request,lineCount,sublistId){
            try{
                let employeeName;
                let empid;
                let commAmount;
                let status;

                for(let i=0;i<lineCount;i++){
                    let select = request.getSublistValue({
                        group: sublistId,
                        line:i,
                        name: "custpage_jj_emp_select"
                    });
                    if(select ==='T'){
          
                        empid = request.getSublistValue({
                            group: sublistId,
                            line:i,
                            name: "custpage_jj_emp_id"
                        });
                        employeeName  = request.getSublistValue({
                            group: sublistId,
                            line:i,
                            name: "custpage_jj_emp_name"
                        });
                        status  = request.getSublistValue({
                            group: sublistId,
                            line:i,
                            name: "custpage_jj_emp_status"
                        });
                        commAmount  = request.getSublistValue({
                            group: sublistId,
                            line:i,
                            name: "custpage_jj_emp_amount"
                        });
                      
                }

            }
            let recordObj = record.create({
                type: "customrecord_jj_emp_comm_rec_otp7448",
                isDynamic: true
            })
            recordObj.setValue({
                fieldId: "custrecord_jj_emp_id",
                value: empid,
                ignoreFieldChange:true
            })
            if(status ==="Active"){
                recordObj.setValue({
                    fieldId: "custrecord_jj_emp_status_otp7448",
                    value: true,
                    ignoreFieldChange:true
                })
            }
            else{
                recordObj.setValue({
                    fieldId: "custrecord_jj_emp_status_otp7448",
                    value: false,
                    ignoreFieldChange:true
                })
            }
         
            recordObj.setValue({
                fieldId: "custrecord_jj_emp_name",
                value: employeeName,
                ignoreFieldChange:true
            })
            recordObj.setValue({
                fieldId: "custrecord_jj_emp_comm_otp7448",
                value: commAmount,
                ignoreFieldChange:true
            })
            let recid = recordObj.save();
            let lookupSearchObj  = search.lookupFields({
                type: "customrecord_jj_emp_comm_rec_otp7448",
                id: recid,
                columns: ['custrecord_jj_emp_id']
            });
            let employeeId = lookupSearchObj.custrecord_jj_emp_id;
            if(employeeId === empid){
                let updateobj = record.submitFields({
                    type: "customrecord_jj_emp_comm_rec_otp7448",
                    id: recid,
                    values: {
                        'custrecord_jj_emp_comm_otp7448':commAmount
                    }
                })
            
            }
            // let empAdvId = createExpenseReport(empid);
            return recid;
            }catch(e){
                log.errror("error",e.message) 
            }
        }
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
                    
                    for(let i = 0;i<results.length;i++){
                        // let name =  results[i].getValue({
                        //     name: "entityid"
                        // })
                        employee.addSelectOption({
                            value: "",
                            text:""
                        })
                            
                        employee.addSelectOption({
                            value: results[i].getValue({
                                name: "internalid"
                            }),
                            text:  results[i].getValue({
                                name: "entityid"
                            })
                        })
                    }
                    let subList = form.addSublist({
                        id: "custpage_jj_emp_sublist",
                        label: "Employee Comission Calculator",
                        type:serverWidget.SublistType.LIST
                    });

                    subList.addField({
                        id: "custpage_jj_emp_id",
                        label: "Employee Id",
                        type: serverWidget.FieldType.INTEGER
                    });
                    subList.addField({
                        id: "custpage_jj_emp_name",
                        label: "Employee Name",
                        type: serverWidget.FieldType.TEXT
                    });
                    subList.addField({
                        id: "custpage_jj_emp_status",
                        label: "Status",
                        type: serverWidget.FieldType.TEXT
                    });
                   let amount =  subList.addField({
                        id: "custpage_jj_emp_amount",
                        label: "Commission Amount",
                        type: serverWidget.FieldType.CURRENCY
                    });
                    subList.addField({
                        id: "custpage_jj_emp_select",
                        label: "Select",
                        type: serverWidget.FieldType.CHECKBOX
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
                    subList.setSublistValue({
                        id: "custpage_jj_emp_id",
                        line: i,
                        value: results[i].getValue({
                            name: "internalid",
                            join: "salesRep",
                            label: "Internal ID"
                        })
                        });
                    subList.setSublistValue({
                        id: "custpage_jj_emp_name",
                        line: i,
                        value: results[i].getText({
                         name: "salesrep", 
                         label: "Sales Rep"
                        })
                        })
                        let check = results[i].getValue({
                            name: "isinactive",
                            join: "salesRep",
                            label: "Inactive"
                        });
                        if(check === false){
                             subList.setSublistValue({
                            id: "custpage_jj_emp_status",
                            line: i,
                            value: "Active"
                            })
                        }
                        else{
                            subList.setSublistValue({
                                id: "custpage_jj_emp_status",
                                line: i,
                                value: "Inactive"
                                })
                        }
                       
                    subList.setSublistValue({
                        id: "custpage_jj_emp_amount",
                        line: i,
                        value: results[i].getValue({
                            name: "formulanumeric",
                            formula: "({amount}*2)/100",
                            label: "Formula (Numeric)"
                        })
                        })
                    amount.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.ENTRY
                    });
                    }
                  }


                    scriptContext.response.writePage(form)
            }else{
                let request = scriptContext.request;
                let sublistid = 'custpage_jj_emp_sublist';
                let lineCount  = request.getLineCount({
                    group: sublistid
                });
                let body ;
                if(lineCount>0){
                    let recid = createCustomRecord(request,lineCount,sublistid);
                    body = "recid"+recid;
                }
                scriptContext.response.write(body)
            }
            } catch (e) {
                log.error("Error",e.message)
            }

        }

        return {onRequest}

    });
