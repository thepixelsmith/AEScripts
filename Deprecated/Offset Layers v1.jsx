/**
 * LayerOffset.jsx - Version 1.2.4
 * Author: Jerron Smith
 * Description: AE dockable panel to offset layers relative to in-point.
 *
 * --------------------------------------------------------------------------------
 * CHANGELOG:
--------------------------------------------------------------------------------
 * Version 1.2.4 – SMPTE Correction for Frame Buttons
 * - Frame adjustment buttons now round and clamp values cleanly
 * - Ensures all SMPTE values remain valid whole-frame timecodes
 *
 * Version 1.2 – Offset logic refinement and UI improvement
 * - Added a "Reverse Layer Order" checkbox to allow bottom-to-top offsetting.
 * - Adjusted offset logic: the layer that offsets first (top or bottom) stays fixed.
 * - Updated the info text with clear bullet points for user clarity.
 * */

#targetengine "offsetLayers"

(function offsetLayersPanel(thisObj) {
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Layer Offset", undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 10;

        // --- Timecode Input ---
        var inputGroup = win.add("group");
        inputGroup.orientation = "row";
        inputGroup.add("statictext", undefined, "Offset:");

        var timeInput = inputGroup.add("edittext", undefined, "00:00:01:00");
        var btnMinus1 = inputGroup.add("button", undefined, "–");
        btnMinus1.helpTip = "Subtract 1 frame (Shift = 10 frames)";
        btnMinus1.preferredSize.width = 30;
        var btnPlus1 = inputGroup.add("button", undefined, "+");
        btnPlus1.helpTip = "Add 1 frame (Shift = 10 frames)";
        btnPlus1.preferredSize.width = 30;
        timeInput.characters = 12;

        // --- Reverse Order Checkbox ---
        var reverseCheckbox = win.add("checkbox", undefined, "Reverse Layer Order");

        // --- Buttons ---
        var buttonGroup = win.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignChildren = ["fill", "center"];
        buttonGroup.spacing = 10;

        var btnApply = buttonGroup.add("button", undefined, "Offset Layers");
        btnApply.helpTip = "Apply the current time offset to all selected layers.";
        btnApply.preferredSize.width = 110;
        var btnReset = buttonGroup.add("button", undefined, "Reset to Home");
        btnReset.helpTip = "Reset all selected layers so their in-point aligns with time 0.";
        btnReset.preferredSize.width = 110;

        // --- Info Text (Bulleted) ---
        var infoText = win.add("statictext", undefined,
            "\u2022 Offset order is based on the layer stacking order (top to bottom).\n" +
            "\u2022 The first layer in the offset order stays fixed; other layers offset relative to it.",
            { multiline: true }
        );
        infoText.alignment = ["fill", "top"];

        // --- Time Formatting ---
        timeInput.onChange = function () {
            var raw = timeInput.text.replace(/[^\d]/g, "");
            while (raw.length < 8) raw = "0" + raw;
        
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) return;
        
            var fps = Math.floor(comp.frameRate);
        
            var ff = parseInt(raw.substring(6, 8), 10);
            var ss = parseInt(raw.substring(4, 6), 10);
            var mm = parseInt(raw.substring(2, 4), 10);
            var hh = parseInt(raw.substring(0, 2), 10);
        
            if (ff >= fps) { ss += Math.floor(ff / fps); ff %= fps; }
            if (ss >= 60) { mm += Math.floor(ss / 60); ss %= 60; }
            if (mm >= 60) { hh += Math.floor(mm / 60); mm %= 60; }
        
            function pad(n) { return (n < 10 ? "0" : "") + n; }
            ff = Math.floor(ff);
            timeInput.text = pad(hh) + ":" + pad(mm) + ":" + pad(ss) + ":" + pad(ff);
        };
        

        function adjustTimeByFrames(direction) {
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) return;
            var fps = comp.frameRate;
            var parts = timeInput.text.split(":");
            if (parts.length !== 4) return;

            var hh = parseInt(parts[0], 10),
                mm = parseInt(parts[1], 10),
                ss = parseInt(parts[2], 10),
                ff = parseInt(parts[3], 10);

            fps = Math.floor(fps);
            var totalFrames = Math.round((((hh * 60 + mm) * 60 + ss) * fps) + ff);
            var delta = ScriptUI.environment.keyboardState.shiftKey ? 10 : 1;
            totalFrames = Math.max(totalFrames + direction * delta, 0);
            totalFrames = Math.round(totalFrames);

            ff = totalFrames % fps;
            totalFrames = Math.floor(totalFrames / fps);
            ss = totalFrames % 60;
            totalFrames = Math.floor(totalFrames / 60);
            mm = totalFrames % 60;
            hh = Math.floor(totalFrames / 60);

            function pad(n) { return (n < 10 ? "0" : "") + n; }
            timeInput.text = pad(hh) + ":" + pad(mm) + ":" + pad(ss) + ":" + pad(ff);
        }

        btnPlus1.onClick = function () { adjustTimeByFrames(+1); };
        btnMinus1.onClick = function () { adjustTimeByFrames(-1); };

        function parseTime(t, fps) {
            var parts = t.split(":");
            if (parts.length !== 4) return 0;
            var hh = parseInt(parts[0], 10), mm = parseInt(parts[1], 10), ss = parseInt(parts[2], 10), ff = parseInt(parts[3], 10);
            return ((hh * 3600 + mm * 60 + ss) * fps + ff) / fps;
        }

        // --- Apply Offset ---
        btnApply.onClick = function () {
            app.beginUndoGroup("Apply Layer Offset");

            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                alert("Please select at least one layer.");
                return;
            }

            var fps = comp.frameRate;
            var offsetTime = parseTime(timeInput.text, fps);

            var sorted = layers.slice().sort(function (a, b) { return a.index - b.index; });
            if (reverseCheckbox.value) sorted.reverse();

            var baseLayer = sorted[0];
            var baseIn = baseLayer.inPoint;

            for (var i = 0; i < sorted.length; i++) {
                var layer = sorted[i];
                if (layer.index === baseLayer.index) continue;
                var newIn = baseIn + (offsetTime * i);
                var delta = newIn - layer.inPoint;
                layer.startTime += delta;
            }

            app.endUndoGroup();
        };

        // --- Reset Start Times ---
        btnReset.onClick = function () {
            app.beginUndoGroup("Reset Layer Start Times");

            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                alert("Please select at least one layer.");
                return;
            }

            for (var i = 0; i < layers.length; i++) {
                var offset = layers[i].inPoint;
                layers[i].startTime -= offset;
            }

            app.endUndoGroup();
        };

        return win;
    }

    var myPanel = buildUI(thisObj);
    if (myPanel instanceof Window) {
        myPanel.center();
        myPanel.show();
    } else if (myPanel instanceof Panel) {
        myPanel.layout.layout(true);
    }
})(this);
