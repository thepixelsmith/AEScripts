// Curvaceous - start to end
// 2.0.1 : inExpo
// Created: 2025-05-13


function inExpo(t, b, c, d) {
	return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
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
		return valueAtTime(inExpo(t, sX, eX, d));
	}
}

(curvaceous() || value);

