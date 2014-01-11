/**
 * https://github.com/frangin2003
 */

/**
 * @requires plugins/Tool.js
 * @requires OpenLayers/Control/WMSGetFeatureInfo.js
 * @requires OpenLayers/Control/ModifyFeature.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Style.js
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/**
 * Supported feature editor types (delete is listed here but is supported also).
 */
gxp.plugins.FeatureEditor2Constants = {
	MODIFY: 'Modify',
	MOVE: 'Move'
};

/** api: constructor
 *  .. class:: FeatureEditor2(config)
 *
 * Provides a menu to edit layers given in config.
 * <ul>
 *     <li>Three menu entries: One for vertex modification, one for move/rotation of feature and one for deleting
 *     feature with confirm dialog box.</li>
 *     <li>You can clicked everywhere on the map. Using a OpenLayers.Control.WMSGetFeatureInfo control, we get the
 *     clicked features (on one or many layers) and we start editing/deleting the first one on the pile, which mean
 *     you don't have to select the layer you want to edit first (in the layer tree for instance).</li>
 *     <li>You can pass as much as layers as you want.</li>
 *     <li>You can allow text add to your layer (here symbolized by a checkbox with the Ext id given on config in
 *     'labelPromptCheckboxId'</li>
 *
 * The expected 'editableLayers' parameter expected structure is:
 *
 *  editableLayers: [
 {
     layer: THE VECTOR LAYER TO DRAW ON,
     layerWMS: THE LAYER IN WMS FORM TO ALLOW LAYER REFRESH,
     saveStrategy: THE SAVE STRATEGY OF VECTOR LAYER,
     type: THE TYPE OF LAYER gxp.plugins.FeatureDrawingConstants.*,
     projection: OpenLayers.Projection OBJECT CONTAINING LAYER PROJECTION
 },
 ...
 ]
 */
