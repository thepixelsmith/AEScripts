// Curvaceous - start to end
// 2.0.1 : inSine
// Created: 2025-05-13


function inSine(t, b, c, d) {
	return -c * Math.cos(t/d * (Math.PI/2)) + c + b;

}

function curvaceous() {
	
	try {
		var key1 = key(1);
		var key2 = key(numKeys);
	} catch(e) {
		return null;
	}
	
	t = time - key1.time;
	d = key2.time - key1.time;

	sX = key1.time;
	eX = key2.time - key1.time;


	if ((time < key1.time) || (time > key2.time)) {
		return null;
	} else {
		return valueAtTime(inSine(t, sX, eX, d));
	}
}

(curvaceous() || value);

