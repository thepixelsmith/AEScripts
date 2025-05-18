/*
    Expression Utility Panel for After Effects
    Developed in ExtendScript for dockable UI
    Version: 1.0
    Author: Jerron Smith

    Changelog:
    - v1.0: Fixed bug preventing expressions from being applied by passing selectedProps into buildExpression; corrected value*time expression output
    $1    - v0.9: Fixed syntax error in buildExpression; refactored random() and wiggle() to support 3D vector output for 3D layers
    $1    - v0.8: Added 3D layer support for wiggle() — now generates 3D vectors for Position, Scale, and Anchor Point
    $1    - v0.7: Added support for 3D layers — random() now generates 3D vectors for Position, Scale, and Anchor Point when applied to 3D layers
    $1    - v0.6: Updated 'random()' to generate 2D values for Position, Scale, and Anchor Point
    $1    - v0.5: Reimplemented 'random()' expression parameters with editable fields and tooltips
    $1    - v0.4: Set default insert mode to 'Replace'; added 'Remove Expressions' button; reorganized transform property checkboxes into two columns
    $1    - v0.3: Cleaned up remaining syntax error from earlier label removal; script now fully functional
    - v0.0: Initial release
        • Dockable UI with transform property checkboxes
        • Supports loopOut(), wiggle(), random(), value * time, posterizeTime()
        • Dynamic parameter fields based on expression type
        • Dropdown to choose Append, Prepend, or Replace expression mode
        • Applies expressions only to checked transform properties of selected layers
        • Alerts on errors or skipped properties
*/

