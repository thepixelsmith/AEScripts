#targetengine "animationSummary"

function animationSummaryPanel(thisObj) {
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Animation Summary", undefined, { resizeable: true });

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 10;

    var summarizeBtn = win.add("button", undefined, "Summarize Selected Layers");

    var resultBox = win.add("edittext", undefined, "", { multiline: true, scrolling: true });
    resultBox.preferredSize = [400, 300];

    function timeToSMPTE(time, frameRate) {
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor((time % 3600) / 60);
        var seconds = Math.floor(time % 60);
        var frames = Math.floor((time % 1) * frameRate);
        function pad(n) { return (n < 10 ? "0" : "") + n; }
        return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds) + ":" + pad(frames);
    }

    function summarizeAnimation() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            resultBox.text = "Please select a composition.";
            return;
        }

        if (comp.selectedLayers.length === 0) {
            resultBox.text = "Please select at least one layer.";
            return;
        }

        var frameRate = comp.frameRate;
        var report = "";

        for (var i = 0; i < comp.selectedLayers.length; i++) {
            var layer = comp.selectedLayers[i];
            report += "Layer: \"" + layer.name + "\"\n";

            var layerHasAnimation = false;

            var transformGroup = layer.property("Transform");
            if (transformGroup) {
                for (var j = 1; j <= transformGroup.numProperties; j++) {
                    var prop = transformGroup.property(j);
                    if (prop && prop.isTimeVarying && prop.numKeys > 0) {
                        layerHasAnimation = true;
                        var firstKey = prop.keyTime(1);
                        var lastKey = prop.keyTime(prop.numKeys);
                        report += "  • " + prop.name + ": " + prop.numKeys + " keyframes";
                        report += " (" + timeToSMPTE(firstKey, frameRate) + " → " + timeToSMPTE(lastKey, frameRate) + ")";
                        if (prop.expression) report += " [Expression]";
                        report += "\n";
                    }
                }
            }

            var effects = layer.property("ADBE Effect Parade");
            if (effects && effects.numProperties > 0) {
                for (var k = 1; k <= effects.numProperties; k++) {
                    var effect = effects.property(k);
                    var hasAnimatedProps = false;
                    var effectReport = "";

                    for (var l = 1; l <= effect.numProperties; l++) {
                        var effProp = effect.property(l);
                        if (effProp && effProp.isTimeVarying && effProp.numKeys > 0) {
                            hasAnimatedProps = true;
                            layerHasAnimation = true;
                            var firstKey = effProp.keyTime(1);
                            var lastKey = effProp.keyTime(effProp.numKeys);
                            effectReport += "    • " + effProp.name + ": " + effProp.numKeys + " keyframes";
                            effectReport += " (" + timeToSMPTE(firstKey, frameRate) + " → " + timeToSMPTE(lastKey, frameRate) + ")";
                            if (effProp.expression) effectReport += " [Expression]";
                            effectReport += "\n";
                        }
                    }

                    if (hasAnimatedProps) {
                        report += "  Effect: " + effect.name + "\n";
                        report += effectReport;
                    }
                }
            }

            if (!layerHasAnimation) {
                report += "  No Animation Present\n";
            }

            report += "\n";
        }

        resultBox.text = report;
    }

    summarizeBtn.onClick = function () {
        app.beginUndoGroup("Summarize Animation");
        summarizeAnimation();
        app.endUndoGroup();
    };

    if (win instanceof Window) {
        win.center();
        win.show();
    }

    return win;
}

animationSummaryPanel(this);
