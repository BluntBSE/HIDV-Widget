///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

var LineData = [];
var PointData = [];
var gpUrl = "";
var geometryUrl = "";

define(['dojo/_base/declare', 'dojo/_base/lang', "dojo/on",
  "esri/map",
  "esri/tasks/Geoprocessor",
  "esri/graphic",
  "esri/graphicsUtils",

  "esri/geometry/Point", "esri/geometry/Polyline", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
  "esri/Color", "esri/InfoTemplate",

  "esri/toolbars/draw",

  "esri/geometry/Extent", "esri/SpatialReference", "esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "esri/geometry/projection",

  "esri/layers/GraphicsLayer",

  "esri/layers/FeatureLayer",

  "esri/renderers/SimpleRenderer",

  "esri/dijit/util/busyIndicator",

  'jimu/BaseWidget'],
  function (declare, lang, on,

    Map,

    Geoprocessor, Graphic,

    graphicsUtils,

    Point, Polyline, SimpleMarkerSymbol, SimpleLineSymbol, Color, InfoTemplate,

    Draw,

    Extent, SpatialReference, GeometryService, ProjectParameters, projection,

    GraphicsLayer,

    FeatureLayer,

    SimpleRenderer,

    busyIndicator,

    BaseWidget
  ) {
    return declare([BaseWidget], {

      baseClass: 'jimu-widget-hidvWidget',

      // boolean to determine if draw tool has already been activated
      pointDrawBoolean: false,

      selectedSection: "Control Section",

      //About the communication between widgets:
      //  * Two widgets can communicate each other directly, or using data transferred by DataManager.
      //
      //  * If you want to share data, please call the "publishData" (this.publishData) function. the published data will
      //    be stored in DataManager of the WAB.
      //
      //  * If you want to read share data, you can override "onReceiveData" method. Whenever
      //    any widget publishes data, this method will be invoked. (communication directly)
      //
      //  * If you want to read the data that published before your widget loaded, you can call
      //    "fetchData" method (as seen in WidgetB's 'Widget.js" file) and get data via the "onReceiveData" method which 
      //    you will need to add to your "Widget.js" file . If the data contains
      //    history data, it will be available in "historyData" parameter.
      //      (transferred by DataManager)
      postCreate: function () {
        this.inherited(arguments);
        console.log('postCreate');
        
      },

      startup: function () {
        this.inherited(arguments);
        console.log('startup', this);

        console.log('this.map:', this.map);

        // CONFIG VARS
        gpUrl = this.config.gpUrl;
        geometryUrl = this.config.geometryUrl;

        // Create loading indicator
        this.busyIndicator = busyIndicator.create({
          target: this.id,
          imageUrl: this.folderUrl + "/images/loading.gif"
        });

        // Symbology for returned routes
        this.routeSymbol = new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([26, 255, 5]),
          5
        );

        var routeRenderer = new SimpleRenderer(this.routeSymbol);

        /*Create Temp Feature Layer for Polylines*/
        var polylineLayerDefinition = {
          "geometryType": "esriGeometryPolyline",
          "fields": [{
            'name': 'FID', 'type': 'esriFieldTypeOID', 'alias': 'FID'
          },
          {
            'name': 'RouteID', 'type': 'esriFieldTypeString', 'alias': 'RouteID', 'length': 254
          },
          {
            'name': 'FromMeasur', 'type': 'esriFieldTypeString', 'alias': 'From Measure', 'length': 254
          },
          {
            'name': 'ToMeasure', 'type': 'esriFieldTypeString', 'alias': 'To Measure', 'length': 254
          },
          {
            'name': 'RouteName', 'type': 'esriFieldTypeString', 'alias': 'Route Name', 'length': 254
          },
          {
            'name': 'RouteTrave', 'type': 'esriFieldTypeString', 'alias': 'Route Travel Direction', 'length': 254
          },
          {
            'name': 'SegmentLen', 'type': 'esriFieldTypeString', 'alias': 'Segment Length By Measure', 'length': 254
          },
          {
            'name': 'LRSID', 'type': 'esriFieldTypeString', 'alias': 'LRSID', 'length': 254
          },
          {
            'name': 'BeginLogMi', 'type': 'esriFieldTypeString', 'alias': 'Begin Log Mile', 'length': 254
          },
          {
            'name': 'EndLogMile', 'type': 'esriFieldTypeString', 'alias': 'End Log Mile', 'length': 254
          },
          {
            'name': 'ControlSec', 'type': 'esriFieldTypeString', 'alias': 'Control Section', 'length': 254
          },
          {
            'name': 'DOTD_Distr', 'type': 'esriFieldTypeString', 'alias': 'LaDOTD District Name', 'length': 254
          },
          {
            'name': 'DOTD_Dis_1', 'type': 'esriFieldTypeString', 'alias': 'LaDOTD District Number', 'length': 254
          },
          {
            'name': 'ParishName', 'type': 'esriFieldTypeString', 'alias': 'Parish Name', 'length': 254
          },
          {
            'name': 'ParishNumb', 'type': 'esriFieldTypeString', 'alias': 'Parish Number', 'length': 254
          },
          {
            'name': 'ParishFIPS', 'type': 'esriFieldTypeString', 'alias': 'Parish FIPS', 'length': 254
          },
          {
            'name': 'Metropolit', 'type': 'esriFieldTypeString', 'alias': 'Metropolitan Area Name', 'length': 254
          },
          {
            'name': 'Metropol_1', 'type': 'esriFieldTypeString', 'alias': 'Metropolitan Area FIPS', 'length': 254
          },
          {
            'name': 'Incorporat', 'type': 'esriFieldTypeString', 'alias': 'Incorporated Area Name', 'length': 254
          },
          {
            'name': 'Incorpor_1', 'type': 'esriFieldTypeString', 'alias': 'Incorporated Area FIPS', 'length': 254
          },
          {
            'name': 'iVisionURL', 'type': 'esriFieldTypeString', 'alias': 'iVision URL', 'length': 254
          },
          {
            'name': 'AADT', 'type': 'esriFieldTypeString', 'alias': 'AADT', 'length': 254
          },
          {
            'name': 'AccessCo_1', 'type': 'esriFieldTypeString', 'alias': 'Access Control Description', 'length': 254
          },
          {
            'name': 'FedAidStat', 'type': 'esriFieldTypeString', 'alias': 'Federal Aid Status Description', 'length': 254
          },
          {
            'name': 'Function_1', 'type': 'esriFieldTypeString', 'alias': 'Functional System Description', 'length': 254
          },
          {
            'name': 'Function_3', 'type': 'esriFieldTypeString', 'alias': 'Functional System Urban Area', 'length': 254
          },
          {
            'name': 'Function_4', 'type': 'esriFieldTypeString', 'alias': 'Functional System Urban/Rural', 'length': 254
          },
          {
            'name': 'MedianTy_1', 'type': 'esriFieldTypeString', 'alias': 'Median Type', 'length': 254
          },
          {
            'name': 'MedianWidt', 'type': 'esriFieldTypeString', 'alias': 'Median Width (FT)', 'length': 254
          },
          {
            'name': 'NHSDesc', 'type': 'esriFieldTypeString', 'alias': 'NHS Description', 'length': 254
          },
          {
            'name': 'NumberOfLa', 'type': 'esriFieldTypeString', 'alias': 'Number of Lanes', 'length': 254
          },
          {
            'name': 'LaneWidthF', 'type': 'esriFieldTypeString', 'alias': 'Lane Width (FT)', 'length': 254
          },
          {
            'name': 'RightSizeS', 'type': 'esriFieldTypeString', 'alias': 'Right Size Status', 'length': 254
          },
          {
            'name': 'RightSize1', 'type': 'esriFieldTypeString', 'alias': 'Right Size Description', 'length': 254
          },
          {
            'name': 'SurfaceT_1', 'type': 'esriFieldTypeString', 'alias': 'Surface Type Description', 'length': 254
          },
          {
            'name': 'ShoulderTy', 'type': 'esriFieldTypeString', 'alias': 'Shoulder Outside Primary', 'length': 254
          },
          {
            'name': 'Shoulder_1', 'type': 'esriFieldTypeString', 'alias': 'Shoulder Outside Secondary', 'length': 254
          },
          {
            'name': 'STRAHNETDe', 'type': 'esriFieldTypeString', 'alias': 'STRAHNET Description', 'length': 254
          },
          {
            'name': 'TruckDesc', 'type': 'esriFieldTypeString', 'alias': 'Truck Route Description', 'length': 254
          },
          {
            'name': 'UTMXEnd_NA', 'type': 'esriFieldTypeString', 'alias': 'UTM X End (NAD83-15N)', 'length': 254
          },
          {
            'name': 'UTMYEnd_NA', 'type': 'esriFieldTypeString', 'alias': 'UTM Y End (NAD83-15N)', 'length': 254
          },
          {
            'name': 'UTMXStart_', 'type': 'esriFieldTypeString', 'alias': 'UTM X Start (NAD83-15N)', 'length': 254
          },
          {
            'name': 'UTMYStart_', 'type': 'esriFieldTypeString', 'alias': 'UTM Y Start (NAD83-15N)', 'length': 254
          },
          {
            'name': 'LatitudeEn', 'type': 'esriFieldTypeString', 'alias': 'Latitude End (NAD83)', 'length': 254
          },
          {
            'name': 'LongitudeE', 'type': 'esriFieldTypeString', 'alias': 'Longitude End (NAD83)', 'length': 254
          },
          {
            'name': 'LatitudeSt', 'type': 'esriFieldTypeString', 'alias': 'Latitude Start (NAD83)', 'length': 254
          },
          {
            'name': 'LongitudeS', 'type': 'esriFieldTypeString', 'alias': 'Longitude Start (NAD83)', 'length': 254
          },
          {
            'name': 'Shape_Leng', 'type': 'esriFieldTypeDouble', 'alias': 'Shape Length', 'length': 254
          },
          {
            'name': 'OBJECTID', 'type': 'esriFieldTypeInteger', 'alias': 'Object ID', 'length': 254
          },
          {
            'name': 'Shape_Length', 'type': 'esriFieldTypeDouble', 'alias': 'Shape Length 2', 'length': 254
          }]
        }
        var outputPolylineFeatureCollection = {
          layerDefinition: polylineLayerDefinition,
          featureSet: null
        };

        this.outputPolylineFeatureLayer = new FeatureLayer(outputPolylineFeatureCollection,
          {
            id: "Output Route Polyline"
          });
        this.outputPolylineFeatureLayer.setRenderer(routeRenderer);

        /*End Temp Feature Layer for Polylines*/

        // Graphics layer for Start/End Points
        this.inputStartPointLayer = new GraphicsLayer({
          id: "routeStartInputPoint"
        });

        this.inputEndPointLayer = new GraphicsLayer({
          id: "routeEndInputPoint"
        });

        //Alison added:
        // Symbology for returned points

        this.pointSymbol = new SimpleMarkerSymbol({
          "color": [0, 255, 0, 50],
          "size": 12,
          "angle": -30,
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": "esriSMSCircle",
          "outline": {
            "color": [255, 255, 255, 30],
            "width": 1.5,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        });

        var pointRenderer = new SimpleRenderer(this.pointSymbol);

        /*Create Temp Feature Layer for POINTS*/
        var pointLayerDefinition = {
          "geometryType": "esriGeometryPoint",
          "fields": [{
            'name': 'FID', 'type': 'esriFieldTypeOID', 'alias': 'FID'
          },
          {
            'name': 'RouteID', 'type': 'esriFieldTypeString', 'alias': 'RouteID', 'length': 254
          },
          //{ 'name': 'FromMeasur', 'type': 'esriFieldTypeString', 'alias': 'From Measure', 'length': 254
          //},
          //{ 'name': 'ToMeasure', 'type': 'esriFieldTypeString', 'alias': 'To Measure', 'length': 254
          //},
          //Alison added:
          {
            'name': 'Measure', 'type': 'esriFieldTypeString', 'alias': 'Measure', 'length': 254
          },
          {
            'name': 'RouteName', 'type': 'esriFieldTypeString', 'alias': 'Route Name', 'length': 254
          },
          {
            'name': 'RouteTrave', 'type': 'esriFieldTypeString', 'alias': 'Route Travel Direction', 'length': 254
          },
          //{ 'name': 'SegmentLen', 'type': 'esriFieldTypeString', 'alias': 'Segment Length By Measure', 'length': 254
          //},
          {
            'name': 'LRSID', 'type': 'esriFieldTypeString', 'alias': 'LRSID', 'length': 254
          },
          //{ 'name': 'BeginLogMi', 'type': 'esriFieldTypeString', 'alias': 'Begin Log Mile', 'length': 254
          //},
          //{ 'name': 'EndLogMile', 'type': 'esriFieldTypeString', 'alias': 'End Log Mile', 'length': 254
          //},
          //Alison added:
          {
            'name': 'LogMile', 'type': 'esriFieldTypeString', 'alias': 'Log Mile', 'length': 254
          },
          {
            'name': 'ControlSec', 'type': 'esriFieldTypeString', 'alias': 'Control Section', 'length': 254
          },
          {
            'name': 'DOTD_Distr', 'type': 'esriFieldTypeString', 'alias': 'LaDOTD District Name', 'length': 254
          },
          {
            'name': 'DOTD_Dis_1', 'type': 'esriFieldTypeString', 'alias': 'LaDOTD District Number', 'length': 254
          },
          {
            'name': 'ParishName', 'type': 'esriFieldTypeString', 'alias': 'Parish Name', 'length': 254
          },
          {
            'name': 'ParishNumb', 'type': 'esriFieldTypeString', 'alias': 'Parish Number', 'length': 254
          },
          {
            'name': 'ParishFIPS', 'type': 'esriFieldTypeString', 'alias': 'Parish FIPS', 'length': 254
          },
          {
            'name': 'Metropolit', 'type': 'esriFieldTypeString', 'alias': 'Metropolitan Area Name', 'length': 254
          },
          {
            'name': 'Metropol_1', 'type': 'esriFieldTypeString', 'alias': 'Metropolitan Area FIPS', 'length': 254
          },
          {
            'name': 'Incorporat', 'type': 'esriFieldTypeString', 'alias': 'Incorporated Area Name', 'length': 254
          },
          {
            'name': 'Incorpor_1', 'type': 'esriFieldTypeString', 'alias': 'Incorporated Area FIPS', 'length': 254
          },
          {
            'name': 'iVisionURL', 'type': 'esriFieldTypeString', 'alias': 'iVision URL', 'length': 254
          },
          {
            'name': 'AADT', 'type': 'esriFieldTypeString', 'alias': 'AADT', 'length': 254
          },
          {
            'name': 'AccessCo_1', 'type': 'esriFieldTypeString', 'alias': 'Access Control Description', 'length': 254
          },
          {
            'name': 'FedAidStat', 'type': 'esriFieldTypeString', 'alias': 'Federal Aid Status Description', 'length': 254
          },
          {
            'name': 'Function_1', 'type': 'esriFieldTypeString', 'alias': 'Functional System Description', 'length': 254
          },
          {
            'name': 'Function_3', 'type': 'esriFieldTypeString', 'alias': 'Functional System Urban Area', 'length': 254
          },
          {
            'name': 'Function_4', 'type': 'esriFieldTypeString', 'alias': 'Functional System Urban/Rural', 'length': 254
          },
          {
            'name': 'MedianTy_1', 'type': 'esriFieldTypeString', 'alias': 'Median Type', 'length': 254
          },
          {
            'name': 'MedianWidt', 'type': 'esriFieldTypeString', 'alias': 'Median Width (FT)', 'length': 254
          },
          {
            'name': 'NHSDesc', 'type': 'esriFieldTypeString', 'alias': 'NHS Description', 'length': 254
          },
          {
            'name': 'NumberOfLa', 'type': 'esriFieldTypeString', 'alias': 'Number of Lanes', 'length': 254
          },
          {
            'name': 'LaneWidthF', 'type': 'esriFieldTypeString', 'alias': 'Lane Width (FT)', 'length': 254
          },
          {
            'name': 'RightSizeS', 'type': 'esriFieldTypeString', 'alias': 'Right Size Status', 'length': 254
          },
          {
            'name': 'RightSize1', 'type': 'esriFieldTypeString', 'alias': 'Right Size Description', 'length': 254
          },
          {
            'name': 'SurfaceT_1', 'type': 'esriFieldTypeString', 'alias': 'Surface Type Description', 'length': 254
          },
          {
            'name': 'ShoulderTy', 'type': 'esriFieldTypeString', 'alias': 'Shoulder Outside Primary', 'length': 254
          },
          {
            'name': 'Shoulder_1', 'type': 'esriFieldTypeString', 'alias': 'Shoulder Outside Secondary', 'length': 254
          },
          {
            'name': 'STRAHNETDe', 'type': 'esriFieldTypeString', 'alias': 'STRAHNET Description', 'length': 254
          },
          {
            'name': 'TruckDesc', 'type': 'esriFieldTypeString', 'alias': 'Truck Route Description', 'length': 254
          },
          /*{ 'name': 'UTMXEnd_NA', 'type': 'esriFieldTypeString', 'alias'0: 'UTM X End (NAD83-15N)', 'length': 254
          },
          { 'name': 'UTMYEnd_NA', 'type': 'esriFieldTypeString', 'alias': 'UTM Y End (NAD83-15N)', 'length': 254
          },
          { 'name': 'UTMXStart_', 'type': 'esriFieldTypeString', 'alias': 'UTM X Start (NAD83-15N)', 'length': 254
          },
          { 'name': 'UTMYStart_', 'type': 'esriFieldTypeString', 'alias': 'UTM Y Start (NAD83-15N)', 'length': 254
          },
          { 'name': 'LatitudeEn', 'type': 'esriFieldTypeString', 'alias': 'Latitude End (NAD83)', 'length': 254
          },
          { 'name': 'LongitudeE', 'type': 'esriFieldTypeString', 'alias': 'Longitude End (NAD83)', 'length': 254
          },
          { 'name': 'LatitudeSt', 'type': 'esriFieldTypeString', 'alias': 'Latitude Start (NAD83)', 'length': 254
          },
          { 'name': 'LongitudeS', 'type': 'esriFieldTypeString', 'alias': 'Longitude Start (NAD83)', 'length': 254
          },*/
          //Alison added:
          {
            'name': 'UTMX', 'type': 'esriFieldTypeString', 'alias': 'UTM X (NAD83-15N)', 'length': 254
          },
          {
            'name': 'UTMY', 'type': 'esriFieldTypeString', 'alias': 'UTM Y (NAD83-15N)', 'length': 254
          },
          {
            'name': 'Latitude', 'type': 'esriFieldTypeString', 'alias': 'Latitude (NAD83)', 'length': 254
          },
          {
            'name': 'Longitude', 'type': 'esriFieldTypeString', 'alias': 'Longitude (NAD83)', 'length': 254
          },
          //{ 'name': 'Shape_Leng', 'type': 'esriFieldTypeDouble', 'alias': 'Shape Length', 'length': 254
          //},
          {
            'name': 'OBJECTID', 'type': 'esriFieldTypeInteger', 'alias': 'Object ID', 'length': 254
          }//,
            //{ 'name': 'Shape_Length', 'type': 'esriFieldTypeDouble', 'alias': 'Shape Length 2', 'length': 254
            //}
          ]
        }

        var outputPointFeatureCollection = {
          layerDefinition: pointLayerDefinition,
          featureSet: null
        };

        this.outputPointFeatureLayer = new FeatureLayer(outputPointFeatureCollection,
          {
            id: "Output Route Point"
          });
        this.outputPointFeatureLayer.setRenderer(pointRenderer);
        /*End Temp Feature Layer for Points*/

        //		Graphics layer for Coordinate Points
        this.coordinatePointLayer = new GraphicsLayer({
          id: "coordinatePoint"
        });
        //*End //Alison added: section

        this.map.addLayers([this.outputPolylineFeatureLayer, this.inputStartPointLayer, this.inputEndPointLayer]);
        //Alison added:
        this.map.addLayers([this.outputPointFeatureLayer, this.coordinatePointLayer]);


        this.startToolbar = new Draw(this.map);
        this.endToolbar = new Draw(this.map);
        //Alison added:
        this.coordinateToolbar = new Draw(this.map);


        this.startSymbol = new SimpleMarkerSymbol({
          "color": [0, 255, 0, 80],
          "size": 12,
          "angle": -30,
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": "esriSMSCircle",
          "outline": {
            "color": [0, 0, 0, 255],
            "width": 1,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        });

        this.endSymbol = new SimpleMarkerSymbol({
          "color": [255, 0, 0, 80],
          "size": 12,
          "angle": -30,
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": "esriSMSCircle",
          "outline": {
            "color": [0, 0, 0, 255],
            "width": 1,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        });

        this.map.addLayers([this.outputPolylineFeatureLayer, this.inputStartPointLayer, this.inputEndPointLayer]);

        this.startToolbar = new Draw(this.map);
        this.endToolbar = new Draw(this.map);

        this.startSymbol = new SimpleMarkerSymbol({
          "color": [0, 255, 0, 80],
          "size": 12,
          "angle": -30,
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": "esriSMSCircle",
          "outline": {
            "color": [0, 0, 0, 255],
            "width": 1,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        });

        this.endSymbol = new SimpleMarkerSymbol({
          "color": [255, 0, 0, 80],
          "size": 12,
          "angle": -30,
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": "esriSMSCircle",
          "outline": {
            "color": [0, 0, 0, 255],
            "width": 1,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        });

        on(this.GPSubmitNode, 'click', lang.hitch(this, this._submitToGPService));

        on(this.startPointBtn, 'click', lang.hitch(this, this._activateDrawStartPoint));

        on(this.endPointBtn, 'click', lang.hitch(this, this._activateDrawEndPoint));

        //Alison added:
        on(this.coordinatePointBtn, 'click', lang.hitch(this, this._activateDrawPoint));
        on(this.clearCoordinateBtn, 'click', lang.hitch(this, this._clearDrawPoints));

        on(this.clearXYBtn, 'click', lang.hitch(this, this._clearDrawPoints));

        on(this.reset, 'click', lang.hitch(this, this._reset));

      },

      // Control which sections are visible
      _radioSectionControl: function (evt) {

        console.log('section control: ', evt);

        var radioTarget = evt.target.value;

        if (radioTarget == 'Control Section') {

          // show section
          this.ControlSectionGroup.style.display = "block";

          // hide sections
          this.LRSGroup.style.display = "none";
          this.RoutesGroup.style.display = "none";
          this.XYCoordinateGroup.style.display = "none";
          //Alison added:
          //this.PointCoordinateGroup.style.display = "none";
          //Robert added
          this.SingleSectionGroup.style.display = "none";
          this.selectedSection = "Control Section";

        } else if (radioTarget == 'RouteID Section') {

          // show section
          this.RoutesGroup.style.display = "block";

          // hide sections
          this.LRSGroup.style.display = "none";
          this.ControlSectionGroup.style.display = "none";
          this.XYCoordinateGroup.style.display = "none";
          this.SingleSectionGroup.style.display = "none";

          this.selectedSection = "RouteID Section";

        } else if (radioTarget == 'LRSID Section') {

          // show section
          this.LRSGroup.style.display = "block";

          // hide sections
          this.RoutesGroup.style.display = "none";
          this.ControlSectionGroup.style.display = "none";
          this.XYCoordinateGroup.style.display = "none";
          this.SingleSectionGroup.style.display = "none";

          this.selectedSection = "LRSID Section";

        } else if (radioTarget == 'XY Section') {
          // show section
          this.XYCoordinateGroup.style.display = "block";

          // hide sections
          this.RoutesGroup.style.display = "none";
          this.ControlSectionGroup.style.display = "none";
          this.LRSGroup.style.display = "none";
          this.SingleSectionGroup.style.display = "none";

          this.selectedSection = "XY Section";

        }
        //Robert added
        else if (radioTarget == 'Single Section') {
          // show section
          this.SingleSectionGroup.style.display = "block";

          // hide sections
          this.RoutesGroup.style.display = "none";
          this.ControlSectionGroup.style.display = "none";
          this.LRSGroup.style.display = "none";
          this.XYCoordinateGroup.style.display = "none";
          
          this.selectedSection = "Single Section";

        }

      },

      // Turn on Draw tool for the XY Start Point
      _activateDrawStartPoint: function () {
        if (this.pointDrawBoolean == false) {

          // activate draw tool for start point
          this.startToolbar.activate(Draw.POINT);

          this.pointDrawBoolean = true;

          on(this.startToolbar, "draw-complete", lang.hitch(this, this._updateStartPoint));

        } else {
          console.log('finish drawing with the other tool first!');
        }
        document.getElementById("startPointBtn").className += " secbuttonactive";
        document.getElementById("startPointBtn").classList.remove("secbutton");
        document.getElementById("startPointBtn").classList.remove("secbuttondone");
        document.getElementById("endPointBtn").disabled = true;
      },

      // Update the Start XY Point values and graphic
      _updateStartPoint: function (evt) {

        // update the start point
        console.log('_updateStartPoint evt: ', evt);

        this.inputStartPointLayer.clear(); //This should stay (I think?)

        this.startToolbar.deactivate();

        this.pointDrawBoolean = false;

        this.startXInputNode.value = evt.geographicGeometry.x;
        this.startYInputNode.value = evt.geographicGeometry.y;

        var graphic = new Graphic(evt.geometry, this.startSymbol);
        this.inputStartPointLayer.add(graphic);

        document.getElementById("startPointBtn").className += " secbuttondone";
        document.getElementById("startPointBtn").classList.remove("secbuttonactive");
        document.getElementById("endPointBtn").disabled = false;
      },

      // Turn on Draw tool for the XY End Point
      _activateDrawEndPoint: function () {
        // activate draw tool for point
        if (this.pointDrawBoolean == false) {

          // activate draw tool for end point
          this.endToolbar.activate(Draw.POINT);

          this.pointDrawBoolean = true;

          on(this.endToolbar, "draw-complete", lang.hitch(this, this._updateEndPoint));

        } else {
          console.log('finish drawing with the other tool first!');
        }

        document.getElementById("endPointBtn").className += " secbuttonactive";
        document.getElementById("endPointBtn").classList.remove("secbutton");
        document.getElementById("endPointBtn").classList.remove("secbuttondone");
        document.getElementById("startPointBtn").disabled = true;
      },

      // Update the End XY Point values and graphic
      _updateEndPoint: function (evt) {

        // update the end point
        console.log('_updateEndPoint evt: ', evt);

        this.endToolbar.deactivate();

        this.inputEndPointLayer.clear();

        this.pointDrawBoolean = false;

        this.endXInputNode.value = evt.geographicGeometry.x;
        this.endYInputNode.value = evt.geographicGeometry.y;

        var graphic = new Graphic(evt.geometry, this.endSymbol);
        this.inputEndPointLayer.add(graphic);

        document.getElementById("endPointBtn").className += " secbuttondone";
        document.getElementById("endPointBtn").classList.remove("secbuttonactive");
        document.getElementById("startPointBtn").disabled = false;
      },

      // Clear the Start/End/Regular Point GraphicsLayer
      _clearDrawPoints: function () {

        // clear XY coordinates and graphics
        this.inputStartPointLayer.clear();
        this.inputEndPointLayer.clear();
        this.coordinatePointLayer.clear();

        this.startXInputNode.value = "";
        this.startYInputNode.value = "";

        this.endXInputNode.value = "";
        this.endYInputNode.value = "";

        this.coordinateXInputNode.value = "";
        this.coordinateYInputNode.value = "";

        resetPointButtons();
      },

      _reset: function () {
        resetPointButtons();
        this.inputStartPointLayer.clear();
        this.inputEndPointLayer.clear();
        this.coordinatePointLayer.clear();
        document.getElementById("downloadData").disabled = true;
        document.getElementById("debugMessages").innerHTML = "";
        document.getElementById("messages").style.display = "none";
        var elements = document.getElementsByTagName("input");
        for (var ii = 0; ii < elements.length; ii++) {
          if (elements[ii].type == "text") {
            elements[ii].value = "";
          }
        }
      },

      //Alison added:
      _activateDrawPoint: function () {
        console.log("activate DrawPoint engaged")
        if (this.pointDrawBoolean == false) {

          // activate draw tool for start point
          this.coordinateToolbar.activate(Draw.POINT); //Robert note: Bug here

          this.pointDrawBoolean = true;

          on(this.coordinateToolbar, "draw-complete", lang.hitch(this, this._updateDrawPoint)); 

        } else {
          console.log('finish drawing with the other tool first!');
        }
        document.getElementById("coordinatePointBtn").className += " secbuttonactive";
        document.getElementById("coordinatePointBtn").classList.remove("secbutton");
        document.getElementById("coordinatePointBtn").classList.remove("secbuttondone");
      },
      // Update the coordinatePoint values and graphic
      _updateDrawPoint: function (evt) {
        console.log("Click registered from _updateDrawPoint") //updateDrawPoint is not being called
        // update the coordinate point 
        console.log('_updatePoint evt: ', evt);
        
        this.coordinatePointLayer.clear(); //Bug here

        //this.startToolbar.deactivate();

        this.pointDrawBoolean = false;
        console.log("What's going on here?  Is InputNode (for comparables) in some other files?!")
        this.coordinateXInputNode.value = 0// test
        this.coordinateYInputNode.value = 0//test
        console.log("Trying this2!")
        this.coordinateXInputNode.value = evt.geographicGeometry.x; //also at 878
        this.coordinateYInputNode.value = evt.geographicGeometry.y;

        var graphic = new Graphic(evt.geometry, this.startSymbol); //Is StartSymbol available?
        this.inputStartPointLayer.add(graphic);

        document.getElementById("coordinatePointBtn").className += " secbuttondone";
        document.getElementById("coordinatePointBtn").classList.remove("secbuttonactive");
        document.getElementById("coordinatePointBtn").disabled = true;//Alison edited
      },
      //end Alison added

      _submitToGPService: function () {

        console.log('sending values to GP Service');

        LineData = [];
        PointData = [];
        document.getElementById("downloadData").disabled = true;
        document.getElementById("debugMessages").innerHTML = "";
        document.getElementById("messages").style.display = "none";


        // Just getting values from the input sections
        var controlSectionValue = this.controlSectionNode.value;

        var lrsValue = this.LRSInputNode.value;

        var lrsBeginLogMile = this.beginLogMileNode.value;

        var lrsEndLogMile = this.endLogMileNode.value;

        var routesValue = this.RoutesInputNode.value;

        //account for spaces and replace with %20
        routesValue = routesValue.replace(" ", "%20");

        var beginMeasureValue = this.beginMeasureInputNode.value;

        var endMeasureValue = this.endMeasureInputNode.value;

        var startPointValueX = this.startXInputNode.value;

        var startPointValueY = this.startYInputNode.value;

        var endPointValueX = this.endXInputNode.value;

        var endPointValueY = this.endYInputNode.value;

        var toleranceValue = this.toleranceAmount.value;

        //Alison added:
        var coordinatePointValueX = this.coordinateXInputNode.value;
        var coordinatePointValueY = this.coordinateYInputNode.value;

        // Create Characteristics Params
        var characteristicParams = "Characteristic=";
        var characterParamCheck = false;

        if (this.characteristics_NHS.checked == true) {
          characteristicParams += 'NHS';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Number_Of_Lanes.checked == true) {
          characteristicParams += 'NumberOfLanes';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Outside_Shoulder_Info.checked == true) {
          characteristicParams += 'OutsideShoulderInfo';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Surface_Type.checked == true) {
          characteristicParams += 'SurfaceType';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Federal_Aid.checked == true) {
          characteristicParams += 'FederalAid';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Functional_System.checked == true) {
          characteristicParams += 'FunctionalSystem';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Lane_Width.checked == true) {
          characteristicParams += 'LaneWidth';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_STRAHNET.checked == true) {
          characteristicParams += 'STRAHNET';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Truck_Route.checked == true) {
          characteristicParams += 'TruckRoute';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Urban_Area.checked == true) {
          characteristicParams += 'UrbanArea';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Access_Control.checked == true) {
          characteristicParams += 'AccessControl';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Median.checked == true) {
          characteristicParams += 'Median';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_Right_Size.checked == true) {
          characteristicParams += 'RightSize';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (this.characteristics_AADT.checked == true) {
          characteristicParams += 'AADT';
          characteristicParams += '%20';
          characterParamCheck = true;
        }

        if (characterParamCheck == false) {
          characteristicParams = "";
        }

        // Create Geoprocessor to connect to FME
        var gp = new Geoprocessor(gpUrl);

        // Check which radio button has been selected and only send in the relevant values to the GP Service
        if (this.selectedSection == "Control Section") {
          console.log("control section selected");

          var params = {
            "queryMethod_Value": this.selectedSection,
            "Control_Section": controlSectionValue,
            "NHS_Boolean": this.characteristics_NHS.checked,
            "Number_of_Lanes_Boolean": this.characteristics_Number_Of_Lanes.checked,
            "Outside_Shoulder_Info_Boolean": this.characteristics_Outside_Shoulder_Info.checked,
            "Surface_Type_Boolean": this.characteristics_Surface_Type.checked,
            "Federal_Aid_Boolean": this.characteristics_Federal_Aid.checked,
            "Functional_System_Boolean": this.characteristics_Functional_System.checked,
            "Lane_Width_Boolean": this.characteristics_Lane_Width.checked,
            "STRAHNET_Boolean": this.characteristics_STRAHNET.checked,
            "Truck_Route_Boolean": this.characteristics_Truck_Route.checked,
            "Urban_Area_Boolean": this.characteristics_Urban_Area.checked,
            "Access_Control_Boolean": this.characteristics_Access_Control.checked,
            "Median_Boolean": this.characteristics_Median.checked,
            "Right_Size_Boolean": this.characteristics_Right_Size.checked,
            "AADT": this.characteristics_AADT.checked
          };

        } else if (this.selectedSection == "LRSID Section") { // if LRS radio is checked
          var params = {
            "queryMethod_Value": this.selectedSection,
            "LRS_ID": lrsValue,
            "Begin_Log_Mile": lrsBeginLogMile,
            "End_Log_Mile": lrsEndLogMile,
            "NHS_Boolean": this.characteristics_NHS.checked,
            "Number_of_Lanes_Boolean": this.characteristics_Number_Of_Lanes.checked,
            "Outside_Shoulder_Info_Boolean": this.characteristics_Outside_Shoulder_Info.checked,
            "Surface_Type_Boolean": this.characteristics_Surface_Type.checked,
            "Federal_Aid_Boolean": this.characteristics_Federal_Aid.checked,
            "Functional_System_Boolean": this.characteristics_Functional_System.checked,
            "Lane_Width_Boolean": this.characteristics_Lane_Width.checked,
            "STRAHNET_Boolean": this.characteristics_STRAHNET.checked,
            "Truck_Route_Boolean": this.characteristics_Truck_Route.checked,
            "Urban_Area_Boolean": this.characteristics_Urban_Area.checked,
            "Access_Control_Boolean": this.characteristics_Access_Control.checked,
            "Median_Boolean": this.characteristics_Median.checked,
            "Right_Size_Boolean": this.characteristics_Right_Size.checked,
            "AADT": this.characteristics_AADT.checked
          };
        } else if (this.selectedSection == "RouteID Section") { // if routes radio is checked
          var params = {
            "queryMethod_Value": this.selectedSection,
            "Routes": routesValue,
            "Begin_Measure": beginMeasureValue,
            "End_Measure": endMeasureValue,
            "NHS_Boolean": this.characteristics_NHS.checked,
            "Number_of_Lanes_Boolean": this.characteristics_Number_Of_Lanes.checked,
            "Outside_Shoulder_Info_Boolean": this.characteristics_Outside_Shoulder_Info.checked,
            "Surface_Type_Boolean": this.characteristics_Surface_Type.checked,
            "Federal_Aid_Boolean": this.characteristics_Federal_Aid.checked,
            "Functional_System_Boolean": this.characteristics_Functional_System.checked,
            "Lane_Width_Boolean": this.characteristics_Lane_Width.checked,
            "STRAHNET_Boolean": this.characteristics_STRAHNET.checked,
            "Truck_Route_Boolean": this.characteristics_Truck_Route.checked,
            "Urban_Area_Boolean": this.characteristics_Urban_Area.checked,
            "Access_Control_Boolean": this.characteristics_Access_Control.checked,
            "Median_Boolean": this.characteristics_Median.checked,
            "Right_Size_Boolean": this.characteristics_Right_Size.checked,
            "AADT": this.characteristics_AADT.checked
          };
        } if (this.selectedSection == "XY Section") { // if XY Section is checked - Using the default values for input Spatial Ref and Tolerance for now
          var params = {
            "queryMethod_Value": this.selectedSection,
            "Start_Point_X": startPointValueX,
            "Start_Point_Y": startPointValueY,
            "End_Point_X": endPointValueX,
            "End_Point_Y": endPointValueY,
            "Tolerance_Value": toleranceValue,
            "NHS_Boolean": this.characteristics_NHS.checked,
            "Number_of_Lanes_Boolean": this.characteristics_Number_Of_Lanes.checked,
            "Outside_Shoulder_Info_Boolean": this.characteristics_Outside_Shoulder_Info.checked,
            "Surface_Type_Boolean": this.characteristics_Surface_Type.checked,
            "Federal_Aid_Boolean": this.characteristics_Federal_Aid.checked,
            "Functional_System_Boolean": this.characteristics_Functional_System.checked,
            "Lane_Width_Boolean": this.characteristics_Lane_Width.checked,
            "STRAHNET_Boolean": this.characteristics_STRAHNET.checked,
            "Truck_Route_Boolean": this.characteristics_Truck_Route.checked,
            "Urban_Area_Boolean": this.characteristics_Urban_Area.checked,
            "Access_Control_Boolean": this.characteristics_Access_Control.checked,
            "Median_Boolean": this.characteristics_Median.checked,
            "Right_Size_Boolean": this.characteristics_Right_Size.checked,
            "AADT": this.characteristics_AADT.checked
          };
        }
        if (this.selectedSection == "Coordinate") { // if Coordinate is checked - Using the default values for input Spatial Ref and Tolerance for now
          var params = {
            "queryMethod_Value": this.selectedSection, //
            "Point_X": coordinatePointValueX,
            "Point_Y": coordinatePointValueY,
            "Tolerance_Value": toleranceValue,
            "NHS_Boolean": this.characteristics_NHS.checked,
            "Number_of_Lanes_Boolean": this.characteristics_Number_Of_Lanes.checked,
            "Outside_Shoulder_Info_Boolean": this.characteristics_Outside_Shoulder_Info.checked,
            "Surface_Type_Boolean": this.characteristics_Surface_Type.checked,
            "Federal_Aid_Boolean": this.characteristics_Federal_Aid.checked,
            "Functional_System_Boolean": this.characteristics_Functional_System.checked,
            "Lane_Width_Boolean": this.characteristics_Lane_Width.checked,
            "STRAHNET_Boolean": this.characteristics_STRAHNET.checked,
            "Truck_Route_Boolean": this.characteristics_Truck_Route.checked,
            "Urban_Area_Boolean": this.characteristics_Urban_Area.checked,
            "Access_Control_Boolean": this.characteristics_Access_Control.checked,
            "Median_Boolean": this.characteristics_Median.checked,
            "Right_Size_Boolean": this.characteristics_Right_Size.checked,
            "AADT": this.characteristics_AADT.checked
          };
        }


        console.log('params: ', params);

        // show the progress indicator
        this.busyIndicator.show();

        gp.submitJob(params, lang.hitch(this, function (jobResults) {

          console.log('gpResults: ', jobResults);

          if (jobResults.jobStatus == "esriJobFailed") {
            for (var m = 0; m < jobResults.messages.length; m++) {
              if (jobResults.messages[m].type == "esriJobMessageTypeError" && jobResults.messages[m].type == "esriJobMessageTypeWarning") {
                console.log(jobResults.messages[m].description);
                document.getElementById('debugMessages').innerHTML += jobResults.messages[m].description + "\n";
              }
            }
            this.busyIndicator.hide();
            var messages = document.getElementById("messages");
            messages.style.display = 'block';
            return;
          } else {

            //Alison added:
            //TODO: HOW DO WE MAKE THIS HANDLE points INSTEAD OF lines???!!!??
            console.log("getting data");
            gp.getResultData(jobResults.jobId, "Output_Polyline", lang.hitch(this, this.displayGPPolylineResults));

            // hide the progress indicator
            this.busyIndicator.hide();
          }

        }), null, lang.hitch(this, function (errorResults) {
          alert('Error occurred when trying to run widget!');
          console.log(errorResults);

          // hide the progress indicator
          this.busyIndicator.hide();
        })
        );

      },

      //Alison added:
      //TODO: HOW DO WE MAKE THIS HANDLE points INSTEAD OF lines???!!!??
      //end Alison addition

      // This adds features to a temporary featureLayer on the map.
      displayGPPolylineResults: function (result, messages) {

        //Alison added:
        //Need a conditional here that evaluates whether the result is poly or point.  Not sure how to do that...
        //maybe result.value.features[0].feature.geometry.type ==  point ### | multipoint | polyline | polygon | extent
        //https://developers.arcgis.com/javascript/3/jsapi/polygon-amd.html#type

        console.log('displayGPPolylineResults -- result, messages');
        console.log(result, messages);
        if (result.value.features[0].feature.geometry.type == "point") { //Alison added
          //Alison added:
          // remove any existing graphics if present
          var oldPointGraphicsArray = [];
          for (var l = 0; l < this.outputPointFeatureLayer.graphics.length; l++) {
            var tempGraphic = this.outputPointFeatureLayer.graphics[l];
            oldPointGraphicsArray.push(tempGraphic);
          }

          if (oldPointGraphicsArray) {
            this.outputPointFeatureLayer.applyEdits(null, null, oldPointGraphicsArray);
          }

          // Will be used to define map zoom extent
          var pointGraphicsArray = [];

          var simplePointSymbol = new SimpleMarkerSymbol({
            "color": [0, 0, 255, 50],
            "size": 12,
            "angle": -30,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "outline": {
              "color": [255, 255, 255, 20],
              "width": 1.5,
              "type": "esriSLS",
              "style": "esriSLSSolid"
            }
          });


          var features = result.value.features;
          var inputPoints = [];
          for (f = 0; f < features.length; f++) {
            var feature = features[f];
            var inputPoint = new Point(feature.geometry);
            inputPoint.push(inputPoint);
            PointData.push(features[f].attributes);
          }
        }
        else {
          // remove any existing graphics if present
          var oldPolylineGraphicsArray = [];
          for (var l = 0; l < this.outputPolylineFeatureLayer.graphics.length; l++) {
            var tempGraphic = this.outputPolylineFeatureLayer.graphics[l];
            oldPolylineGraphicsArray.push(tempGraphic);
          }

          if (oldPolylineGraphicsArray) {
            this.outputPolylineFeatureLayer.applyEdits(null, null, oldPolylineGraphicsArray);
          }

          // Will be used to define map zoom extent
          var lineGraphicsArray = [];

          var simpleLineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([26, 255, 5]), 3);

          var features = result.value.features;
          var inputLines = [];
          for (f = 0; f < features.length; f++) {
            var feature = features[f];
            var inputLine = new Polyline(feature.geometry);
            inputLines.push(inputLine);
            LineData.push(features[f].attributes);
          }
        }

        // creating graphic with JSON
        var outSpatRef = new SpatialReference(3857);
        var geometryService = new esri.tasks.GeometryService("https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer");
        var PrjParams = new ProjectParameters();


        if (!projection.isSupported()) {
          PrjParams.geometries = inputLines;
          PrjParams.outSR = outSpatRef;
          geometryService.project(PrjParams, function (response) {
            for (f = 0; f < features.length; f++) {
              var graphic = new Graphic();
              if (features[f].type == "point")//Alison added
                graphic.geometry = new Point(response[f]);//Alison added
              else {//Alison added
                graphic.geometry = new Polyline(response[f]);
              }
              var infoTemplate = new InfoTemplate();
              var content = "<table cellpadding='3'>";
              if (!!features[f].attributes.FID) {
                if (features[f].attributes.FID.length > 0 && features[f].attributes.FID != '') {
                  content += '<tr><td width="40%"><b>FID:</b></td><td>' + features[f].attributes.FID + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RouteID) {
                if (features[f].attributes.RouteID.length > 0 && features[f].attributes.RouteID.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>RouteID:</b></td><td>' + features[f].attributes.RouteID + '</td></tr>';
                }
              }
              if (!!features[f].attributes.FromMeasur) {
                if (features[f].attributes.FromMeasur.length > 0 && features[f].attributes.FromMeasur.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>From Measure:</b></td><td>' + features[f].attributes.FromMeasur + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ToMeasure) {
                if (features[f].attributes.ToMeasure.length > 0 && features[f].attributes.ToMeasure.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>To Measure:</b></td><td>' + features[f].attributes.ToMeasure + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Measure) {
                if (features[f].attributes.Measure.length > 0 && features[f].attributes.Measure.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Measure:</b></td><td>' + features[f].attributes.Measure + '</td></tr>';
                }
              }

              if (!!features[f].attributes.RouteName) {
                if (features[f].attributes.RouteName.length > 0 && features[f].attributes.RouteName.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Route Name:</b></td><td>' + features[f].attributes.RouteName + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RouteTrave) {
                if (features[f].attributes.RouteTrave.length > 0 && features[f].attributes.RouteTrave.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Route Travel Direction:</b></td><td>' + features[f].attributes.RouteTrave + '</td></tr>';
                }
              }
              if (!!features[f].attributes.SegmentLen) {
                if (features[f].attributes.SegmentLen.length > 0 && features[f].attributes.SegmentLen.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Segment Length By Measure:</b></td><td>' + features[f].attributes.SegmentLen + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LRSID) {
                if (features[f].attributes.LRSID.length > 0 && features[f].attributes.LRSID.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>LRSID:</b></td><td>' + features[f].attributes.LRSID + '</td></tr>';
                }
              }
              if (!!features[f].attributes.BeginLogMi) {
                if (features[f].attributes.BeginLogMi.length > 0 && features[f].attributes.BeginLogMi.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Begin Log Mile:</b></td><td>' + features[f].attributes.BeginLogMi + '</td></tr>';
                }
              }
              if (!!features[f].attributes.EndLogMile) {
                if (features[f].attributes.EndLogMile.length > 0 && features[f].attributes.EndLogMile.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>End Log Mile:</b></td><td>' + features[f].attributes.EndLogMile + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ControlSec) {
                if (features[f].attributes.ControlSec.length > 0 && features[f].attributes.ControlSec.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Control Section:</b></td><td>' + features[f].attributes.ControlSec + '</td></tr>';
                }
              }
              if (!!features[f].attributes.DOTD_Distr) {
                if (features[f].attributes.DOTD_Distr.length > 0 && features[f].attributes.DOTD_Distr.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>LaDOTD District Name:</b></td><td>' + features[f].attributes.DOTD_Distr + '</td></tr>';
                }
              }
              if (!!features[f].attributes.DOTD_Dis_1) {
                if (features[f].attributes.DOTD_Dis_1.length > 0 && features[f].attributes.DOTD_Dis_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>LaDOTD District Number:</b></td><td>' + features[f].attributes.DOTD_Dis_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ParishName) {
                if (features[f].attributes.ParishName.length > 0 && features[f].attributes.ParishName.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Parish Name:</b></td><td>' + features[f].attributes.ParishName + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ParishNumb) {
                if (features[f].attributes.ParishNumb.length > 0 && features[f].attributes.ParishNumb.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Parish Number:</b></td><td>' + features[f].attributes.ParishNumb + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ParishFIPS) {
                if (features[f].attributes.ParishFIPS.length > 0 && features[f].attributes.ParishFIPS.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Parish FIPS:</b></td><td>' + features[f].attributes.ParishFIPS + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Metropolit) {
                if (features[f].attributes.Metropolit.length > 0 && features[f].attributes.Metropolit.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Metropolitan Area Name:</b></td><td>' + features[f].attributes.Metropolit + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Metropol_1) {
                if (features[f].attributes.Metropol_1.length > 0 && features[f].attributes.Metropol_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Metropolitan Area FIPS:</b></td><td>' + features[f].attributes.Metropol_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UrbanAreaN) {
                if (features[f].attributes.UrbanAreaN.length > 0 && features[f].attributes.UrbanAreaN.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Urban Area Name:</b></td><td>' + features[f].attributes.UrbanAreaN + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UrbanAreaF) {
                if (features[f].attributes.UrbanAreaF.length > 0 && features[f].attributes.UrbanAreaF.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Urban Area FIPS:</b></td><td>' + features[f].attributes.UrbanAreaF + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Incorporat) {
                if (features[f].attributes.Incorporat.length > 0 && features[f].attributes.Incorporat.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Incorporated Area Name:</b></td><td>' + features[f].attributes.Incorporat + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Incorpor_1) {
                if (features[f].attributes.Incorpor_1.length > 0 && features[f].attributes.Incorpor_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Incorporated Area FIPS:</b></td><td>' + features[f].attributes.Incorpor_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.iVisionURL) {
                if (features[f].attributes.iVisionURL.length > 0 && features[f].attributes.iVisionURL.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>iVision URL:</b></td><td><a href="' + features[f].attributes.iVisionURL + 'target="_blank" > iVision</a ></td ></tr > ';
                }
              }
              if (!!features[f].attributes.AADT) {
                if (features[f].attributes.AADT.length > 0 && features[f].attributes.AADT.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>AADT:</b></td><td>' + features[f].attributes.AADT + '</td></tr>';
                }
              }
              if (!!features[f].attributes.AccessCont) {
                if (features[f].attributes.AccessCont.length > 0 && features[f].attributes.AccessCont.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Access Control Code:</b></td><td>' + features[f].attributes.AccessCont + '</td></tr>';
                }
              }
              if (!!features[f].attributes.AccessCo_1) {
                if (features[f].attributes.AccessCo_1.length > 0 && features[f].attributes.AccessCo_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Access Control Description:</b></td><td>' + features[f].attributes.AccessCo_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.FederalAid) {
                if (features[f].attributes.FederalAid.length > 0 && features[f].attributes.FederalAid.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Federal Aid Status Code:</b></td><td>' + features[f].attributes.FederalAid + '</td></tr>';
                }
              }
              if (!!features[f].attributes.FedAidStat) {
                if (features[f].attributes.FedAidStat.length > 0 && features[f].attributes.FedAidStat.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Federal Aid Status Description:</b></td><td>' + features[f].attributes.FedAidStat + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Functional) {
                if (features[f].attributes.Functional.length > 0 && features[f].attributes.Functional.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Code:</b></td><td>' + features[f].attributes.Functional + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_1) {
                if (features[f].attributes.Function_1.length > 0 && features[f].attributes.Function_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Description:</b></td><td>' + features[f].attributes.Function_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_2) {
                if (features[f].attributes.Function_2.length > 0 && features[f].attributes.Function_2.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Urban Area Code:</b></td><td>' + features[f].attributes.Function_2 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_3) {
                if (features[f].attributes.Function_3.length > 0 && features[f].attributes.Function_3.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Urban Area:</b></td><td>' + features[f].attributes.Function_3 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_4) {
                if (features[f].attributes.Function_4.length > 0 && features[f].attributes.Function_4.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Urban/Rural:</b></td><td>' + features[f].attributes.Function_4 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.MedianType) {
                if (features[f].attributes.MedianType.length > 0 && features[f].attributes.MedianType.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Median Type Code:</b></td><td>' + features[f].attributes.MedianType + '</td></tr>';
                }
              }
              if (!!features[f].attributes.MedianTy_1) {
                if (features[f].attributes.MedianTy_1.length > 0 && features[f].attributes.MedianTy_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Median Type:</b></td><td>' + features[f].attributes.MedianTy_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.MedianWidt) {
                if (features[f].attributes.MedianWidt.length > 0 && features[f].attributes.MedianWidt.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Median Width (FT):</b></td><td>' + features[f].attributes.MedianWidt + '</td></tr>';
                }
              }
              if (!!features[f].attributes.NHSCode) {
                if (features[f].attributes.NHSCode.length > 0 && features[f].attributes.NHSCode.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>NHS Code:</b></td><td>' + features[f].attributes.NHSCode + '</td></tr>';
                }
              }
              if (!!features[f].attributes.NHSDesc) {
                if (features[f].attributes.NHSDesc.length > 0 && features[f].attributes.NHSDesc.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>NHS Description:</b></td><td>' + features[f].attributes.NHSDesc + '</td></tr>';
                }
              }
              if (!!features[f].attributes.NumberOfLa) {
                if (features[f].attributes.NumberOfLa.length > 0 && features[f].attributes.NumberOfLa.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Number of Lanes:</b></td><td>' + features[f].attributes.NumberOfLa + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LaneWidthF) {
                if (features[f].attributes.LaneWidthF.length > 0 && features[f].attributes.LaneWidthF.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Lane Width (FT):</b></td><td>' + features[f].attributes.LaneWidthF + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RightSize_) {
                if (features[f].attributes.RightSize_.length > 0 && features[f].attributes.RightSize_.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Right Size Type:</b></td><td>' + features[f].attributes.RightSize_ + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RightSize1) {
                if (features[f].attributes.RightSize1.length > 0 && features[f].attributes.RightSize1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Right Size Description:</b></td><td>' + features[f].attributes.RightSize1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.SurfaceTyp) {
                if (features[f].attributes.SurfaceTyp.length > 0 && features[f].attributes.SurfaceTyp.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Surface Type Code:</b></td><td>' + features[f].attributes.SurfaceTyp + '</td></tr>';
                }
              }
              if (!!features[f].attributes.SurfaceT_1) {
                if (features[f].attributes.SurfaceT_1.length > 0 && features[f].attributes.SurfaceT_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Surface Type Description:</b></td><td>' + features[f].attributes.SurfaceT_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ShoulderTy) {
                if (features[f].attributes.ShoulderTy.length > 0 && features[f].attributes.ShoulderTy.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Primary Code:</b></td><td>' + features[f].attributes.ShoulderTy + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_1) {
                if (features[f].attributes.Shoulder_1.length > 0 && features[f].attributes.Shoulder_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Primary Description:</b></td><td>' + features[f].attributes.Shoulder_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ShoulderWi) {
                if (features[f].attributes.ShoulderWi.length > 0 && features[f].attributes.ShoulderWi.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Primary Width (FT):</b></td><td>' + features[f].attributes.ShoulderWi + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_2) {
                if (features[f].attributes.Shoulder_2.length > 0 && features[f].attributes.Shoulder_2.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Secondary Code:</b></td><td>' + features[f].attributes.Shoulder_2 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_3) {
                if (features[f].attributes.Shoulder_3.length > 0 && features[f].attributes.Shoulder_3.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Secondary Description:</b></td><td>' + features[f].attributes.Shoulder_3 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_4) {
                if (features[f].attributes.Shoulder_4.length > 0 && features[f].attributes.Shoulder_4.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Secondary Width (FT):</b></td><td>' + features[f].attributes.Shoulder_4 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.STRAHNETCo) {
                if (features[f].attributes.STRAHNETCo.length > 0 && features[f].attributes.STRAHNETCo.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>STRAHNET Code:</b></td><td>' + features[f].attributes.STRAHNETCo + '</td></tr>';
                }
              }
              if (!!features[f].attributes.STRAHNETDe) {
                if (features[f].attributes.STRAHNETDe.length > 0 && features[f].attributes.STRAHNETDe.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>STRAHNET Description:</b></td><td>' + features[f].attributes.STRAHNETDe + '</td></tr>';
                }
              }
              if (!!features[f].attributes.TruckCode) {
                if (features[f].attributes.TruckCode.length > 0 && features[f].attributes.TruckCode.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Truck Route Code:</b></td><td>' + features[f].attributes.TruckCode + '</td></tr>';
                }
              }
              if (!!features[f].attributes.TruckDesc) {
                if (features[f].attributes.TruckDesc.length > 0 && features[f].attributes.TruckDesc.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Truck Route Description:</b></td><td>' + features[f].attributes.TruckDesc + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMXEnd_NA) {
                if (features[f].attributes.UTMXEnd_NA.length > 0 && features[f].attributes.UTMXEnd_NA.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM X End (NAD83-15N):</b></td><td>' + features[f].attributes.UTMXEnd_NA + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMYEnd_NA) {
                if (features[f].attributes.UTMYEnd_NA.length > 0 && features[f].attributes.UTMYEnd_NA.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM Y End (NAD83-15N):</b></td><td>' + features[f].attributes.UTMYEnd_NA + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMXStart_) {
                if (features[f].attributes.UTMXStart_.length > 0 && features[f].attributes.UTMXStart_.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM X Start (NAD83-15N):</b></td><td>' + features[f].attributes.UTMXStart_ + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMYStart_) {
                if (features[f].attributes.UTMYStart_.length > 0 && features[f].attributes.UTMYStart_.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM Y Start (NAD83-15N):</b></td><td>' + features[f].attributes.UTMYStart_ + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LatitudeEn) {
                if (features[f].attributes.LatitudeEn.length > 0 && features[f].attributes.LatitudeEn.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Latitude End (NAD83):</b></td><td>' + features[f].attributes.LatitudeEn + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LongitudeE) {
                if (features[f].attributes.LongitudeE.length > 0 && features[f].attributes.LongitudeE.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Longitude End (NAD83):</b></td><td>' + features[f].attributes.LongitudeE + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LatitudeSt) {
                if (features[f].attributes.LatitudeSt.length > 0 && features[f].attributes.LatitudeSt.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Latitude Start (NAD83):</b></td><td>' + features[f].attributes.LatitudeSt + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LongitudeS) {
                if (features[f].attributes.LongitudeS.length > 0 && features[f].attributes.LongitudeS.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Longitude Start (NAD83):</b></td><td>' + features[f].attributes.LongitudeS + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shape_Leng) {
                if (features[f].attributes.Shape_Leng.length > 0 && features[f].attributes.Shape_Leng != '') {
                  content += '<tr><td width="40%"><b>Shape Length:</b></td><td>' + features[f].attributes.Shape_Leng + '</td></tr>';
                }
              }
              if (!!features[f].attributes.OBJECTID) {
                if (features[f].attributes.OBJECTID.length > 0 && features[f].attributes.OBJECTID != '') {
                  content += '<tr><td width="40%"><b>Object ID:</b></td><td>' + features[f].attributes.OBJECTID + '</td></tr>';
                }
              }
              infoTemplate.setTitle("Route Polyline");
              infoTemplate.setContent(content);
              graphic.infoTemplate = infoTemplate;
              graphic.attributes = features[f].attributes;
              if (features[f].type == "point") {//Alison added
                graphic.symbol = simplePointSymbol;//Alison added
                pointGraphicsArray.push(graphic);//Alison added
              }
              else {//Alison added
                graphic.symbol = simpleLineSymbol;
                lineGraphicsArray.push(graphic);
              }
            }

            setTimeout(function () {
              if (features[f].type == "point") {//Alison added
                this._widgetManager.activeWidget.outputPointFeatureLayer.applyEdits(pointGraphicsArray, null, null, lang.hitch(this, function () {

                  // Zoom to the extent of the routes graphics
                  var graphicsExtent = graphicsUtils.graphicsExtent(pointGraphicsArray);
                  this._widgetManager.map.setExtent(graphicsExtent, true);
                  this._widgetManager.activeWidget.outputPointFeatureLayer.fullExtent = graphicsExtent;

                  this._widgetManager.activeWidget.outputPointFeatureLayer.visible = true;
                }), function (err) {
                  console.error('ERROR ...', err);
                });
                console.log("Points Edited");
              }
              else {
                this._widgetManager.activeWidget.outputPolylineFeatureLayer.applyEdits(lineGraphicsArray, null, null, lang.hitch(this, function () {

                  // Zoom to the extent of the routes graphics
                  var graphicsExtent = graphicsUtils.graphicsExtent(lineGraphicsArray);
                  this._widgetManager.map.setExtent(graphicsExtent, true);
                  this._widgetManager.activeWidget.outputPolylineFeatureLayer.fullExtent = graphicsExtent;

                  this._widgetManager.activeWidget.outputPolylineFeatureLayer.visible = true;
                }), function (err) {
                  console.error('ERROR ...', err);
                });
                console.log("Lines Edited");
              }
            }, 2000);

          });
        } else {
          for (f = 0; f < features.length; f++) {
            const projectionPromise = projection.load();
            projectionPromise.then(function () {
              var projGeom = projection.project(features[f].geometry, outSpatRef);
              var graphic = new Graphic();
              var infoTemplate = new InfoTemplate();
              var content = "<table cellpadding='3'>";
              if (features[f].attributes.FID) {
                if (features[f].attributes.FID.length > 0 && features[f].attributes.FID != '') {
                  content += '<tr><td width="40%"><b>FID:</b></td><td>' + features[f].attributes.FID + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RouteID) {
                if (features[f].attributes.RouteID.length > 0 && features[f].attributes.RouteID.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>RouteID:</b></td><td>' + features[f].attributes.RouteID + '</td></tr>';
                }
              }
              if (!!features[f].attributes.FromMeasur) {
                if (features[f].attributes.FromMeasur.length > 0 && features[f].attributes.FromMeasur.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>From Measure:</b></td><td>' + features[f].attributes.FromMeasur + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ToMeasure) {
                if (features[f].attributes.ToMeasure.length > 0 && features[f].attributes.ToMeasure.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>To Measure:</b></td><td>' + features[f].attributes.ToMeasure + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RouteName) {
                if (features[f].attributes.RouteName.length > 0 && features[f].attributes.RouteName.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Route Name:</b></td><td>' + features[f].attributes.RouteName + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RouteTrave) {
                if (features[f].attributes.RouteTrave.length > 0 && features[f].attributes.RouteTrave.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Route Travel Direction:</b></td><td>' + features[f].attributes.RouteTrave + '</td></tr>';
                }
              }
              if (!!features[f].attributes.SegmentLen) {
                if (features[f].attributes.SegmentLen.length > 0 && features[f].attributes.SegmentLen.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Segment Length By Measure:</b></td><td>' + features[f].attributes.SegmentLen + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LRSID) {
                if (features[f].attributes.LRSID.length > 0 && features[f].attributes.LRSID.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>LRSID:</b></td><td>' + features[f].attributes.LRSID + '</td></tr>';
                }
              }
              if (!!features[f].attributes.BeginLogMi) {
                if (features[f].attributes.BeginLogMi.length > 0 && features[f].attributes.BeginLogMi.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Begin Log Mile:</b></td><td>' + features[f].attributes.BeginLogMi + '</td></tr>';
                }
              }
              if (!!features[f].attributes.EndLogMile) {
                if (features[f].attributes.EndLogMile.length > 0 && features[f].attributes.EndLogMile.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>End Log Mile:</b></td><td>' + features[f].attributes.EndLogMile + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ControlSec) {
                if (features[f].attributes.ControlSec.length > 0 && features[f].attributes.ControlSec.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Control Section:</b></td><td>' + features[f].attributes.ControlSec + '</td></tr>';
                }
              }
              if (!!features[f].attributes.DOTD_Distr) {
                if (features[f].attributes.DOTD_Distr.length > 0 && features[f].attributes.DOTD_Distr.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>LaDOTD District Name:</b></td><td>' + features[f].attributes.DOTD_Distr + '</td></tr>';
                }
              }
              if (!!features[f].attributes.DOTD_Dis_1) {
                if (features[f].attributes.DOTD_Dis_1.length > 0 && features[f].attributes.DOTD_Dis_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>LaDOTD District Number:</b></td><td>' + features[f].attributes.DOTD_Dis_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ParishName) {
                if (features[f].attributes.ParishName.length > 0 && features[f].attributes.ParishName.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Parish Name:</b></td><td>' + features[f].attributes.ParishName + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ParishNumb) {
                if (features[f].attributes.ParishNumb.length > 0 && features[f].attributes.ParishNumb.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Parish Number:</b></td><td>' + features[f].attributes.ParishNumb + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ParishFIPS) {
                if (features[f].attributes.ParishFIPS.length > 0 && features[f].attributes.ParishFIPS.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Parish FIPS:</b></td><td>' + features[f].attributes.ParishFIPS + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Metropolit) {
                if (features[f].attributes.Metropolit.length > 0 && features[f].attributes.Metropolit.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Metropolitan Area Name:</b></td><td>' + features[f].attributes.Metropolit + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Metropol_1) {
                if (features[f].attributes.Metropol_1.length > 0 && features[f].attributes.Metropol_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Metropolitan Area FIPS:</b></td><td>' + features[f].attributes.Metropol_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UrbanAreaN) {
                if (features[f].attributes.UrbanAreaN.length > 0 && features[f].attributes.UrbanAreaN.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Urban Area Name:</b></td><td>' + features[f].attributes.UrbanAreaN + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UrbanAreaF) {
                if (features[f].attributes.UrbanAreaF.length > 0 && features[f].attributes.UrbanAreaF.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Urban Area FIPS:</b></td><td>' + features[f].attributes.UrbanAreaF + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Incorporat) {
                if (features[f].attributes.Incorporat.length > 0 && features[f].attributes.Incorporat.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Incorporated Area Name:</b></td><td>' + features[f].attributes.Incorporat + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Incorpor_1) {
                if (features[f].attributes.Incorpor_1.length > 0 && features[f].attributes.Incorpor_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Incorporated Area FIPS:</b></td><td>' + features[f].attributes.Incorpor_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.iVisionURL) {
                if (features[f].attributes.iVisionURL.length > 0 && features[f].attributes.iVisionURL.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>iVision URL:</b></td><td><a href="' + features[f].attributes.iVisionURL + 'target="_blank" > iVision</a ></td ></tr > ';
                }
              }
              if (!!features[f].attributes.AADT) {
                if (features[f].attributes.AADT.length > 0 && features[f].attributes.AADT.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>AADT:</b></td><td>' + features[f].attributes.AADT + '</td></tr>';
                }
              }
              if (!!features[f].attributes.AccessCont) {
                if (features[f].attributes.AccessCont.length > 0 && features[f].attributes.AccessCont.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Access Control Code:</b></td><td>' + features[f].attributes.AccessCont + '</td></tr>';
                }
              }
              if (!!features[f].attributes.AccessCo_1) {
                if (features[f].attributes.AccessCo_1.length > 0 && features[f].attributes.AccessCo_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Access Control Description:</b></td><td>' + features[f].attributes.AccessCo_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.FederalAid) {
                if (features[f].attributes.FederalAid.length > 0 && features[f].attributes.FederalAid.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Federal Aid Status Code:</b></td><td>' + features[f].attributes.FederalAid + '</td></tr>';
                }
              }
              if (!!features[f].attributes.FedAidStat) {
                if (features[f].attributes.FedAidStat.length > 0 && features[f].attributes.FedAidStat.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Federal Aid Status Description:</b></td><td>' + features[f].attributes.FedAidStat + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Functional) {
                if (features[f].attributes.Functional.length > 0 && features[f].attributes.Functional.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Code:</b></td><td>' + features[f].attributes.Functional + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_1) {
                if (features[f].attributes.Function_1.length > 0 && features[f].attributes.Function_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Description:</b></td><td>' + features[f].attributes.Function_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_2) {
                if (features[f].attributes.Function_2.length > 0 && features[f].attributes.Function_2.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Urban Area Code:</b></td><td>' + features[f].attributes.Function_2 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_3) {
                if (features[f].attributes.Function_3.length > 0 && features[f].attributes.Function_3.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Urban Area:</b></td><td>' + features[f].attributes.Function_3 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Function_4) {
                if (features[f].attributes.Function_4.length > 0 && features[f].attributes.Function_4.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Functional System Urban/Rural:</b></td><td>' + features[f].attributes.Function_4 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.MedianType) {
                if (features[f].attributes.MedianType.length > 0 && features[f].attributes.MedianType.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Median Type Code:</b></td><td>' + features[f].attributes.MedianType + '</td></tr>';
                }
              }
              if (!!features[f].attributes.MedianTy_1) {
                if (features[f].attributes.MedianTy_1.length > 0 && features[f].attributes.MedianTy_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Median Type:</b></td><td>' + features[f].attributes.MedianTy_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.MedianWidt) {
                if (features[f].attributes.MedianWidt.length > 0 && features[f].attributes.MedianWidt.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Median Width (FT):</b></td><td>' + features[f].attributes.MedianWidt + '</td></tr>';
                }
              }
              if (!!features[f].attributes.NHSCode) {
                if (features[f].attributes.NHSCode.length > 0 && features[f].attributes.NHSCode.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>NHS Code:</b></td><td>' + features[f].attributes.NHSCode + '</td></tr>';
                }
              }
              if (!!features[f].attributes.NHSDesc) {
                if (features[f].attributes.NHSDesc.length > 0 && features[f].attributes.NHSDesc.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>NHS Description:</b></td><td>' + features[f].attributes.NHSDesc + '</td></tr>';
                }
              }
              if (!!features[f].attributes.NumberOfLa) {
                if (features[f].attributes.NumberOfLa.length > 0 && features[f].attributes.NumberOfLa.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Number of Lanes:</b></td><td>' + features[f].attributes.NumberOfLa + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LaneWidthF) {
                if (features[f].attributes.LaneWidthF.length > 0 && features[f].attributes.LaneWidthF.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Lane Width (FT):</b></td><td>' + features[f].attributes.LaneWidthF + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RightSize_) {
                if (features[f].attributes.RightSize_.length > 0 && features[f].attributes.RightSize_.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Right Size Type:</b></td><td>' + features[f].attributes.RightSize_ + '</td></tr>';
                }
              }
              if (!!features[f].attributes.RightSize1) {
                if (features[f].attributes.RightSize1.length > 0 && features[f].attributes.RightSize1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Right Size Description:</b></td><td>' + features[f].attributes.RightSize1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.SurfaceTyp) {
                if (features[f].attributes.SurfaceTyp.length > 0 && features[f].attributes.SurfaceTyp.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Surface Type Code:</b></td><td>' + features[f].attributes.SurfaceTyp + '</td></tr>';
                }
              }
              if (!!features[f].attributes.SurfaceT_1) {
                if (features[f].attributes.SurfaceT_1.length > 0 && features[f].attributes.SurfaceT_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Surface Type Description:</b></td><td>' + features[f].attributes.SurfaceT_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ShoulderTy) {
                if (features[f].attributes.ShoulderTy.length > 0 && features[f].attributes.ShoulderTy.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Primary Code:</b></td><td>' + features[f].attributes.ShoulderTy + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_1) {
                if (features[f].attributes.Shoulder_1.length > 0 && features[f].attributes.Shoulder_1.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Primary Description:</b></td><td>' + features[f].attributes.Shoulder_1 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.ShoulderWi) {
                if (features[f].attributes.ShoulderWi.length > 0 && features[f].attributes.ShoulderWi.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Primary Width (FT):</b></td><td>' + features[f].attributes.ShoulderWi + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_2) {
                if (features[f].attributes.Shoulder_2.length > 0 && features[f].attributes.Shoulder_2.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Secondary Code:</b></td><td>' + features[f].attributes.Shoulder_2 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_3) {
                if (features[f].attributes.Shoulder_3.length > 0 && features[f].attributes.Shoulder_3.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Secondary Description:</b></td><td>' + features[f].attributes.Shoulder_3 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shoulder_4) {
                if (features[f].attributes.Shoulder_4.length > 0 && features[f].attributes.Shoulder_4.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Shoulder Outside Secondary Width (FT):</b></td><td>' + features[f].attributes.Shoulder_4 + '</td></tr>';
                }
              }
              if (!!features[f].attributes.STRAHNETCo) {
                if (features[f].attributes.STRAHNETCo.length > 0 && features[f].attributes.STRAHNETCo.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>STRAHNET Code:</b></td><td>' + features[f].attributes.STRAHNETCo + '</td></tr>';
                }
              }
              if (!!features[f].attributes.STRAHNETDe) {
                if (features[f].attributes.STRAHNETDe.length > 0 && features[f].attributes.STRAHNETDe.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>STRAHNET Description:</b></td><td>' + features[f].attributes.STRAHNETDe + '</td></tr>';
                }
              }
              if (!!features[f].attributes.TruckCode) {
                if (features[f].attributes.TruckCode.length > 0 && features[f].attributes.TruckCode.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Truck Route Code:</b></td><td>' + features[f].attributes.TruckCode + '</td></tr>';
                }
              }
              if (!!features[f].attributes.TruckDesc) {
                if (features[f].attributes.TruckDesc.length > 0 && features[f].attributes.TruckDesc.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Truck Route Description:</b></td><td>' + features[f].attributes.TruckDesc + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMXEnd_NA) {
                if (features[f].attributes.UTMXEnd_NA.length > 0 && features[f].attributes.UTMXEnd_NA.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM X End (NAD83-15N):</b></td><td>' + features[f].attributes.UTMXEnd_NA + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMYEnd_NA) {
                if (features[f].attributes.UTMYEnd_NA.length > 0 && features[f].attributes.UTMYEnd_NA.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM Y End (NAD83-15N):</b></td><td>' + features[f].attributes.UTMYEnd_NA + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMXStart_) {
                if (features[f].attributes.UTMXStart_.length > 0 && features[f].attributes.UTMXStart_.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM X Start (NAD83-15N):</b></td><td>' + features[f].attributes.UTMXStart_ + '</td></tr>';
                }
              }
              if (!!features[f].attributes.UTMYStart_) {
                if (features[f].attributes.UTMYStart_.length > 0 && features[f].attributes.UTMYStart_.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>UTM Y Start (NAD83-15N):</b></td><td>' + features[f].attributes.UTMYStart_ + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LatitudeEn) {
                if (features[f].attributes.LatitudeEn.length > 0 && features[f].attributes.LatitudeEn.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Latitude End (NAD83):</b></td><td>' + features[f].attributes.LatitudeEn + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LongitudeE) {
                if (features[f].attributes.LongitudeE.length > 0 && features[f].attributes.LongitudeE.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Longitude End (NAD83):</b></td><td>' + features[f].attributes.LongitudeE + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LatitudeSt) {
                if (features[f].attributes.LatitudeSt.length > 0 && features[f].attributes.LatitudeSt.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Latitude Start (NAD83):</b></td><td>' + features[f].attributes.LatitudeSt + '</td></tr>';
                }
              }
              if (!!features[f].attributes.LongitudeS) {
                if (features[f].attributes.LongitudeS.length > 0 && features[f].attributes.LongitudeS.replace(/\s+/g, '') != '') {
                  content += '<tr><td width="40%"><b>Longitude Start (NAD83):</b></td><td>' + features[f].attributes.LongitudeS + '</td></tr>';
                }
              }
              if (!!features[f].attributes.Shape_Leng) {
                if (features[f].attributes.Shape_Leng.length > 0 && features[f].attributes.Shape_Leng != '') {
                  content += '<tr><td width="40%"><b>Shape Length:</b></td><td>' + features[f].attributes.Shape_Leng + '</td></tr>';
                }
              }
              if (!!features[f].attributes.OBJECTID) {
                if (features[f].attributes.OBJECTID.length > 0 && features[f].attributes.OBJECTID != '') {
                  content += '<tr><td width="40%"><b>Object ID:</b></td><td>' + features[f].attributes.OBJECTID + '</td></tr>';
                }
              }
              content += "</table>";
              infoTemplate.setTitle("Route Polyline");
              infoTemplate.setContent(content);
              graphic.geometry = projGeom;
              graphic.attributes = features[f].attributes;
              if (features[f].type == "point") {//Alison added
                graphic.symbol = simplePointSymbol;//Alison added
                graphic.infoTemplate = infoTemplate;
                pointGraphicsArray.push(graphic);//Alison added
              }
              else {//Alison added
                graphic.symbol = simpleLineSymbol;
                graphic.infoTemplate = infoTemplate;
                lineGraphicsArray.push(graphic);
              }
            });
          }
          this.outputPolylineFeatureLayer.applyEdits(lineGraphicsArray, null, null, lang.hitch(this, function () {

            // Zoom to the extent of the routes graphics
            var graphicsExtent = graphicsUtils.graphicsExtent(lineGraphicsArray);
            this.map.setExtent(graphicsExtent, true);
            this.outputPolylineFeatureLayer.fullExtent = graphicsExtent;

            this.outputPolylineFeatureLayer.visible = true;
          }), function (err) {
            console.error('ERROR ...', err);
          });
          console.log("Lines Edited");

        }

        // clear XY coordinates and graphics
        this.inputStartPointLayer.clear();
        this.inputEndPointLayer.clear();

        this.startXInputNode.value = "";
        this.startYInputNode.value = "";

        this.endXInputNode.value = "";
        this.endYInputNode.value = "";

        resetPointButtons();
        document.getElementById("downloadData").disabled = false;
      }
    });
  });


function checkAll() {
  var state = document.getElementById("characteristics_All").checked;
  var chkBox = document.getElementsByName("characteristics");
  for (var i = 0; i < chkBox.length; i++) {
    chkBox[i].checked = state;
  }
}

function resetPointButtons() {
  document.getElementById("startPointBtn").className += " secbutton";
  document.getElementById("endPointBtn").className += " secbutton";
  document.getElementById("startPointBtn").classList.remove("secbuttonactive");
  document.getElementById("endPointBtn").classList.remove("secbuttonactive");
  document.getElementById("startPointBtn").classList.remove("secbuttondone");
  document.getElementById("endPointBtn").classList.remove("secbuttondone");
}

function downloadCSV() {
  var data;
  var csv = convertArrayOfObjectsToCSV(LineData);
  if (csv == null) return;
  data = encodeURI(csv);
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, "LineRouteData.csv")
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "LineRouteData.csv");
      link.style = "visibility:hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function convertArrayOfObjectsToCSV(data) {
  let csv = '';
  let header = '"' + Object.keys(data[0]).join('","') + '"';
  csv += header + "\n";
  for (i = 0; i < data.length; i++) {
    values = '"' + Object.keys(data[i]).map(function (e) {
      return data[i][e]
    }).join('","') + '"';
    csv += values.split("#").join("%23") + "\n";
  }
  return csv;
}