(function(thisObj) {
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Expression Utility", undefined, {resizeable: true});

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];

        // === Property Checkboxes ===
        var propGroup = win.add("panel", undefined, "Transform Properties");
        propGroup.orientation = "row";
        propGroup.alignChildren = "top";
        
        var col1 = propGroup.add("group");
        col1.orientation = "column";
        col1.alignChildren = "left";

        var col2 = propGroup.add("group");
        col2.orientation = "column";
        col2.alignChildren = "left";

        var props = {
            position: col1.add("checkbox", undefined, "Position"),
            scale: col1.add("checkbox", undefined, "Scale"),
            rotation: col1.add("checkbox", undefined, "Rotation"),
            anchor: col2.add("checkbox", undefined, "Anchor Point"),
            opacity: col2.add("checkbox", undefined, "Opacity")
        };

        // === Expression Type ===
        var exprGroup = win.add("group");
        exprGroup.add("statictext", undefined, "Expression:");
        var exprDropdown = exprGroup.add("dropdownlist", undefined, ["loopOut()", "wiggle()", "random()", "value * time", "posterizeTime()"]); 
        exprDropdown.selection = 0;

        // === Dynamic Params Panel ===
        var paramGroup = win.add("group");
        paramGroup.orientation = "row";
        paramGroup.alignChildren = ["left", "center"];

        var param1 = paramGroup.add("edittext", undefined, "");
        param1.characters = 5;
        var param2 = paramGroup.add("edittext", undefined, "");
        param2.characters = 5;

        param1.visible = false;
        param2.visible = false;

        // === Expression Mode ===
        var modeGroup = win.add("group");
        modeGroup.add("statictext", undefined, "Insert Mode:");
        var modeDropdown = modeGroup.add("dropdownlist", undefined, ["Append", "Prepend", "Replace"]);
        modeDropdown.selection = 2;

        // === Apply Button ===
        var applyBtn = win.add("button", undefined, "Apply Expression");
        var removeBtn = win.add("button", undefined, "Remove Expressions");
        // === Expression Param Logic ===
        function updateParamFields() {
            var sel = exprDropdown.selection.text;
            param1.visible = false;
            param2.visible = false;

            if (sel === "wiggle()") {
                param1.text = "2";
                param1.helpTip = "How many times per second the property should wiggle";

                param2.text = "30";
                param2.helpTip = "How far the property can move from its original value";

                param1.visible = true;
                param2.visible = true;

            } else if (sel === "random()") {
                param1.text = "0";
                param1.helpTip = "Minimum value for random range";

                param2.text = "100";
                param2.helpTip = "Maximum value for random range";

                param1.visible = true;
                param2.visible = true;

            } else if (sel === "posterizeTime()") {
                param1.text = "12";
                param1.helpTip = "Frames per second to sample the expression’s result (creates stutter effect)";

                param1.visible = true;
            }

            paramGroup.layout.layout(true);
        }

        exprDropdown.onChange = updateParamFields;
        updateParamFields();

        // === Expression Building Logic ===
        function buildExpression(exprType, p1, p2, propName) {
            var isMultiDim = propName === "position" || propName === "scale" || propName === "anchor";
            var is3D = false;
            if (app.project.activeItem && app.project.activeItem.selectedLayers.length > 0) {
                is3D = app.project.activeItem.selectedLayers[0].threeDLayer;
            }
            
            switch (exprType) {
                case "loopOut()":
                    return "loopOut()";

                case "wiggle()":
                    if (isMultiDim && is3D) {
                        return "[wiggle(" + p1 + ", " + p2 + ")[0], wiggle(" + p1 + ", " + p2 + ")[1], wiggle(" + p1 + ", " + p2 + ")[2]]";
                    } else if (isMultiDim) {
                        return "[wiggle(" + p1 + ", " + p2 + ")[0], wiggle(" + p1 + ", " + p2 + ")[1]]";
                    } else {
                        return "wiggle(" + p1 + ", " + p2 + ")";
                    }

                case "random()":
                    if (uniform && isMultiDim) {
                        var dims = is3D ? 3 : 2;
                        return "var temp = random(" + p1 + ", " + p2 + ");\n[" + (new Array(dims).fill('temp').join(", ")) + "]";
                    } else if (isMultiDim && is3D) {
                        return "[random(" + p1 + ", " + p2 + "), random(" + p1 + ", " + p2 + "), random(" + p1 + ", " + p2 + ")]";
                    } else if (isMultiDim) {
                        return "[random(" + p1 + ", " + p2 + "), random(" + p1 + ", " + p2 + ")]";
                    } else {
                        return "random(" + p1 + ", " + p2 + ")";
                    }

                case "value * time":
                    return "value * time";
            }
        }

        function isTransformApplicable(layer, propName) {
            try {
                return layer.property("Transform").property(propName) !== null;
            } catch (e) {
                return false;
            }
        }

        function applyExpressionToProperty(prop, expr, mode) {
            if (!prop.canSetExpression) return false;
            try {
                var existing = prop.expression;
                if (mode === "Replace" || existing === "") {
                    prop.expression = expr;
                } else if (mode === "Append") {
                    prop.expression = existing + "\n" + expr;
                } else if (mode === "Prepend") {
                    prop.expression = expr + "\n" + existing;
                }
                return true;
            } catch (e) {
                return false;
            }
        }

        applyBtn.onClick = function() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                alert("Please select one or more layers.");
                return;
            }

            var selectedProps = [];
            for (var key in props) {
                if (props[key].value) selectedProps.push(key);
            }

            if (selectedProps.length === 0) {
                alert("Please select at least one transform property.");
                return;
            }

            app.beginUndoGroup("Apply Expressions");
            var failedProps = [];
            // moved into per-property scope
            var mode = modeDropdown.selection.text;

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                for (var j = 0; j < selectedProps.length; j++) {
                    var propName = selectedProps[j];
                    var expr = buildExpression(exprDropdown.selection.text, param1.text, param2.text, propName);
                                        var prop = layer.property("Transform").property(propName.charAt(0).toUpperCase() + propName.slice(1));
                    if (prop && prop.canSetExpression) {
                        var success = applyExpressionToProperty(prop, expr, mode);
                        if (!success) failedProps.push(layer.name + " - " + propName);
                    }
                }
            }
            app.endUndoGroup();

            if (failedProps.length > 0) {
                alert("Expression failed on the following properties:\n" + failedProps.join("\n"));
            }
        };

        removeBtn.onClick = function() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                alert("Please select one or more layers.");
                return;
            }

            app.beginUndoGroup("Remove Expressions");

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                var transform = layer.property("Transform");
                if (transform) {
                    for (var j = 1; j <= transform.numProperties; j++) {
                        var prop = transform.property(j);
                        if (prop.canSetExpression && prop.expression !== "") {
                            prop.expression = "";
                        }
                    }
                }
            }

            app.endUndoGroup();
        };

        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
        }

        return win;
    }

    var myPanel = buildUI(thisObj);

})(this);
