#target aftereffects

// Easing Script
// Author: Jerron Smith
// Version: 1.0.0
// Created: 2025-05-13

// ===============================
// Version History
// -------------------------------
// v1.0.0 (2025-05-13): Initial version with renamed functions based on Ease and Wizz 2.0.1

// ===============================
// Features
// -------------------------------
// - Custom UI panel for applying easing expressions
// - Dropdowns for easing type, direction, and keyframe scope
// - Toggle for "Curvaceous" behavior
// - Support for loading external easing expression files
// - Apply or clear expressions to selected properties
// - Compatible with After Effects ExtendScript

var EASING_FOLDER        = 'easingExpressions';
var CLEAR_EXPRESSION_BTN = false;
var easingEquation       = "";
var palette;

var easingList;
var typeList;
var keysList;
var curvaceousCheckbox;

var keysLookup = new Object();
keysLookup['-all'] = 'All';
keysLookup['-startEnd'] = 'Start and end';
keysLookup['-startOnly'] = 'Start only';

var inOutLookup = new Object();
inOutLookup['inOut'] = 'In + Out';
inOutLookup['in'] = 'In';
inOutLookup['out'] = 'Out';

var easingTypesAry = ['Expo', 'Circ', 'Quint', 'Quart', 'Quad', 'Sine', '-', 'Back', 'Bounce', 'Elastic'];

var activeItem;
var selectedProperties;

function getHashValuesCustom(hash) {
	var ary = new Array();
	for (k in hash) ary.push(hash[k]);
	return ary;
}

function getHashKeysCustom(hash) {
	var ary = new Array();
	for (k in hash) ary.push(k);
	return ary;
}

function initCustomScript(thisObj) {
	createCustomPalette(thisObj);
}

function getEasingFolderPath() {
	var folderObj = new Folder((new File($.fileName)).path + "/" + EASING_FOLDER);
	return folderObj;
}

function createCustomPalette(thisObj) {
	var LIST_DIMENSIONS = [0, 0, 120, 15];
	var STATIC_TEXT_DIMENSIONS = [0, 0, 60, 15];

	palette = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Easing", undefined, {resizeable: true});
	palette.margins = 6;
	palette.alignChildren = 'left';

	var winGfx = palette.graphics;
	var darkColorBrush = winGfx.newPen(winGfx.BrushType.SOLID_COLOR, [0,0,0], 1);

	{
		var easingGrp = palette.add('group', undefined, 'Easing group');
		easingGrp.add('statictext', STATIC_TEXT_DIMENSIONS, 'Easing:');
		easingList = easingGrp.add('dropdownlist', LIST_DIMENSIONS, easingTypesAry);
		easingList.helpTip = "Choose the type of easing here. They're arranged";
		easingList.selection = 'expo';
		easingList.graphics.foregroundColor = darkColorBrush;

		var typeGrp = palette.add('group', undefined, 'Type group'); 
		typeGrp.add('statictext', STATIC_TEXT_DIMENSIONS, 'Type:');
		typeList = typeGrp.add('dropdownlist', LIST_DIMENSIONS, getHashValuesCustom(inOutLookup));
		typeList.selection = 'In + Out';
		typeList.graphics.foregroundColor = darkColorBrush;

		var keysGrp = palette.add('group', undefined, 'Keys group');
		keysGrp.add('statictext', STATIC_TEXT_DIMENSIONS, 'Keys:');
		keysList = keysGrp.add('dropdownlist', LIST_DIMENSIONS, getHashValuesCustom(keysLookup));
		keysList.graphics.foregroundColor = darkColorBrush;
		keysList.selection = getHashValuesCustom(keysLookup)[0];
	}

	var curvaceousGrp = palette.add('group', undefined, 'Curvaceous group');
	curvaceousCheckbox = palette.add('checkbox', undefined, 'Curvaceous');
	curvaceousCheckbox.value = false;

	curvaceousCheckbox.onClick = function() {
		if (this.value) {
			easingList.remove("Elastic");
			easingList.remove("Back");
			keysList.remove("Start only");
		} else {
			easingList.add("item", "Elastic");
			easingList.add("item", "Back");
			keysList.add("item", "Start only");
		}
	}

	{
		var buttonGrp = palette.add('group', undefined, 'Button group');
		buttonGrp.orientation = 'row';
		buttonGrp.alignment = 'left';

		if (CLEAR_EXPRESSION_BTN) {
			var clearExpressionsBtn = buttonGrp.add('button', undefined, 'Clear expressions');
			clearExpressionsBtn.onClick = clearAllExpressions;
		}

		var applyBtn = buttonGrp.add('button', undefined, 'Apply');
		applyBtn.onClick = applySelectedEasing;

		var removeBtn = buttonGrp.add('button', undefined, 'Remove');
		removeBtn.onClick = function() {
			var props = app.project.activeItem.selectedProperties;
			for (var i = 0; i < props.length; i++) {
				if (props[i].canSetExpression) props[i].expression = '';
			}
		};
	}

	if (palette instanceof Window) palette.show();
	else palette.layout.layout(true);
}

