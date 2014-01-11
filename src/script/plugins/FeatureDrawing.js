/**
 * https://github.com/frangin2003
 */

/**
 * @requires plugins/Tool.js
 * @requires OpenLayers/StyleMap.js
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Control/DrawFeature.js
 * @requires OpenLayers/Handler/Polygon.js
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Handler/Point.js
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/**
 * Supported layer types.
 */
gxp.plugins.FeatureDrawingConstants = {
	LINE:'Line',
	POLY:'Poly',
	POINT:'Point'
};

/** api: constructor
 *  .. class:: FeatureDrawing(config)
 *
 * Provides a menu to draw on layers given in config.
 * <ul>
 *     <li>Based on a WMS
 *     <li>You can pass as much as layers as you want.
 *     Currently only POINT, LINE and POLYGON layers are supported.</li>
 *     <li>You can allow text add to your layer (here symoblized by a checkbox with the Ext id given on config in
 *     'labelPromptCheckboxId'</li>
 *
 * The expected 'editableLayers' parameter expected structure is:
 *  
 *  editableLayers: [
 {
     layer: THE VECTOR LAYER TO DRAW ON,
     layerWMS: THE LAYER IN WMS FORM TO ALLOW LAYER REFRESH,
     saveStrategy: THE SAVE STRATEGY OF VECTOR LAYER,
     type: THE TYPE OF LAYER gxp.plugins.FeatureDrawingConstants.*
 },
 ...
 ]
 */