gxp.plugins.FeatureEditor2 = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = gxp_featureEditor2 */
	ptype: "gxp_featureEditor2",

    /** api: config[editToolTip]
     *  ``String``
     *  Text for edit split button tooltip (i18n).
     */
    editToolTip: "Edit layers features",

    /** api: config[buttonText]
     *  ``String``
     *  Text for edit split button (i18n).
     */
    buttonText: "Edit",
	
	/** api: config[moveMenuText]
     *  ``String``
     *  Text for move/rotate menu item (i18n).
     */
    moveMenuText: "Move/Rotate",

    /** api: config[moveTooltip]
     *  ``String``
     *  Text for move/rotate menu item tooltip (i18n).
     */
    moveTooltip: "Move or rotate layers features",
	
	/** api: config[modifyMenuText]
     *  ``String``
     *  Text for edit geometry area menu item (i18n).
     */
    modifyMenuText: "Edit geometry",

    /** api: config[modifyTooltip]
     *  ``String``
     *  Text for edit geometry menu item tooltip (i18n).
     */
    modifyTooltip: "Edit geometry of layers features",

    /** api: config[deleteMenuText]
     *  ``String``
     *  Text for delete menu item (i18n).
     */
    deleteMenuText: "Remove geometry",

    /** api: config[deleteTooltip]
     *  ``String``
     *  Text for delete menu item tooltip (i18n).
     */
    deleteTooltip: "Remove geometry of layers",

    /** api: config[deleteTooltip]
     *  ``OpenLayers.Control.WMSGetFeatureInfo``
     *  The control to get feature to edit.
     */
	wmsGetFeatureControl : null,

    /** api: config[deleteTooltip]
     *  ``Array``
     *  Array of OpenLayers.Control.DrawFeature controls
     */
	editControls : {},

    /** api: config[deleteTooltip]
     *  ``Json``
     *  Json containing the state of current editred layer
     */
	currentObject: {},

    /** api: config[confirmDeleteTitle]
     *  ``String``
     *  Text for delete message box title (i18n).
     */
    confirmDeleteTitle: 'Confirm delete',

    /** api: config[confirmDeleteMsg]
     *  ``String``
     *  Text for delete message box (i18n).
     */
    confirmDeleteMsg: 'Are you sure ?',

    /** private: method[constructor]
     */
	constructor: function(config) {

        gxp.plugins.FeatureEditor2.superclass.constructor.apply(this, arguments);

		Ext.apply(this, config);
	},

    /** private: method[destroy]
     */
    destroy: function() {
        this.button = null;
        gxp.plugins.FeatureEditor2.superclass.destroy.apply(this, arguments);
    },

    /** private: method[init]
     */
    init : function() {
		
		this.destroyExistingControls();
		
		for (var i = 0; i < this.editableLayers.length; i++) {
			this.editableLayers[i].layer.setVisibility(true);
		}
	},

    /** private: method[commitAll]
     */
	commitAll : function() {

		for (var i = 0; i < this.editableLayers.length; i++) {
			this.editableLayers[i].layer.setVisibility(false);
		}
		
		if (this.editControls[gxp.plugins.FeatureEditor2Constants.MODIFY]
			&& this.editControls[gxp.plugins.FeatureEditor2Constants.MODIFY].layer) {
			this.editControls[gxp.plugins.FeatureEditor2Constants.MODIFY].unselectFeature(this.currentObject.feature);
		}
		
		if (this.editControls[gxp.plugins.FeatureEditor2Constants.MOVE]
			&& this.editControls[gxp.plugins.FeatureEditor2Constants.MOVE].layer) {
			this.editControls[gxp.plugins.FeatureEditor2Constants.MOVE].unselectFeature(this.currentObject.feature);
		}
	},

    /** private: method[destroyExistingControls]
     */
	destroyExistingControls : function () {
		if (this.editControls[gxp.plugins.FeatureEditor2Constants.MODIFY]) {
			this.editControls[gxp.plugins.FeatureEditor2Constants.MODIFY].destroy();
		}

		if (this.editControls[gxp.plugins.FeatureEditor2Constants.MOVE]) {
			this.editControls[gxp.plugins.FeatureEditor2Constants.MOVE].destroy();
		}

		if (this.wmsGetFeatureControl) {
			this.wmsGetFeatureControl.destroy();
		}
	},

    /** private: method[createWmsGetFeatureControl]
     */
	createWmsGetFeatureControl: function() {

        var self = this;

		var map = this.target.mapPanel.map;
		
		var editableLayers = this.editableLayers;
		
		var currentObject = this.currentObject;

		var editControls = this.editControls;
	
		if (this.wmsGetFeatureControl) {
			this.wmsGetFeatureControl.destroy();
		}

		this.wmsGetFeatureControl = new OpenLayers.Control.WMSGetFeatureInfo({
			autoActivate: true,
			infoFormat: "application/vnd.ogc.gml",
			//maxFeatures: 1,
			eventListeners: {
				"getfeatureinfo": function(e) {
				
					var wmsGetFeatureControl = this;
					
					if (e.features.length > 0) {
					
						currentObject.feature = e.features[0];
						currentObject.editableLayer = null;
						
						for (var i = 0; i < editableLayers.length; i++) {
							
							if (editableLayers[i].layer.protocol.featureType == currentObject.feature.gml.featureType) {
								currentObject.editableLayer = editableLayers[i];
								break;
							}
						}
						
						if (currentObject.editableLayer != null) {

							var feature = null;
							
							for (var i = 0; i < currentObject.editableLayer.layer.features.length; i++) {
								if (currentObject.editableLayer.layer.features[i].fid == currentObject.feature.fid) {
									feature = currentObject.editableLayer.layer.features[i];
									break;
								}
							}

							if (feature == null) {

								var geometry = currentObject.feature.geometry.clone();
								geometry.transform(currentObject.editableLayer.projection, map.getProjectionObject());
								
								currentObject.feature.geometry = geometry;
								currentObject.editableLayer.layer.addFeatures([currentObject.feature]);
								currentObject.editableLayer.layer.setVisibility(true);
								
								feature = currentObject.feature;
							}
							
							if (feature != null) {

                                var virtual = {
                                    strokeColor: "#00CC27",
                                    fillColor: "#F9190D",
                                    strokeOpacity: 1,
                                    fillOpacity: 0.5,
                                    strokeWidth: 2,
                                    pointRadius: 5,
                                    graphicName: "square"
                                };

                                if (currentObject.editableLayer.type == gxp.plugins.FeatureDrawingConstants.POINT) {
                                    feature.style = new OpenLayers.Style(virtual);
                                }
							
								currentObject.feature = feature;
								currentObject.editableLayer.layer.setVisibility(true);

								switch (currentObject.editorType) {
									case gxp.plugins.FeatureEditor2Constants.MODIFY:
										editControls[gxp.plugins.FeatureEditor2Constants.MODIFY] =
											new OpenLayers.Control.ModifyFeature(currentObject.editableLayer.layer, {
												vertexRenderIntent: "vertex",
												virtualStyle: virtual,
												createVertices : true,
												mode : OpenLayers.Control.ModifyFeature.RESHAPE,
												eventListeners: {
													activate: function(event) {

													},
													deactivate: function(event) {
													
													}
												},
												trigger: function() {
												}
											});
											
										map.addControl(editControls[gxp.plugins.FeatureEditor2Constants.MODIFY]);
										editControls[gxp.plugins.FeatureEditor2Constants.MODIFY].activate();
										editControls[gxp.plugins.FeatureEditor2Constants.MODIFY].selectFeature(currentObject.feature);
										break;
									case gxp.plugins.FeatureEditor2Constants.MOVE:
										editControls[gxp.plugins.FeatureEditor2Constants.MOVE] =
											new OpenLayers.Control.ModifyFeature(currentObject.editableLayer.layer, {
												vertexRenderIntent: "vertex",
												virtualStyle: virtual,
												mode: OpenLayers.Control.ModifyFeature.DRAG | OpenLayers.Control.ModifyFeature.ROTATE | OpenLayers.Control.ModifyFeature.RESIZE,
												eventListeners: {
													activate: function(event) {

													},
													deactivate: function(event) {
													
													}
												},
												trigger: function() {
												}
											});

										map.addControl(editControls[gxp.plugins.FeatureEditor2Constants.MOVE]);
										editControls[gxp.plugins.FeatureEditor2Constants.MOVE].activate();
										editControls[gxp.plugins.FeatureEditor2Constants.MOVE].selectFeature(currentObject.feature);

										break;
									case gxp.plugins.FeatureEditor2Constants.DELETE:

										Ext.MessageBox.show({
											title:self.confirmDeleteTitle,
											msg: self.confirmDeleteMsg,
											buttons: Ext.Msg.YESNO,
											icon: Ext.MessageBox.QUESTION,
											fn: function(btn, text) {
													if (btn == 'yes'){
														if(currentObject.feature.fid == undefined) {
															currentObject.feature.layer.destroyFeatures([currentObject.feature]);
															
														} else {
														
															currentObject.feature.state = OpenLayers.State.DELETE;
															currentObject.feature.layer.events.triggerEvent("afterfeaturemodified", 
																					   {feature: currentObject.feature});
															currentObject.feature.renderIntent = "select";
															currentObject.feature.layer.drawFeature(currentObject.feature);
														}
													}
													
													if (currentObject.button.pressed) {
														currentObject.button.toggle();
													}
												}
											});
										
									default:
										break;
								}
								
								if (wmsGetFeatureControl) {
									wmsGetFeatureControl.deactivate();
								}
							}
						}
					}
				}
			}
		});

		this.target.mapPanel.map.addControl(this.wmsGetFeatureControl);
	},

    /** api: method[addActions]
     */
    addActions: function() {

        getAction();

        return gxp.plugins.FeatureEditor2.superclass.addActions.apply(this, [this.button]);
    },

	/** api: method[getAction]
     */
    getAction: function() {
        this.activeIndex = 0;
        this.button = new Ext.SplitButton({
            iconCls: "gxp-icon-map_edit",
            tooltip: this.editToolTip,
            buttonText: this.buttonText,
			text: this.buttonText,
			width: '165px',
            enableToggle: true,
            toggleGroup: this.toggleGroup,
            allowDepress: true,
            handler: function(button, event) {
                if(button.pressed) {
                    button.menu.items.itemAt(this.activeIndex).setChecked(true);
					this.deactivateOtherButtons(button);
                }
            },
            scope: this,
            listeners: {
                toggle: function(button, pressed) {
                    // toggleGroup should handle this
                    if(!pressed) {
                        button.menu.items.each(function(i) {
                            i.setChecked(false);
                        });
						button.setIconClass("gxp-icon-map_edit");
						button.setText(this.buttonText);
						this.commitAll();
						this.destroyExistingControls();
                    }
                },
                render: function(button) {
                    // toggleGroup should handle this
                    Ext.ButtonToggleMgr.register(button);
                },
				scope: this
            },
			menu: new Ext.menu.Menu({
			items: [
					new Ext.menu.CheckItem(
						new Ext.Action({
							text: this.modifyMenuText,
							iconCls: "gxp-icon-modify",
							toggleGroup: this.toggleGroup,
							group: this.toggleGroup,
							allowDepress: false,
							listeners: {
								checkchange: function(item, checked) {
									this.activeIndex = 0;
									this.currentObject.button = this.button;
									this.button.toggle(checked);
									if (checked) {
										this.button.setIconClass('gxp-icon-geodp-valid_chantier');
										this.button.setText('Valider');
										this.init();
										this.destroyExistingControls();
										this.currentObject.editorType = gxp.plugins.FeatureEditor2Constants.MODIFY;
										this.createWmsGetFeatureControl();
										this.deactivateOtherButtons(this.button);
									}
								},
								scope: this
							}
						})
					),
					new Ext.menu.CheckItem(
						new Ext.Action({
							text: this.moveMenuText,
							iconCls: "gxp-icon-move",
							toggleGroup: this.toggleGroup,
							group: this.toggleGroup,
							allowDepress: false,
							listeners: {
								checkchange: function(item, checked) {
									this.activeIndex = 1;
									this.currentObject.button = this.button;
									this.button.toggle(checked);
									if (checked) {
										this.button.setIconClass('gxp-icon-geodp-valid_chantier');
										this.button.setText('Valider');
										this.init();
										this.destroyExistingControls();
										this.currentObject.editorType = gxp.plugins.FeatureEditor2Constants.MOVE;
										this.createWmsGetFeatureControl();
										this.deactivateOtherButtons(this.button);
									}
								},
								scope: this
							}
						})
					),
					new Ext.menu.CheckItem(
						new Ext.Action({
							text: this.deleteMenuText,
							iconCls: "gxp-icon-trash",
							toggleGroup: this.toggleGroup,
							group: this.toggleGroup,
							allowDepress: false,
							listeners: {
								checkchange: function(item, checked) {
									this.activeIndex = 2;
									this.currentObject.button = this.button;
									this.button.toggle(checked);
									if (checked) {
										this.button.setIconClass(item.iconCls);
										this.button.setText(item.text);
										this.init();
										this.destroyExistingControls();
										this.currentObject.editorType = gxp.plugins.FeatureEditor2Constants.DELETE;
										this.createWmsGetFeatureControl();
										this.deactivateOtherButtons(this.button);
									}
									
								},
								scope: this
							}
						})
					)
				]
			})
        });

		if (this.button.pressed) {
			this.button.toggle();
		}
		
        return this.button;
    },

    /** api: method[enable]
     */
	enable: function() {
		this.button.enable();
	},

    /** api: method[disable]
     */
	disable: function() {
	
		if (this.button.pressed) {
			this.button.toggle();
		}
		
		this.button.disable();
	}
});

Ext.preg(gxp.plugins.FeatureEditor2.prototype.ptype, gxp.plugins.FeatureEditor2);
