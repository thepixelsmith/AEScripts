// Curvaceous - start to end
// 2.0.1 : inOutBounce
// Created: 2025-05-13


function inOutBounce(t, b, c, d) {
function easeOut (t, b, c, d) {
	if ((t/=d) < (1/2.75)) {
		return c*(7.5625*t*t) + b;
	} else if (t < (2/2.75)) {
		return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
	} else if (t < (2.5/2.75)) {
		return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
	} else {
		return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
	}
}

	function easeIn(t, b, c, d) {
		return c - easeOut (d-t, 0, c, d) + b;
	}

	if (t < d/2) return easeIn (t*2, 0, c, d) * .5 + b;
	else return easeOut (t*2-d, 0, c, d) * .5 + c*.5 + b;

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
		return valueAtTime(inOutBounce(t, sX, eX, d));
	}
}

(curvaceous() || value);