gxp.plugins.FeatureDrawing = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = gxp_featureDrawing */
	ptype: "gxp_featureDrawing",

    /** api: config[outputTarget]
     *  ``String`` Popups created by this tool are added to the map by default.
     */
    outputTarget: "map",

    /** api: config[drawToolTip]
     *  ``String``
     *  Text for the Draw split button tooltip (i18n).
     */
    drawToolTip: "Draw",

    /** api: config[buttonText]
     *  ``String``
     *  Text for the Draw split button (i18n).
     */
    buttonText: "Draw",

    /** api: config[defaultPolyMenuText]
     *  ``String``
     *  Default text for a polygon draw button (i18n).
     */
    defaultPolyMenuText: "Polygon",

    /** api: config[defaultPolyTooltip]
     *  ``String``
     *  Default text for a polygon draw button tooltip (i18n).
     */
    defaultPolyTooltip: "Draw a polygon",

    /** api: config[defaultPolyIconCls]
     *  ``String``
     *  Default icon class for a polygon draw button.
     */
    defaultPolyIconCls: "gxp-icon-symbolgrid-polygon",

    /** api: config[defaultLineMenuText]
     *  ``String``
     *  Default text for a line draw button (i18n).
     */
    defaultLineMenuText: "Line",

    /** api: config[defaultLineTooltip]
     *  ``String``
     *  Default text for a line draw button tooltip (i18n).
     */
    defaultLineTooltip: "Draw a line",

    /** api: config[defaultLineIconCls]
     *  ``String``
     *  Default icon class for a line draw button.
     */
    defaultLineIconCls: "gxp-icon-symbolgrid-line",

    /** api: config[defaultPointMenuText]
     *  ``String``
     *  Default text for a point draw button (i18n).
     */
    defaultPointMenuText: "Point",

    /** api: config[defaultPointTooltip]
     *  ``String``
     *  Default text for a point draw button tooltip (i18n).
     */
    defaultPointTooltip: "Draw a point",

    /** api: config[defaultPointIconCls]
     *  ``String``
     *  Default icon class for a point draw button (i18n).
     */
    defaultPointIconCls: "gxp-icon-bullet_red",


    /** api: config[labelPromptText]
     *  ``String``
     *  Text for text JS native prompt (i18n).
     */
    labelPromptText: 'Please type the feature text',

    /** api: config[labelPromptCheckboxId]
     *  ``String``
     *  id of a given checkbox Ext component to add text attribute to a feature.
     */
    labelPromptCheckboxId: null,


    /** api: config[currentLabel]
     *  ``String``
     *  Text for text attribute of current feature.
     */
    currentLabel: '',


    /** api: config[buttonText]
     *  ``String``
     *  Text for the Draw split button (i18n).
     */
    editableLayers: [],

    /** api: config[buttonText]
     *  ``String``
     *  Text for the Draw split button (i18n).
     */
    currentDrawNum: 0,

    /** api: config[buttonText]
     *  ``String``
     *  Text for the Draw split button (i18n).
     */
    currentEditableLayer: null,

    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.Measure.superclass.constructor.apply(this, arguments);

		Ext.apply(this, config);

        var self = this;

        var editableLayer = null;

        for (var i = 0; i < self.editableLayers.length; i++) {

            editableLayer = self.editableLayers[i];

            editableLayer.num = i;

            switch (editableLayer.type) {
                case gxp.plugins.FeatureDrawingConstants.POLY:
                    editableLayer.saveStrategy.events.on({
                        start: function(event) {
                            if (Ext.getCmp(self.labelPromptCheckboxId)) {
                                self.currentLabel = '';
                                if (Ext.getCmp(self.labelPromptCheckboxId).getValue()) {
                                    self.currentLabel = prompt(self.labelPromptText,"");
                                }
                            }
                            self.setPolyFeaturesAttributes(event.features);
                        },
                        success: function(event) {
                            self.currentEditableLayer.layerWMS.redraw(true);
                        },
                        fail: (console && console.log('save failed'))
                    });
                    editableLayer.control =
                        new OpenLayers.Control.DrawFeature(
                            editableLayer.layer,
                            OpenLayers.Handler.Polygon);

                    break;
                case gxp.plugins.FeatureDrawingConstants.LINE:

                    editableLayer.saveStrategy.events.on({
                        start: function(event) {
                            if (Ext.getCmp(self.labelPromptCheckboxId)) {
                                self.currentLabel = '';
                                if (Ext.getCmp(self.labelPromptCheckboxId).getValue()) {
                                    self.currentLabel = prompt(self.labelPromptText,"");
                                }
                            }
                            self.setLineFeaturesAttributes(event.features);
                        },
                        success: function(event) {
                            self.currentEditableLayer.layerWMS.redraw(true);
                        },
                        fail: (console && console.log('save failed'))
                    });
                    editableLayer.control = new OpenLayers.Control.DrawFeature(
                        editableLayer.layer,
                        OpenLayers.Handler.Path);

                    break;
                case gxp.plugins.FeatureDrawingConstants.POINT:
                    editableLayer.saveStrategy.events.on({
                        start: function(event) {
                            if (Ext.getCmp(self.labelPromptCheckboxId)) {
                                self.currentLabel = '';
                                if (Ext.getCmp(self.labelPromptCheckboxId).getValue()) {
                                    self.currentLabel = prompt(self.labelPromptText,"");
                                }
                            }
                            self.setPointFeaturesAttributes(event.features);
                        },
                        success: function(event) {
                            self.currentEditableLayer.layerWMS.redraw(true);
                        },
                        fail: (console && console.log('save failed'))
                    });
                    editableLayer.control = new OpenLayers.Control.DrawFeature(
                        editableLayer.layer,
                        OpenLayers.Handler.Point);

                    break;
            }
        }
	},

    /** private: method[destroy]
     */
    destroy: function() {
        this.button = null;
        gxp.plugins.Measure.superclass.destroy.apply(this, arguments);
    },

    /** api: method[deactivateAllButCurrent]
     */
	deactivateAllButCurrent : function() {
        var editableLayer = null;
        for (var i = 0; i < this.editableLayers.length; i++) {

            editableLayer = this.editableLayers[i];

            if (editableLayer.num != this.currentDrawNum) {
                editableLayer.control.deactivate();
            }
        }
	},

    /** api: method[addActions]
     */
    addActions: function() {

        getAction();

        return gxp.plugins.FeatureDrawing.superclass.addActions.apply(this, [this.button]);
    },

    /** api: method[getAction]
     */
    getAction: function() {

        var self = this;

        var menuItems = [];

        var editableLayer = null;

        for (var i = 0; i < this.editableLayers.length; i++) {

            editableLayer = this.editableLayers[i];

            switch (editableLayer.type) {
                case gxp.plugins.FeatureDrawingConstants.POLY:
                    menuItems.push(
                        new Ext.menu.CheckItem(
                            new GeoExt.Action({
                                editableLayer: editableLayer,
                                text: editableLayer.menuText?editableLayer.menuText:this.defaultPolyMenuText,
                                iconCls: editableLayer.iconCls?editableLayer.iconCls:this.defaultPolyIconCls,
                                toggleGroup: this.toggleGroup,
                                group: this.toggleGroup,
                                allowDepress: false,
                                listeners: {
                                    checkchange: function(item, checked) {
                                        this.currentDrawNum = item.editableLayer.num;
                                        this.currentEditableLayer = item.editableLayer;
                                        this.button.toggle(checked);
                                        if (checked) {
                                            this.button.setIconClass(item.iconCls);
                                            this.button.setText(item.text);
                                            this.deactivateAllButCurrent();
                                        }
                                    },
                                    scope: this
                                },
                                map: this.target.mapPanel.map,
                                control: editableLayer.control
                            })
                        )
                    );
                    break;
                case gxp.plugins.FeatureDrawingConstants.LINE:
                    menuItems.push(
                        new Ext.menu.CheckItem(
                            new GeoExt.Action({
                                editableLayer: editableLayer,
                                text: editableLayer.menuText?editableLayer.menuText:this.defaultLineMenuText,
                                iconCls: editableLayer.iconCls?editableLayer.iconCls:this.defaultLineIconCls,
                                toggleGroup: this.toggleGroup,
                                group: this.toggleGroup,
                                allowDepress: false,
                                listeners: {
                                    checkchange: function(item, checked) {
                                        this.currentDrawNum = item.editableLayer.num;
                                        this.currentEditableLayer = item.editableLayer;
                                        this.button.toggle(checked);
                                        if (checked) {
                                            this.button.setIconClass(item.iconCls);
                                            this.button.setText(item.text);
                                            this.deactivateAllButCurrent();
                                        }
                                    },
                                    scope: this
                                },
                                map: this.target.mapPanel.map,
                                control: editableLayer.control
                            })
                        )
                    );
                    break;
                case gxp.plugins.FeatureDrawingConstants.POINT:
                    menuItems.push(
                        new Ext.menu.CheckItem(
                            new GeoExt.Action({
                                editableLayer: editableLayer,
                                text: editableLayer.menuText?editableLayer.menuText:this.defaultPointMenuText,
                                iconCls: editableLayer.iconCls?editableLayer.iconCls:this.defaultPointIconCls,
                                toggleGroup: this.toggleGroup,
                                group: this.toggleGroup,
                                listeners: {
                                    checkchange: function(item, checked) {
                                        this.currentDrawNum = item.editableLayer.num;
                                        this.currentEditableLayer = item.editableLayer;
                                        this.button.toggle(checked);
                                        if (checked) {
                                            this.button.setIconClass(item.iconCls);
                                            this.button.setText(item.text);
                                            this.deactivateAllButCurrent();
                                        }
                                    },
                                    scope: this
                                },
                                map: this.target.mapPanel.map,
                                control: editableLayer.control
                            })
                        )
                    );
                    break;
            }
        }

        this.currentDrawNum = 0;
        this.button = new Ext.SplitButton({
            id: 'id_draw_button',
            iconCls: "gxp-icon-addfeature",
            tooltip: this.drawToolTip,
            buttonText: this.buttonText,
			text: this.buttonText,
			width: '165px',
            enableToggle: true,
            toggleGroup: this.toggleGroup,
            allowDepress: true,
            handler: function(button, event) {
                if(button.pressed) {
                    button.menu.items.itemAt(this.currentDrawNum).setChecked(true);
					this.deactivateOtherButtons(button);
				} else {
					button.setIconClass("gxp-icon-addfeature");
					button.setText(this.buttonText);

                    for (var i = 0; i < this.editableLayers.length; i++) {
                        this.editableLayers[i].layer.redraw(true);
                    }
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
                    }
                },
                render: function(button) {
                    // toggleGroup should handle this
                    Ext.ButtonToggleMgr.register(button);
                }
            },
            menu: new Ext.menu.Menu({
                items: menuItems
            })
        });

		if (this.button.pressed) {
			this.button.toggle();
		}
		//this.button.disable();
		
        return this.button;
    },

    /** api: method[setPolyFeaturesAttributes]
     */
    setPolyFeaturesAttributes: function(features) {
    },

    /** api: method[setLineFeaturesAttributes]
     */
    setLineFeaturesAttributes: function(features) {
    },

    /** api: method[setPointFeaturesAttributes]
     */
    setPointFeaturesAttributes: function(features) {
    },

    /** api: method[setCurrentEditableLayer]
     */
    setCurrentEditableLayer: function(currentEditableLayer) {
        this.currentEditableLayer = currentEditableLayer;
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

Ext.preg(gxp.plugins.FeatureDrawing.prototype.ptype, gxp.plugins.FeatureDrawing);
