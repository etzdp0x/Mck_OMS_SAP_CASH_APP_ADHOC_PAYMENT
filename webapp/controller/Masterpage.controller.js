sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "com/acc/cashappadhocpayment/model/formatter",    
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (Controller, MessageToast, JSONModel,formatter, Filter,FilterOperator,MessageBox,BusyIndicator) {
  "use strict";
  var that,oDataModel,oSelectionObj,oBankValModel;
 
  return Controller.extend("zachpayment.controller.App", {
    formatter: formatter,
    onInit: function () {
        that = this;
        oSelectionObj = {};
        oDataModel = this.getOwnerComponent().getModel();
        oBankValModel = this.getOwnerComponent().getModel("bankValidation");
        
        // var getCustomerDummyData = this.getOwnerComponent().getModel("dummyData").getData();
        // var oModel = new JSONModel(getCustomerDummyData);
        // this.getView().setModel(oModel, "customerModel");

        BusyIndicator.show(0);
        this.byId("idKeyDate").setDateValue(new Date());
        // this.byId("idKeyDate").setDateValue(new Date(2026, 6, 28)); // July 28, 2026
        this.onRead("I_CompanyCodeStdVH","companyCodeModel",[]);
        // this.onRead(oDataModel,"I_Customer_VH","customerModel",[]);
    },
    onCompanyCodeChange:function(oEvent){
        // var sSelectedCompanyCode = oEvent.getParameter("selectedItem").getKey();
        var oCustomerComboBox = this.byId("idCompanyCode");
        if(oCustomerComboBox.getSelectedItem){
          oCustomerComboBox.setValueState(sap.ui.core.ValueState.None);
          oCustomerComboBox.setValueStateText("");
        }
    },
    onCustomerChange:function(oEvent){
        // var sSelectedCustomer = oEvent.getParameter("selectedItem").getKey();
        var oCustomerComboBox = this.byId("idCustomer");
        if(oCustomerComboBox.getSelectedItem){
          oCustomerComboBox.setValueState(sap.ui.core.ValueState.None);
          oCustomerComboBox.setValueStateText("");
          // this.getView().byId("idCustomerName").setValue(oEvent.getSource().getSelectedItem().getText().split(" - ")[1]);
        }
    },
    onKeyDateChange:function(oEvent){
        var oKeyDateInput = this.byId("idKeyDate");
        if(oKeyDateInput.getValue()){
          oKeyDateInput.setValueState(sap.ui.core.ValueState.None);
          oKeyDateInput.setValueStateText("");
        }
        else{
          oKeyDateInput.setValueState(sap.ui.core.ValueState.Error);
          oKeyDateInput.setValueStateText("This field is required");
        }
    },
    onRowSelectionChange:function(oEvent){
      var oTable,getSelectionMode,iRowIndex,aIndices,bRowSelected,
      aSelectedItems,oContext,oModel;
        oTable = this.byId("idOpenItemsTable");
        getSelectionMode = oTable.getSelectionMode();
        iRowIndex = oEvent.getParameter("rowIndex");
        aIndices = oTable.getSelectedIndices();
        bRowSelected = aIndices.includes(iRowIndex);

        aSelectedItems = [];
          aIndices.forEach(function (iIndex) {
              oContext = oTable.getContextByIndex(iIndex);
              if(getSelectionMode === "Single" && bRowSelected){
                oContext.getObject().AmountToPay = parseFloat(that.getOwnerComponent().getModel().getProperty("/firstPageData/amount"));
              }
              else if(getSelectionMode === "MultiToggle" && bRowSelected){
                oContext.getObject().AmountToPay = parseFloat(oContext.getObject().OpenAmount);
              }
              if (oContext) {
                  aSelectedItems.push(oContext.getObject());
              }
          });
          oModel = new JSONModel(aSelectedItems);
          this.getView().setModel(oModel, "selectedInvoicesModel");
          this.getView().getModel("selectedInvoicesModel").refresh(true);
        
        if(getSelectionMode === "Single" && bRowSelected) {   //change logic if partial - multiselect
          this.byId("idResidualPaymentPanel").setVisible(true);
          var oSelectedOpenItem = oTable.getContextByIndex(iRowIndex).getObject();
          var amountToPay = this.getOwnerComponent().getModel().getProperty("/firstPageData/amount");
          oSelectedOpenItem.ResidualAmount = parseFloat(oSelectedOpenItem.OpenAmount) - parseFloat(amountToPay);
          oSelectedOpenItem.amountToPay = parseFloat(amountToPay);
          var oModel = new JSONModel(oSelectedOpenItem);
          this.getView().setModel(oModel, "selectedInvoiceModel");
          this.getView().getModel("selectedInvoiceModel").refresh(true);
        }
        else if(getSelectionMode === "Single" && !bRowSelected){
          this.byId("idResidualPaymentPanel").setVisible(false);
        }
        else{
        var aSelectedIndices = oTable.getSelectedIndices();
        var oModel = this.getView().getModel("openItemsModel");
        var aSelectedItems = [];
        var fTotalAmount = 0;
        aSelectedIndices.forEach(function(iIndex){
            var oItem = oModel.getProperty("/results/" + iIndex);
            aSelectedItems.push(oItem);
            fTotalAmount += parseFloat(oItem.OpenAmount);
        });
        // this.getOwnerComponent().getModel().setProperty("/firstPageData/selectedInvoices", aSelectedItems);
        this.byId("idSelectedTotalTitle").setText("Selected Total : " + fTotalAmount.toFixed(2) + " USD");
        // this.getOwnerComponent().getModel().setProperty("/firstPageData/selectedTotal", fTotalAmount.toFixed(2));
      }
    },
    onAmountChange:function(oEvent){
        var oAmountInput = this.byId("idAmount");
        if(oAmountInput.getValue()){
          oAmountInput.setValueState(sap.ui.core.ValueState.None);
          oAmountInput.setValueStateText("");
        }
        else{
          oAmountInput.setValueState(sap.ui.core.ValueState.Error);
          oAmountInput.setValueStateText("This field is required");
        }
    },
    onBackReviewPage:function(){
      var oWizard = this.byId("idWizard");
      var isOnAccountSelected = this.getOwnerComponent().getModel().getProperty("/firstPageData/isOnAccount");
      if(isOnAccountSelected === true){
        oWizard.previousStep();
        oWizard.previousStep();
      }
      else{
        this.onPrevStep();
      }
    },
    onPrevStep:function(){
        var oWizard = this.byId("idWizard");
        oWizard.previousStep();

      setTimeout(function () {

          var aScrollElements = document.querySelectorAll(".stepContent, .stepContent4");

          aScrollElements.forEach(function (oElement) {
              oElement.scrollTop = 0;
          });

      }, 100);

    },
    onNextParameters : function (oEvent) { 
       var sBankKey,aData,aFiltered;
        var bValid = true;      
        var oWizard = this.byId("idWizard");        
        var oStep1 = this.byId("idStep1");
        var oStep2 = this.byId("idStep2");
        var oStep3 = this.byId("idStep3");
        var hasFullPayment = this.byId("idFullPaymentBtn").hasStyleClass("paymentBtnSelected");
        var hasPartialPayment = this.byId("idPartialPaymentBtn").hasStyleClass("paymentBtnSelected");
        var hasOnAccountPayment = this.byId("idOnAccountBtn").hasStyleClass("paymentBtnSelected");

        var firstPageDataObj = {};
        var oModel = new JSONModel();
       
        var paymentType = "";

          var aFields = [
              this.byId("idCustomer"),
              this.byId("idCompanyCode"),
              this.byId("idCustomerName"),
              this.byId("idAmount"),
              this.byId("idKeyDate"),
              this.byId("idAssignment"),
              this.byId("idReference"),
              this.byId("idMsgText"),
              this.byId("idBankSelection")
          ];

          aFields.forEach(function (oControl) {
              var sValue = "";
              var sFieldId = oControl.getId().split("--")[2];

              if (oControl.isA("sap.m.Select") ||
                oControl.isA("sap.m.ComboBox")) {
                  sValue = oControl.getSelectedKey();
              } 
              else if (oControl.isA("sap.m.Input") ||
                oControl.isA("sap.m.DatePicker")) {
                  sValue = oControl.getValue();
              }

              if (!sValue) {
                // if(!sValue && sFieldId === "idAmount" && hasFullPayment){
                //   oControl.setValueState(sap.ui.core.ValueState.None);
                // }
                // else{
                  oControl.setValueState(sap.ui.core.ValueState.Error);
                  oControl.setValueStateText("This field is required");
                  bValid = false;
                // }
              } 
              else {
                  oControl.setValueState(sap.ui.core.ValueState.None);
              }
          });

          var bPaymentSelected =
              this.byId("idFullPaymentBtn").hasStyleClass("paymentBtnSelected") ||
              this.byId("idPartialPaymentBtn").hasStyleClass("paymentBtnSelected") ||
              this.byId("idOnAccountBtn").hasStyleClass("paymentBtnSelected");

          if (!bPaymentSelected) {
              sap.m.MessageToast.show("Please select a payment type");
              bValid = false;
          }

          if (!this.byId("idBankAuthorization").getSelected()) {
              sap.m.MessageToast.show("Please select Bank Authorization");
              bValid = false;
          }

          if (!bValid) {
              return;
          }
          
          sBankKey = this.getView().byId("idBankSelection").getSelectedKey();
          aData = this.getView().getModel("bankDetailsModel").getData().results;
          aFiltered = aData.filter(function (oItem) {
              return oItem.BankAccount === sBankKey;
          });
          
          firstPageDataObj.customer = oSelectionObj.customer;
            firstPageDataObj.companyCode = oSelectionObj.companyCode;
            firstPageDataObj.customerName = this.getView().byId("idCustomerName").getValue();
            firstPageDataObj.amount = this.getView().byId("idAmount").getValue();
            firstPageDataObj.keyDate = this.getView().byId("idKeyDate").getValue();
            firstPageDataObj.isFullPayment = this.getView().byId("idFullPaymentBtn").hasStyleClass("paymentBtnSelected");
            firstPageDataObj.isPartialPayment = this.getView().byId("idPartialPaymentBtn").hasStyleClass("paymentBtnSelected");
            firstPageDataObj.isOnAccount = this.getView().byId("idOnAccountBtn").hasStyleClass("paymentBtnSelected");
            firstPageDataObj.isBankAuthorization = this.getView().byId("idBankAuthorization").getSelected();
            firstPageDataObj.bankKey = aFiltered[0]?.BankInternalID;
            firstPageDataObj.bankAccountNo = aFiltered[0]?.BankAccount;
            firstPageDataObj.partnerBankType = aFiltered[0]?.BankDetailReference;
            firstPageDataObj.reference = this.getView().byId("idReference").getValue();
            firstPageDataObj.assignment = this.getView().byId("idAssignment").getValue();
            firstPageDataObj.itemText = this.getView().byId("idMsgText").getValue();

            
            this.byId("idResidualPaymentPanel").setVisible(       //change logic if partial - multiselect
                firstPageDataObj.isPartialPayment ? true : false
            );
           if(firstPageDataObj.isFullPayment === true || firstPageDataObj.isPartialPayment === true){
            paymentType = firstPageDataObj.isFullPayment === true ? "Full Payment" : "Partial Payment";
            
            // var aFilters = [
            //     new Filter(
            //         "Customer",
            //         FilterOperator.EQ,
            //         firstPageDataObj.customer
            //     ),
            //     new Filter(
            //         "CompanyCode",
            //         FilterOperator.EQ,
            //         firstPageDataObj.companyCode
            //     ),
            //     new Filter(
            //         "OpenAmount",
            //         FilterOperator.LE,
            //         Number(firstPageDataObj.amount)
            //     ),
            //     new Filter(
            //         "OpenAmount",
            //         FilterOperator.GT,
            //         0
            //     )
            // ];
            //  var sFilter = new Filter("Customer", FilterOperator.EQ, firstPageDataObj.customer);
            if(firstPageDataObj.isPartialPayment === true){
               var oOpenAmountFilter = new Filter({
                filters: [
                    new Filter("OpenAmount", FilterOperator.GT, 0)
                ]
            });
            }
            else{
              var oOpenAmountFilter = new Filter({
                  filters: [
                      new Filter("OpenAmount", FilterOperator.LE, Number(firstPageDataObj.amount)),
                      new Filter("OpenAmount", FilterOperator.GT, 0)
                  ],
                  and: true
              });
            }
            var aFilters = [
                new Filter("Customer", FilterOperator.EQ, firstPageDataObj.customer),
                new Filter("CompanyCode", FilterOperator.EQ, firstPageDataObj.companyCode),
                oOpenAmountFilter
            ];
            
            BusyIndicator.show(0);
            this.onRead("ZFI_AROPENITEMS","openItemsModel",aFilters);
          }
          else if(firstPageDataObj.isOnAccount === true){
            paymentType = "On Account";
          }
          firstPageDataObj.paymentType = paymentType;

            oModel.setProperty("/firstPageData", firstPageDataObj);
            this.getOwnerComponent().setModel(oModel);
        
        if(firstPageDataObj.isFullPayment === true){
            this.byId("idOpenItemsTable").setVisible(true);
            this.byId("idOpenItemsTable").setSelectionMode(sap.ui.table.SelectionMode.MultiToggle);
            // this.byId("idResidualPaymentPanel").setVisible(false);
            this.byId("idOnAccountPanel").setVisible(false);
            this.byId("idSelectedTotalHbox").setVisible(true);
            this.byId("idSelectedTotalTitle").setVisible(true);
            // this.byId("idSelectedTotalTitle").setText("Selected Total : 0 " + firstPageDataObj.currency);
        }
        else if(firstPageDataObj.isPartialPayment === true){
            this.byId("idOpenItemsTable").setVisible(true);
            var oTable = this.byId("idOpenItemsTable");
            oTable.setSelectionMode(sap.ui.table.SelectionMode.Single); //change logic if partial - multiselect
            // this.byId("idOpenItemsTable").setSelectionMode(sap.ui.table.SelectionMode.Single);
            // this.byId("idResidualPaymentPanel").setVisible(true);
            this.byId("idOnAccountPanel").setVisible(false);
            this.byId("idSelectedTotalHbox").setVisible(false);
            this.byId("idSelectedTotalTitle").setVisible(false);
        }
        else if(firstPageDataObj.isOnAccount === true){
            this.byId("idOpenItemsTable").setVisible(false);
            this.byId("idOnAccountPanel").setVisible(false);
            this.byId("idResidualPaymentPanel").setVisible(false);
            this.byId("idSelectedTotalHbox").setVisible(false);
            this.byId("idSelectedTotalTitle").setVisible(false);
        
            oStep1.setValidated(true);
            var generalInfoObj = this.getOwnerComponent().getModel().getProperty("/firstPageData");
            generalInfoObj.isResidualPayment = false;
            oModel = new JSONModel(generalInfoObj);
            this.getView().setModel(oModel, "paymentsDetailsModel");
            this.getView().getModel("paymentsDetailsModel").refresh(true);
            this.byId("idInvoiceDetailsPanel").setVisible(false);
            oWizard.nextStep(); 
            oWizard.nextStep();
            return ;
        }

        if (oWizard.getCurrentStep() === oStep1.getId()) {

            oStep1.setValidated(true);

            oWizard.nextStep();

            setTimeout(function () {

              var aScrollElements = document.querySelectorAll(".stepContent, .stepContent4");

              aScrollElements.forEach(function (oElement) {
                  oElement.scrollTop = 0;
              });

          }, 100);
        }
        else{
           oWizard.setCurrentStep(this.byId("idStep1").getId());
           oWizard.nextStep();

            setTimeout(function () {

              var aScrollElements = document.querySelectorAll(".stepContent, .stepContent4");

              aScrollElements.forEach(function (oElement) {
                  oElement.scrollTop = 0;
              });

          }, 100);
        }
        // oWizard.nextStep();
    },
    onBankDetailsChange:function(oEvent){
      var sBankKey = oEvent.getSource().getSelectedKey();
      // var sBankKey = this.getView().byId("idBankSelection").getSelectedKey();
      // var aData = this.getView().getModel("bankDetailsModel").getData().results;
      // var aFiltered = aData.filter(function (oItem) {
      //     return oItem.BankAccount === sBankKey;
      // });
    },
    onCheckBoxSelect:function(oEvent){
      var oBankAuthModel = this.getOwnerComponent().getModel("bankValidation");
      var sCompanyCode = this.byId("idCompanyCode").getValue();
      var sCustomerCode = this.byId("idCustomer").getValue();
      
      that.getView().byId("idLblBankDetails").setVisible(false);
      that.getView().byId("idBankSelection").setVisible(false);

      if (this.byId("idBankAuthorization").getSelected() === false) {
          return 0;
      }
      else if(sCompanyCode === "" || sCompanyCode === null ||
        sCompanyCode === undefined){         
        this.byId("idBankAuthorization").setSelected(false);
        MessageToast.show("Please select a company code.");
        this.byId("idCompanyCode").setValueState(sap.ui.core.ValueState.Error);
        this.byId("idCompanyCode").setValueStateText("Please Select a company code.");
        return 0;
      }
      else if(sCustomerCode === "" || sCustomerCode === null ||
        sCustomerCode === undefined){
        this.byId("idBankAuthorization").setSelected(false);
        MessageToast.show("Please select a customer code first")
        this.byId("idCustomer").setValueState(sap.ui.core.ValueState.Error);
        this.byId("idCustomer").setValueStateText("Please select a customer code.");
        return 0;
      }
      //  var aFilters = [
      //     new Filter("Customer", FilterOperator.EQ, Number(sCustomerCode.split(" - ")[0]))
      //     // new Filter("DocumentType", FilterOperator.Contains, sQuery)
      // ];
      BusyIndicator.show(0);
          var aBankFilters = new Filter({
            filters: [
                // new Filter("Customer", FilterOperator.EQ, Number(sCustomerCode.split(" - ")[0])),
                new Filter("BankAccount", FilterOperator.NE, ""),
                new Filter("BankAccount", FilterOperator.NE, "0")
            ],
            and: true
        });
          var aFilters = [
                // new Filter("CollectAuth", FilterOperator.EQ, true),
                new Filter("Customer", FilterOperator.EQ, Number(sCustomerCode.split(" - ")[0])),
                aBankFilters
            ];
        this.byId("idCustomer").setValueState(sap.ui.core.ValueState.None);
        this.byId("idCustomer").setValueStateText("");

        this.byId("idCompanyCode").setValueState(sap.ui.core.ValueState.None);
        this.byId("idCompanyCode").setValueStateText("");
      oBankAuthModel.read("/ZFI_CUST_BANK_DETAILS", {
         urlParameters: {
        "$expand": "to_BusinessPartnerBank"
        },
        filters:aFilters,
        // {"$expand" : 
        // "statusDesc,entityDesc,typeDesc"},
        success: function (oData,orespons){
          var isCollectAuthPresent = false;
          for(var i=0;i<oData.results.length;i++){
            if(oData.results[i].CollectAuth === true){
              isCollectAuthPresent = true;
              // return 0;
            }
          }
          if(oData.results.length === 0){
            BusyIndicator.hide();
             MessageBox.error("The selected customer does not have a valid bank account", {
              actions: [MessageBox.Action.OK],
              initialFocus: sap.m.MessageBox.Action.OK,
                  onClose: function (sButton) {
                  if (sButton === MessageBox.Action.OK) {
                    MessageBox.information("Do you want to change the payment transactions master data for customer " + Number(sCustomerCode.split(" - ")[0]) + "?",{
                      actions: [MessageBox.Action.YES, MessageBox.Action.NO],
              initialFocus: sap.m.MessageBox.Action.YES,
                  onClose: function (sButton) {
                  if (sButton === MessageBox.Action.YES) {
                    var param = "";
                    var additionalHash = "";
                    var shellHash = "#BusinessPartner-create?sap-ui-tech-hint=GUI";
                    that.crossNavigation(additionalHash,param,shellHash);
                  }
                }
              })
                  }
                }
              })
            that.byId("idBankAuthorization").setSelected(false);
          }
          else if(isCollectAuthPresent === true && oData.results.length > 0){
            BusyIndicator.hide();
              that.getView().byId("idLblBankDetails").setVisible(true);
              that.getView().byId("idBankSelection").setVisible(true);
              MessageBox.success("Bank authorization details retrieved successfully.");
              var oModel = new JSONModel(oData);
              that.getView().setModel(oModel,"bankDetailsModel");
          } 
          else{
            BusyIndicator.hide();
              MessageBox.error("Customer does not have collection authorization mantained in master data", {
              actions: [MessageBox.Action.OK],
              initialFocus: sap.m.MessageBox.Action.OK,
                  onClose: function (sButton) {
                  if (sButton === MessageBox.Action.OK) {
                    MessageBox.information("Do you want to change the payment transactions master data for customer " + Number(sCustomerCode.split(" - ")[0]) + "?",{
                      actions: [MessageBox.Action.YES, MessageBox.Action.NO],
              initialFocus: sap.m.MessageBox.Action.YES,
                  onClose: function (sButton) {
                  if (sButton === MessageBox.Action.YES) {
                    var param = "";
                    var additionalHash = "";
                    var shellHash = "#BusinessPartner-create?sap-ui-tech-hint=GUI";
                    that.crossNavigation(additionalHash,param,shellHash);
                  }
                }
              })
                  }
                }
              })

              that.byId("idBankAuthorization").setSelected(false);
          }       
            // BusyIndicator.hide();
        },
        error: function (oError){
          BusyIndicator.hide();
          MessageBox.error("No bank authorization details found for the provided Customer.");
          that.byId("idBankAuthorization").setSelected(false);
        }
      });
    },
    onNextOpenItems:function(){
      var fOpenAmount,fAmountToPay,oSelectedInvoideData,
      sTotalOpenAmount,oWizard,oStep2,oSelectedItems,generalInfoObj,oModel;
      oWizard = this.byId("idWizard");
      oStep2 = this.byId("idStep2");
      oSelectedItems = this.byId("idOpenItemsTable").getSelectedIndices();
      generalInfoObj = this.getOwnerComponent().getModel().getProperty("/firstPageData");
      generalInfoObj.isResidualPayment = false;      

      if(generalInfoObj.paymentType === "Full Payment" ||
         generalInfoObj.paymentType === "Partial Payment"){ 

          if(generalInfoObj.paymentType === "Full Payment"){
            sTotalOpenAmount =this.getView().byId("idSelectedTotalTitle").getText()
            fOpenAmount = parseFloat(parseFloat(sTotalOpenAmount.match(/\d+(\.\d+)?/)[0]));
            fAmountToPay = generalInfoObj.amount;
            generalInfoObj.amount = generalInfoObj.amount;
            // parseFloat(this.getOwnerComponent().getModel().getProperty("/firstPageData/amount"));
          }
          else{         
            oSelectedInvoideData = this.getView().getModel("selectedInvoiceModel").getData();
            fOpenAmount = parseFloat(oSelectedInvoideData.OpenAmount);
            fAmountToPay = generalInfoObj.amount
            // parseFloat(oSelectedInvoideData.amountToPay);
            generalInfoObj.residualPayment = parseFloat(oSelectedInvoideData.ResidualAmount);
            generalInfoObj.isResidualPayment = true;
          }

          if(oSelectedItems.length === 0){
            MessageBox.error("Please select at least one invoice to proceed.");
            return 0;
          }
          else if(oSelectedItems.length > 0 && generalInfoObj.paymentType === "Full Payment" && (Number(fOpenAmount) > Number(fAmountToPay))){
                MessageBox.error("Please select open items whose total amount is equal to the entered amount.");
                return 0;
          }
          else if(oSelectedItems.length > 0 && generalInfoObj.paymentType === "Full Payment" && (Number(fOpenAmount) < Number(fAmountToPay))){
                MessageBox.error("Please select open items whose total amount is equal to the entered amount");
                return 0;
          }
          else if(oSelectedItems.length > 0 && generalInfoObj.paymentType === "Partial Payment" &&
            (Number(fOpenAmount) < Number(fAmountToPay) || Number(fOpenAmount) === Number(fAmountToPay))){
              MessageBox.error("Please select open item whose amount is less than entered amount.");
              return 0;
          }
          // else if(oSelectedItems.length > 0 && (fAmountToPay < fOpenAmount ||
          //   fAmountToPay > fOpenAmount) &&
          //    generalInfoObj.paymentType === "Full Payment"){
          //     MessageToast.show("Amount to pay cannot be less than or greater than Open Amount for Full Payment.");
          //     return;
          // }
          this.byId("idInvoiceDetailsPanel").setVisible(true);
      }
      // else if(generalInfoObj.paymentType === "Full Payment"){
      //   var sTotalOpenAmount =this.getView().byId("idSelectedTotalTitle").getText()
      //   fOpenAmount = parseFloat(parseFloat(sTotalOpenAmount.match(/\d+(\.\d+)?/)[0]));
      //   fAmountToPay = fOpenAmount;
      //   // parseFloat(this.getOwnerComponent().getModel().getProperty("/firstPageData/amount"));
      // }
      else if(generalInfoObj.paymentType === "On Account"){
        this.byId("idInvoiceDetailsPanel").setVisible(false);
      }

      // 
      oModel = new JSONModel(generalInfoObj);
      this.getView().setModel(oModel, "paymentsDetailsModel");
      this.getView().getModel("paymentsDetailsModel").refresh(true);
      // 

       if (oWizard.getCurrentStep() === oStep2.getId()) {
            oStep2.setValidated(true);

            oWizard.nextStep();
        }
        else{
           oWizard.setCurrentStep(this.byId("idStep2").getId());
           oWizard.nextStep();
        }
      // oWizard.goToStep(this.byId("idStep3"));
      // oWizard.nextStep();
    },
    onButtonPress: function (oEvent) {
      var sButtonLabel = oEvent.getSource().getText();
      var oSelectedButton = oEvent.getSource();

      // if(sButtonLabel === "Full Payment"){
      //   this.byId("idAmountHBox").setVisible(false);
      // }
      // else{
      //   this.byId("idAmount").setValue("");
      //   this.byId("idAmountHBox").setVisible(true);
      // }

      this.byId("idFullPaymentBtn").removeStyleClass("paymentBtnSelected");
      this.byId("idPartialPaymentBtn").removeStyleClass("paymentBtnSelected");
      this.byId("idOnAccountBtn").removeStyleClass("paymentBtnSelected");
      oSelectedButton.addStyleClass("paymentBtnSelected");
},
onSearchTblItems:function(oEvent){
  var sQuery = String(oEvent.getParameter("newValue"));
  var oTable = this.byId("idOpenItemsTable");
  var oBinding = oTable.getBinding("rows");

  if (sQuery) {
      var aFilters = [
          new Filter("DocumentNumber", FilterOperator.Contains, sQuery),
          new Filter("DocumentType", FilterOperator.Contains, sQuery),
          new Filter("Reference", FilterOperator.Contains, sQuery),
          new Filter("OpenAmount", FilterOperator.Contains, sQuery)
      ];

      var oCombinedFilter = new Filter({
          filters: aFilters,
          and: false // Use OR logic for the filters
      });

      oBinding.filter(oCombinedFilter);
      that.getView().byId("idOpenItemsTable").setVisibleRowCount(oBinding.getLength() > 10 ? 8 : oBinding.getLength());
      that.getView().byId("idTotalTblItems").setText("Open Items (" + oBinding.getLength() + ")");
  } else {
      oBinding.filter([]); // Clear the filter if the search query is empty
  }
},
onRefresh:function(){
  var oTable = this.byId("idOpenItemsTable");
  var oBinding = oTable.getBinding("rows");
  oBinding.refresh();
},
    onRead:function(sEvent,sModel,filter){
      if(filter?.length === 0 || filter === null || filter === undefined){
        filter = null;
      }
      // else if(filter.length > 0 && Array.isArray(filter) === false){
      else{
        filter = [filter];
      }
        oDataModel.read("/"+sEvent, {
        urlParameters : null,
        filters:filter,
        // {"$expand" : 
        // "statusDesc,entityDesc,typeDesc"},
        success: function (oData,orespons){
            if(sModel === "openItemsModel"){
                that.getView().byId("idTotalTblItems").setText("Open Items ("+oData.results.length + ")");
                if(oData.results.length > 10){
                  that.getView().byId("idOpenItemsTable").setVisibleRowCount(8);
                }
                else{
                  that.getView().byId("idOpenItemsTable").setVisibleRowCount(oData.results.length);
                }
            }
            var oModel = new JSONModel(oData);
            that.getView().setModel(oModel, sModel);            
            BusyIndicator.hide();
        },
        error: function (oError){
          BusyIndicator.hide();
          MessageBox.error(oError.message);
          // MessageToast.show("Error while fetching data from backend");
        }
      });
    },
    // onCustomerChange:function(oEvent){
    //     this.getView().byId("idCustomerName").setValue(oEvent.getSource().getSelectedItem().getText());
    // },
    onNextToInvoices: function () {
      var oModel = this.getView().getModel();

      // Dummy data (replace with OData call to BSEG / CDS)
      oModel.setProperty("/OpenItems", [
        { Invoice: "9000000012", DocType: "RV", OpenAmount: "8500", DueDate: "05/15/2026" },
        { Invoice: "9000000018", DocType: "RV", OpenAmount: "6750", DueDate: "06/01/2026" }
      ]);

      MessageToast.show("Loaded Open Items");
    },

    onReview: function () {
      MessageToast.show("Review Step");
    },
    onSubmit:function(oEvent){
      var srNo = 0;
      var oConfirmCheckBox = this.getView().byId("idConfirmCheckBox");
      var sFirstPageData = that.getOwnerComponent().getModel().getProperty("/firstPageData");
      var getPaymentType = this.getOwnerComponent().getModel().getProperty("/firstPageData/paymentType");

      var paymentDataObj,arrSelectedInvoices;;
      var arrPaymentInvoices = [];
      var sCompanyCode = this.getOwnerComponent().getModel().getProperty("/firstPageData/companyCode");
      var sCustomerCode = this.getOwnerComponent().getModel().getProperty("/firstPageData/customer");
      var fAmount = String(this.getOwnerComponent().getModel().getProperty("/firstPageData/amount"));
      var sDate = this.getOwnerComponent().getModel().getProperty("/firstPageData/keyDate");
      var sBankKey = this.getOwnerComponent().getModel().getProperty("/firstPageData/bankKey");
      var sBankAccountNo = this.getOwnerComponent().getModel().getProperty("/firstPageData/bankAccountNo");
      var sBankType = this.getOwnerComponent().getModel().getProperty("/firstPageData/partnerBankType");
      var sReference = this.getOwnerComponent().getModel().getProperty("/firstPageData/reference");
      var sAssignment = this.getOwnerComponent().getModel().getProperty("/firstPageData/assignment");
      var sMsgText = this.getOwnerComponent().getModel().getProperty("/firstPageData/itemText");
      // .toISOString();
      if(sDate.includes(".")){
      var aParts = sDate.split(".");
      var sKeyDate = new Date(
          parseInt(aParts[2], 10), // year
          parseInt(aParts[1], 10) - 1, // month (0-based)
          parseInt(aParts[0], 10) // day
      );
      // var sKeyDate = oDate.toISOString();
    }
    else{
      var sKeyDate = new Date(sDate);
      // .toISOString();
    }
      var srv = "/sap/opu/odata/sap/ZFI_ACH_PAYMENTUI/ZI_FINPOST";
      var oPaymentModel = this.getOwnerComponent().getModel("payment");
      // var oPaymentModel = new sap.ui.model.odata.v2.ODataModel(
      //     "/sap/opu/odata/sap/ZFI_ACH_PAYMENTUI"
      // );

      if (!oConfirmCheckBox.getSelected()) {
        MessageToast.show("Please check the confirmation checkbox to continue.");
        return;
      }

      if(getPaymentType === "Full Payment" || getPaymentType === "Partial Payment"){
        arrSelectedInvoices = this.getView().getModel("selectedInvoicesModel").getData();
        for(var i=0;i<arrSelectedInvoices.length;i++){
          srNo = srNo + 1;
          var invoiceObj = {
            "ItemNo":String(srNo),
            "Belnr": arrSelectedInvoices[i].DocumentNumber,
            "Gjahr": arrSelectedInvoices[i].FiscalYear,
            "Amount": String(parseFloat(arrSelectedInvoices[i].OpenAmount)),
            "Budat": new Date(arrSelectedInvoices[i].PostingDate)
            // .toISOString()
          }
          arrPaymentInvoices.push(invoiceObj);
        }

        paymentDataObj = {
        "ReqId": "00000000-0000-0000-0000-000000000000",
        "ActionTyp": "FB05",
        "PaymType": sFirstPageData.paymentType === "Full Payment"
              ? "FULL"
              : sFirstPageData.paymentType === "Partial Payment"
              ? "PART"
              : sFirstPageData.paymentType === "On Account"
              ? "ONAC"
              : "",
        // "PaymType": sFirstPageData,
        "Bukrs": sCompanyCode,
        "Kunnr": sCustomerCode,
        "Amount": fAmount, 
        "Waers": "USD",
        "Bldat": sKeyDate,
        // Additonal changes 10/02/2026
        "Bankl": sBankKey,
        "Bankn": sBankAccountNo,
        "Bvtyp": sBankType,
        "Xblnr": sReference,
        "Dzuonr": sAssignment,
        "Sgtxt": sMsgText,
        //
        // "Budat": new Date().toISOString(),
        "SpGlInd": "",
        "Laufd": new Date(),
        "Laufi":"",
        "to_Invoices": arrPaymentInvoices
      }
      
    }
   
  else if(getPaymentType === "On Account"){
    var paymentDataObj =
    {
      "ReqId": "00000000-0000-0000-0000-000000000000",
      "ActionTyp": "FB05",
      "PaymType": "ONAC",
      "Bukrs": sCompanyCode,
      "Kunnr": sCustomerCode,
      "Amount": fAmount,
      "Waers": "USD",
      "Bldat": sKeyDate,
      // Additonal changes 10/02/2026
        "Bankl": sBankKey,
        "Bankn": sBankAccountNo,
        "Bvtyp": sBankType,
        "Xblnr": sReference,
        "Dzuonr": sAssignment,
        "Sgtxt": sMsgText,
      //
      // "Budat": new Date().toISOString(),
      "SpGlInd": "F"
    }
  }

    var data = JSON.stringify(paymentDataObj);
    MessageBox.confirm("Do you want to submit ?", {
      initialFocus: sap.m.MessageBox.Action.CANCEL,
					onClose: function (sButton) {
          if (sButton === MessageBox.Action.OK) {
          oPaymentModel.create("/FinPost", paymentDataObj, {
            success: function (oData, oResponse) {
              const rawDateVal = JSON.parse(oResponse.body).d.Laufd;
              const runID = JSON.parse(oResponse.body).d.Laufi;
              // const timestamp = parseInt(rawDateVal.match(/\d+/)[0], 10);
              // const date = new Date(timestamp);
              // var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" });
              // var formatedDate = oDateFormat.format(new Date(date));

              const timestamp = Number(rawDateVal.match(/\d+/)[0]);
              const oDate = new Date(timestamp);

              const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                  pattern: "dd.MM.yyyy",
                  UTC:true
              });

              const formattedDate = oDateFormat.format(oDate);
              MessageBox.success("Payment Run Initiated. Check Run date: " + formattedDate + ", Identification: "+runID+" in Manage Automatic Payments App.",{
              // MessageBox.confirm("Do you want to submit ?", {
              initialFocus: sap.m.MessageBox.Action.OK,
                  onClose: function (sButton) {
                  if (sButton === MessageBox.Action.OK) {
                    var param = {
                        runDate: formattedDate,
                        runID: runID
                    };
                      var oSemantic = "AutomaticPayment";
                      var shellHash = "AutomaticPayment-schedulePaymentProposal"
                      // "#AutomaticPayment-schedulePaymentProposal&/displayProposal/runDate="+formatedDate+"&runID="+runID+""
                      var additionalHash = "";
                      // BusyIndicator.show(0);
                      
                      that.crossNavigation(additionalHash,param,shellHash);
                  }
                  else{
                    // do nothing
                  }
                }
              })

              // that.onFirstPage();
            },
            error: function (oError) {
              // debugger;
              MessageBox.error(JSON.parse(oError.responseText).error.message.value);
              // that.onResponse(oError,"error")
            }
          })
        }
          else{
            return 0;
          }
        }
        });
        
    },
    onFirstPage:function(){
      var oWizard = this.byId("idWizard");
        oWizard.previousStep();
        oWizard.previousStep();
        this.byId("idCompanyCode").setValue("");
        this.byId("idCustomer").setValue("");
        this.byId("idCustomerName").setValue("");
        this.byId("idFullPaymentBtn").removeStyleClass("paymentBtnSelected");
        this.byId("idPartialPaymentBtn").removeStyleClass("paymentBtnSelected");
        this.byId("idOnAccountBtn").removeStyleClass("paymentBtnSelected");
        this.byId("idAmount").setValue("");
        // this.byId("idKeyDate").setValue("");        
        this.byId("idKeyDate").setDateValue(new Date());
        this.byId("idBankAuthorization").setSelected(false);
        that.getView().byId("idLblBankDetails").setVisible(false);
        that.getView().byId("idBankSelection").setVisible(false);
    },
    onResponse: function (sResponse,sStatus) {
        var oWizard = this.byId("idWizard");
        var oStep3 = this.byId("idStep3");
    if(sStatus === "error"){
       this.byId("idSuccessIcon").setSrc("sap-icon://error");
        this.byId("idSuccessIcon").setColor("red");
        this.byId("idSuccessIcon").setBackgroundColor("transparent"); 
        this.byId("idPendingApprovalTitle").setVisible(false);
        this.byId("idStatus").setText("Payment could not be initiated");
    }
    else{
      if(getPaymentType === "On Account"){
        this.byId("idSuccessIcon").setSrc("sap-icon://pending");
        this.byId("idSuccessIcon").setColor("white");
        this.byId("idSuccessIcon").setBackgroundColor("#ffb400");
        this.byId("idPendingApprovalTitle").setVisible(true);
        this.byId("idStatus").setText("Pending Approval");
      }
      else{
        this.byId("idSuccessIcon").setSrc("sap-icon://accept");
        this.byId("idSuccessIcon").setColor("green");
        this.byId("idSuccessIcon").setBackgroundColor("green");
        this.byId("idPendingApprovalTitle").setVisible(false);
        this.byId("idStatus").setText("Submitted");
      }
    }

      //  if (oWizard.getCurrentStep() === oStep3.getId()) {

      //       oStep3.setValidated(true);

      //       oWizard.nextStep();
      //   }
      //   else{
      //      oWizard.setCurrentStep(this.byId("idStep3").getId());
      //      oWizard.nextStep();
      //   }
        
        setTimeout(function () {

          var aScrollElements = document.querySelectorAll(".stepContent4");

          aScrollElements.forEach(function (oElement) {
              oElement.scrollTop = 0;
          });

      }, 100);
      
    },
    onViewDetails: function () {
      var param = {
        runDate: "20260718",
        runID: "ACHF"
    };
      var oSemantic = "AutomaticPayment";
      var additionalHash = "";
      // BusyIndicator.show(0);
      that.crossNavigation(oSemantic,additionalHash,param);
    },
    crossNavigation:function(additionalHash,param,shellHash){
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
			 target: {
            shellHash: shellHash
        }
			,
			params: param
			})) || ""; // generate the Hash to display a Supplier

			if((Object.keys(param)).length > 0){
				oCrossAppNavigator.toExternal({
					target: {
					shellHash: hash
					}
					});
			}
			else{
				oCrossAppNavigator.toExternal({
				target: {
				shellHash: hash+additionalHash
				}
				});
				}

		
		},
    onFinish: function () {
      MessageToast.show("Done");
      var oWizard = this.byId("idWizard");
      oWizard.goToStep(this.byId("idStep1"));
    },
    // 
    handleCompanyCodeDialog: function (oEvent) {
      var oInput = oEvent.getSource();
      // var sInputValue = oInput.getValue();

      // create value help dialog
      if (!this._companyCodeValueHelpDialog) {
        this._companyCodeValueHelpDialog = sap.ui.xmlfragment(
          "com.acc.cashappadhocpayment.view.fragment.companyDialog",
          this
        );
        this.getView().addDependent(this._companyCodeValueHelpDialog);
      }

      // create a filter for the binding
      // this._companyCodeValueHelpDialog.getBinding("items").filter(
      //   new Filter("CompanyCode", FilterOperator.Contains, sInputValue)
      // );

      // open value help dialog filtered by the input value
      this._companyCodeValueHelpDialog.open();
      sap.ui.getCore().byId("companyCode_listId").removeSelections(true);
      this.onRefreshList("companyCode_listId");
    },
    handlecompanyCodeValueHelpSearch: function (oEvent) {
     var sQuery = oEvent.getSource().getValue();

    var aFilters = [];
    if (sQuery) {
        aFilters.push(
            new Filter({
                filters: [
                    new Filter("CompanyCode", FilterOperator.Contains, sQuery),
                    new Filter("CompanyCodeName", FilterOperator.Contains, sQuery)
                ],
                and: false // OR
            })
        );
    }

    var oList = sap.ui.getCore().byId("companyCode_listId");
    var oBinding = oList.getBinding("items");
    oBinding.filter(aFilters);
    },
    companyCodeSelectionChange: function (oEvent) {
      var oSelectedItem = oEvent.getSource().getSelectedItem().getBindingContext("companyCodeModel").getObject();
      oSelectionObj.companyCode = oSelectedItem.CompanyCode;
      if (oSelectedItem) {
        var sCompanyCode = oSelectedItem.CompanyCode;
        this.byId("idCompanyCode").setValue(oSelectionObj.companyCode + " - " + oSelectedItem.CompanyCodeName);
        this.byId("idCompanyCode").setValueState(sap.ui.core.ValueState.None);
        this.byId("idCompanyCode").setValueStateText("");
      }
      sap.ui.getCore().byId("companyCode_listId").removeSelections(true);
			sap.ui.getCore().byId("companyCode_Id").setValue("");
      var aFilter = new Filter("CompanyCode", FilterOperator.EQ, sCompanyCode);
      this.byId("idBankAuthorization").setSelected(false);
      this.onRead("C_Customersuppliercompanycode","customerModel",[aFilter]);
      this.byId("idCustomer").setValue("");
      this.byId("idCustomerName").setValue("");
      this._companyCodeValueHelpDialog.close();

    },
    customerSelectionChange: function (oEvent) {
      var oSelectedItem = oEvent.getSource().getSelectedItem().getBindingContext("customerModel").getObject();
      oSelectionObj.customer = oSelectedItem.Account;
      if (oSelectedItem) {
        var sCustomerCode = oSelectedItem.Account;
        var sCustomerName = oSelectedItem.Name;
        // OrganizationBPName1;
        // this.byId("idCustomer").setValue(sCustomerCode);
        this.byId("idCustomer").setValueState(sap.ui.core.ValueState.None);
        this.byId("idCustomer").setValueStateText("");
        this.byId("idCustomer").setValue(sCustomerCode + " - " + sCustomerName);
        this.byId("idCustomerName").setValue(sCustomerName);
        this.byId("idBankAuthorization").setSelected(false);
      }
      sap.ui.getCore().byId("customer_listId").removeSelections(true);
			sap.ui.getCore().byId("customer_Id").setValue("");
      this._customerValueHelpDialog.close();
    },
    handlecompanyCodeValueHelpClose: function (oEvent) {
      
      sap.ui.getCore().byId("companyCode_listId").removeSelections(true);
			sap.ui.getCore().byId("companyCode_Id").setValue("");
      this._companyCodeValueHelpDialog.close();
    },
    handleCustomerDialog: function (oEvent) {
      var sCompanyCode = this.byId("idCompanyCode").getValue();
      if(sCompanyCode === ""){
        MessageToast.show("Please select a Company Code.");
        this.byId("idCompanyCode").setValueState(sap.ui.core.ValueState.Error);
        this.byId("idCompanyCode").setValueStateText("Please Select a Company Code.");
        return;
      }
      var oInput = oEvent.getSource();
      if (!this._customerValueHelpDialog) {
        this._customerValueHelpDialog = sap.ui.xmlfragment(
          "com.acc.cashappadhocpayment.view.fragment.customerDialog",
          this
        );
        this.getView().addDependent(this._customerValueHelpDialog);
      }

      // create a filter for the binding
      // this._customerValueHelpDialog.getBinding("items").filter(
      //   new Filter("Customer", FilterOperator.Contains, sInputValue)
      // );

      // open value help dialog filtered by the input value
      this._customerValueHelpDialog.open();
      sap.ui.getCore().byId("customer_listId").removeSelections(true);
      this.onRefreshList("customer_listId");
    },
    handleCustomerValueHelpSearch: function (oEvent) {
      var sQuery = oEvent.getSource().getValue();
          var aFilters = [];
    if (sQuery) {
        aFilters.push(
            new Filter({
                filters: [
                    new Filter("Name", FilterOperator.Contains, sQuery),
                    new Filter("Account", FilterOperator.Contains, sQuery)
                ],
                and: false // OR
            })
        );
    }

    var oList = sap.ui.getCore().byId("customer_listId");
    var oBinding = oList.getBinding("items");
    oBinding.filter(aFilters);
    },

    handleCustomerDialogClose: function (oEvent) {
      sap.ui.getCore().byId("customer_listId").removeSelections(true);
			sap.ui.getCore().byId("customer_Id").setValue("");
      this._customerValueHelpDialog.close();
    },
    onRefreshList:function(listId){
      var list = sap.ui.getCore().byId(listId);
			var binding = list.getBinding("items");
			binding.filter(null);
    }


  });
});