function debugLog(msg) {
	writeLn(msg);
}

function readEasingFile(filename) {
	var easing_folder = getEasingFolderPath();
	var file_handle = new File(easing_folder.fsName + '/' + filename);

	if (!file_handle.exists) {
		throw("I can't find this file: '" + filename + "'. \n\nI looked in here: '" + easing_folder.fsName + "'. \n\nYou can try reinstalling, or run the script again to choose the easingExpressions folder.");
		return;
	}

	try {
		file_handle.open('r');
		var the_code = file_handle.read();
	} catch(e) {
		throw("I couldn't read the easing equation file: " + e);
		return;
	} finally {
		file_handle.close();
	}

	return(the_code);
}

function applySelectedEasing() {
	if (!validateActiveSelection()) return false;
	app.beginUndoGroup("Ease and Wizz");

	var easingType = 'inOut';
	var scriptMode = "-easeandwizz";
	var keyframesToAffect = "-allKeys";

	if (curvaceousCheckbox.value) scriptMode = "-curvaceous";

	for (i in keysLookup) {
		if (keysLookup[i] == keysList.selection.toString()) keyframesToAffect = i;
	}

	for (i in inOutLookup) {
		if (inOutLookup[i] == typeList.selection.toString()) easingType = i;
	}

	var curveType = easingList.selection.toString();
	if (curveType == "AE expo") curveType = "aeExpo";

	var fileToLoad = easingType + curveType + scriptMode + keyframesToAffect + '.js';

	try {
		easingEquation = readEasingFile(fileToLoad);
	} catch(e) {
		Window.alert(e);
		return false;
	}

	applyExpressionToSelected(easingEquation);
	app.endUndoGroup();
}

function clearAllExpressions() {
	selectedProperties = activeItem.selectedProperties;
	for (var f in selectedProperties) {
		var currentProperty = selectedProperties[f];
		if (!currentProperty.canSetExpression) continue;
		currentProperty.expression = '';
	}
}

function applyExpressionToSelected(expressionCode) {
	var selectedProperties = app.project.activeItem.selectedProperties;

	for (var f in selectedProperties) {
		var currentProperty = selectedProperties[f];

		if ((currentProperty.propertyValueType == PropertyValueType.SHAPE) && !curvaceousCheckbox.value) {
			alert("It looks like you have a Mask Path selected. To apply Ease and Wizz to a Mask Path, select the ‘Curvaceous’ checkbox and try again.");
			continue;
		}

		if (!currentProperty.canSetExpression) continue;
		if (currentProperty.numKeys < 2) continue;

		currentProperty.expression = expressionCode;
	}
}

function validateActiveSelection() {
	activeItem = app.project.activeItem;
	if (activeItem == null) {
		Window.alert("Select a keyframe or two.");
		return false;
	}
	return true;
}

initCustomScript(this);
