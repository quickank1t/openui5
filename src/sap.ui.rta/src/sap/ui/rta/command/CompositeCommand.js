/*!
 * ${copyright}
 */
sap.ui.define([ 'sap/ui/rta/command/BaseCommand',
				'sap/ui/fl/Utils'
], function(BaseCommand,
			flUtils) {
	"use strict";

	/**
	 * Composite command that can work on multiple simp
	 *
	 * @class
	 * @extends sap.ui.rta.command.BaseCommand
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @private
	 * @since 1.34
	 * @alias sap.ui.rta.command.CompositeCommand
	 * @experimental Since 1.34. This class is experimental and provides only limited functionality. Also the API might be
	 *               changed in future.
	 */
	var CompositeCommand = BaseCommand.extend("sap.ui.rta.command.CompositeCommand", {
		metadata : {
			library : "sap.ui.rta",
			properties : {},
			aggregations : {
				commands : {
					type : "sap.ui.rta.command.BaseCommand",
					multiple : true
				}
			},
			events : {}
		}
	});

	/**
	 * Execute this composite command
	 *
	 * @returns {Promise} empty resolved promise or rejected promise
	 */
	CompositeCommand.prototype.execute = function() {
		var aPromises = [];
		this._forEachCommand(function(oCommand){
			aPromises.push(oCommand.execute.bind(oCommand));
		});
		return flUtils.execPromiseQueueSequentially(aPromises, true)

		.catch(function(e) {
			var aCommands = this.getCommands();
			aCommands.forEach(function(oCommand) {
				if (oCommand instanceof sap.ui.rta.command.FlexCommand) {
					if (!oCommand._aRecordedUndo) {
						this.removeCommand(oCommand);
					}
				}
			}.bind(this));

			return this.undo()

			.then(function() {
				return Promise.reject(e);
			});
		}.bind(this));
	};

	CompositeCommand.prototype.undo = function() {
		var aPromises = [];
		this._forEachCommandInReverseOrder(function(oCommand){
			aPromises.push(oCommand.undo.bind(oCommand));
		});
		return flUtils.execPromiseQueueSequentially(aPromises);
	};

	CompositeCommand.prototype._forEachCommand = function(fnDo) {
		var aCommands = this.getCommands();
		aCommands.forEach(fnDo, this);
	};

	CompositeCommand.prototype._forEachCommandInReverseOrder = function(fnDo) {
		var aCommands = this.getCommands();
		for (var i = aCommands.length - 1; i >= 0; i--) {
			fnDo.call(this, aCommands[i]);
		}
	};
	return CompositeCommand;

}, /* bExport= */true);
