(function(thisObj) {
    function buildUI(thisObj) {
        var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Brainstorm Lite", undefined, {resizeable:true});
        myPanel.orientation = "column";
        myPanel.alignChildren = ["fill", "top"];

        var randomnessGroup = myPanel.add("group");
        randomnessGroup.orientation = "row";
        randomnessGroup.add("statictext", undefined, "Randomness:");
        var randomnessSlider = randomnessGroup.add("slider", undefined, 50, 0, 100);
        randomnessSlider.preferredSize.width = 200;
        var randomnessValue = randomnessGroup.add("statictext", undefined, "50%");
        randomnessSlider.onChanging = function() {
            randomnessValue.text = Math.round(randomnessSlider.value) + "%";
        };

        var propsPanel = myPanel.add("panel", undefined, "Transform Properties");
        propsPanel.orientation = "column";
        propsPanel.alignChildren = "left";

        function makeToggleRow(label) {
            var group = propsPanel.add("group");
            group.alignment = ["fill", "top"];
            group.add("statictext", undefined, label + ":");
            var checkbox = group.add("checkbox", undefined, "Enable");
            var button = group.add("button", undefined, "Reset");
            return {group: group, checkbox: checkbox, resetButton: button};
        }

        var anchorRow = makeToggleRow("Anchor Point");
        var positionRow = makeToggleRow("Position");
        var scaleRow = makeToggleRow("Scale");
        var rotationRow = makeToggleRow("Rotation");
        var opacityRow = makeToggleRow("Opacity");

        var scaleDimGroup = myPanel.add("group");
        var uniformScaleCheckbox = scaleDimGroup.add("checkbox", undefined, "Uniform Scale");
        uniformScaleCheckbox.value = true;

        var dimGroup = myPanel.add("panel", undefined, "Affect Dimensions");
        dimGroup.orientation = "row";
        var affectX = dimGroup.add("checkbox", undefined, "X");
        var affectY = dimGroup.add("checkbox", undefined, "Y");
        var affectZ = dimGroup.add("checkbox", undefined, "Z");
        affectX.value = affectY.value = true;
        affectZ.value = false;

        var applyBtn = myPanel.add("button", undefined, "Apply Brainstorm");

        // === RESET BUTTON FUNCTIONS ===
        anchorRow.resetButton.onClick = function() {
            var layer = getFirstSelectedLayer();
            if (!layer) return;

            var transform = layer.property("ADBE Transform Group");
            var anchor = transform.property("ADBE Anchor Point");
            var position = transform.property("ADBE Position");

            var bounds = layer.sourceRectAtTime(app.project.activeItem.time, false);
            var center = [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2];

            var oldAnchor = anchor.value;
            var delta = [center[0] - oldAnchor[0], center[1] - oldAnchor[1]];
            anchor.setValue(center);

            var oldPos = position.value;
            position.setValue([oldPos[0] + delta[0], oldPos[1] + delta[1]]);
        };

        positionRow.resetButton.onClick = function() {
            var layer = getFirstSelectedLayer();
            if (!layer) return;
            var comp = app.project.activeItem;
            var pos = layer.property("ADBE Transform Group").property("ADBE Position");
            pos.setValue([comp.width / 2, comp.height / 2]);
        };

        scaleRow.resetButton.onClick = function() {
            var layer = getFirstSelectedLayer();
            if (!layer) return;
            var scale = layer.property("ADBE Transform Group").property("ADBE Scale");
            scale.setValue([100, 100]);
        };

        rotationRow.resetButton.onClick = function() {
            var layer = getFirstSelectedLayer();
            if (!layer) return;
            var t = layer.property("ADBE Transform Group");
            if (layer.threeDLayer) {
                t.property("ADBE Rotate X").setValue(0);
                t.property("ADBE Rotate Y").setValue(0);
                t.property("ADBE Rotate Z").setValue(0);
            } else {
                t.property("ADBE Rotate Z").setValue(0);
            }
        };

        opacityRow.resetButton.onClick = function() {
            var layer = getFirstSelectedLayer();
            if (!layer) return;
            var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");
            opacity.setValue(100);
        };

        // === APPLY BRAINSTORM ===
        applyBtn.onClick = function() {
            app.beginUndoGroup("Brainstorm");

            var layers = app.project.activeItem.selectedLayers;
            if (layers.length === 0) {
                alert("Select at least one layer.");
                return;
            }

            var randAmount = randomnessSlider.value / 100;

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                var t = layer.property("ADBE Transform Group");

                if (anchorRow.checkbox.value) applyToProperty(t.property("ADBE Anchor Point"));
                if (positionRow.checkbox.value) applyToProperty(t.property("ADBE Position"));
                if (scaleRow.checkbox.value) applyToProperty(t.property("ADBE Scale"), true);
                if (rotationRow.checkbox.value) {
                    if (layer.threeDLayer) {
                        applyRotationToAxis(t.property("ADBE Rotate X"), randAmount);
                        applyRotationToAxis(t.property("ADBE Rotate Y"), randAmount);
                        applyRotationToAxis(t.property("ADBE Rotate Z"), randAmount);
                    } else {
                        applyRotationToAxis(t.property("ADBE Rotate Z"), randAmount);
                    }
                }
                if (opacityRow.checkbox.value) applyToProperty(t.property("ADBE Opacity"));
            }

            app.endUndoGroup();
        };

        // === HELPERS ===
        function getFirstSelectedLayer() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) return null;
            return comp.selectedLayers.length ? comp.selectedLayers[0] : null;
        }

        function applyToProperty(prop, isScale) {
            if (!prop || !prop.canSetExpression) return;
            var val = prop.value;
            var randAmount = randomnessSlider.value / 100;

            if (val instanceof Array) {
                var newVal = val.slice();

                // Build dimension mask
                var dimsToAffect = [];
                if (val.length >= 1) dimsToAffect.push(affectX.value);
                if (val.length >= 2) dimsToAffect.push(affectY.value);
                if (val.length >= 3) dimsToAffect.push(affectZ.value);

                if (isScale && uniformScaleCheckbox.value) {
                    var avg = average(val);
                    var delta = safeRandom(avg, randAmount);
                    for (var i = 0; i < val.length; i++) {
                        newVal[i] = avg + delta;
                    }
                } else {
                    for (var i = 0; i < val.length; i++) {
                        if (!dimsToAffect[i]) continue;
                        newVal[i] = val[i] + safeRandom(val[i], randAmount);
                    }
                }

                prop.setValue(newVal);
            } else {
                var variation = safeRandom(val, randAmount);
                var newVal = val + variation;
                if (prop.name.toLowerCase().indexOf("opacity") !== -1)
                    newVal = Math.min(100, Math.max(0, newVal));
                prop.setValue(newVal);
            }
        }

        function applyRotationToAxis(prop, amount) {
            if (!prop || !prop.canSetExpression) return;
            var val = prop.value;
            var delta = safeRotationRandom(val, amount);
            var newVal = val + delta;
            prop.setValue(newVal);
        }

        function average(arr) {
            var sum = 0;
            for (var i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
            return sum / arr.length;
        }

        function safeRandom(base, amount) {
            var fallback = 100;
            var ref = Math.abs(base) < 1e-3 ? fallback : base;
            return ref * amount * (Math.random() * 2 - 1);
        }

        function safeRotationRandom(base, amount) {
            var fallback = 45;
            var ref = Math.abs(base) < 1e-3 ? fallback : base;
            var raw = ref * amount * (Math.random() * 2 - 1);
            var rounded = Math.round(raw / 10) * 10;
            if (rounded === 0) {
                rounded = (Math.random() < 0.5 ? -1 : 1) * 10;
            }
            return rounded;
        }

        if (myPanel instanceof Window) {
            myPanel.center();
            myPanel.show();
        } else {
            myPanel.layout.layout(true);
        }

        return myPanel;
    }

    buildUI(thisObj);
})(this);
