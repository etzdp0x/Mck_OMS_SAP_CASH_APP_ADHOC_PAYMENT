jQuery.sap.declare("com.acc.cashappadhocpayment.model.formatter");

com.acc.cashappadhocpayment.model.formatter = {
    getPaymentTypeText: function (paymentType) {
        switch (paymentType) {
            case "Full Payment":
                return "None";
            case "Partial Payment":
                return "Warning";
            case "On Account":
                return "None";
            default:
                return "None";
        }
    },
    formatDate: function (date) {
        if (date) {
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
            return oDateFormat.format(new Date(date));
        } else {
            return "";
        }
    },
    getDaysOverdue: function (postingDate, dueDate) {
        if (postingDate && dueDate) {
            var postingDateObj = new Date(postingDate);
            var dueDateObj = new Date(dueDate);
            var timeDiff = dueDateObj.getTime() - postingDateObj.getTime();
            var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff;
        } else {
            return "";
        }
    }
}