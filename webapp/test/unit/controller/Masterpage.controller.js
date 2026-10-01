/*global QUnit*/

sap.ui.define([
	"com/acc/cashappadhocpayment/controller/Masterpage.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Masterpage Controller");

	QUnit.test("I should test the Masterpage controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
