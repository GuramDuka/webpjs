//------------------------------------------------------------------------------
let webp;
//------------------------------------------------------------------------------
const accumulate = 1024;
const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
//------------------------------------------------------------------------------
function array2base64(data, prefix = '') {
	const bytes = new Uint8Array(data);
	const { byteLength } = bytes;
	const byteRemainder = byteLength % 3;
	const mainLength = byteLength - byteRemainder;

	let a, b, c, d, chunk, base64 = prefix, accumulator = '';

	// Main loop deals with bytes in chunks of 3
	for (let i = 0; i < mainLength; i = i + 3) {
		// Combine the three bytes into a single integer
		chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048) >> 12;   // 258048   = (2^6 - 1) << 12
		c = (chunk & 4032) >> 6;      // 4032     = (2^6 - 1) << 6
		d = chunk & 63;               // 63       = 2^6 - 1

		// Convert the raw binary segments to the appropriate ASCII encoding
		accumulator += encodings[a] + encodings[b] + encodings[c] + encodings[d];

		if (accumulator.length >= accumulate) {
			base64 += accumulator;
			accumulator = '';
		}
	}

	// Deal with the remaining bytes and padding
	if (byteRemainder === 1) {
		chunk = bytes[mainLength];

		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

		// Set the 4 least significant bits to zero
		b = (chunk & 3) << 4; // 3   = 2^2 - 1

		accumulator += encodings[a] + encodings[b] + '==';
	}
	else if (byteRemainder === 2) {
		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008) >> 4;   // 1008  = (2^6 - 1) << 4

		// Set the 2 least significant bits to zero
		c = (chunk & 15) << 2; // 15    = 2^4 - 1

		accumulator += encodings[a] + encodings[b] + encodings[c] + '=';
	}

	return base64 + accumulator;
}
//------------------------------------------------------------------------------
function webp2png(buffer) {
	let result;

	const size = buffer.byteLength;
	const ptr = webp._malloc(size);

	if (ptr !== 0) {
		const data = new Uint8Array(buffer);
		webp.HEAPU8.set(data, ptr);

		const resultPtr = webp._webp2png(ptr, size);

		if (resultPtr !== 0) {
			const resultSize = webp.getValue(resultPtr, 'i32');
			result = webp.HEAPU8.buffer.slice(resultPtr + 4, resultPtr + 4 + resultSize);
			webp._free(resultPtr);
		}

		webp._free(ptr);
	}

	return array2base64(result, 'data:image/png;base64,');
}
//------------------------------------------------------------------------------
function consoleLog(...args) {
	let e = document.getElementById('console');

	if (!e) {
		e = document.createElement('p');
		e.id = 'console';
		e.classList.add('console');
		document.body.appendChild(e);
	}

	e.innerHTML += args.join(' ');
}
//------------------------------------------------------------------------------
function rerun() {
	let e = document.getElementById('rerunb');

	if (!e) {
		e = document.createElement('input');
		e.id = 'rerunb';
		e.type = 'button';
		e.value = 'Re-run';
		e.onclick = rerun;
		document.body.appendChild(e);
	}

	const cacheId = '$__image_cache__#';
	let cache = document.getElementById(Image.__cacheId);

	while (cache && cache.sheet.cssRules.length !== 0)
		cache.sheet.removeRule(cache.sheet.cssRules.length - 1);

	if (!cache) {
		cache = document.createElement('style');
		cache.id = cacheId;
		document.head.appendChild(cache);
	}

	cache.sheet.insertRule(
		`.image {
			background-color: blue;
			background-position: left center;
			background-repeat: no-repeat;
			background-size: contain;
			width: 320px;
			height: 200px;
		}`);
	cache.sheet.insertRule(
		`.console {
			line-height: 1.0;
		}`);

	const beginDecode = (new Date()).getTime();

	for (let i = 0; i < webpRaw.length; i++ ) {
		const id = `image_${i}`;
		const index = cache.sheet.cssRules.length;
		cache.sheet.insertRule(`.${id} { background-image: url(${webp2png(webpRaw[i])}); }`, index);

		let image = document.getElementById(id);

		if (!image) {
			image = document.createElement('div');
			image.id = id;
			image.classList.add('image');
			image.classList.add(id);
			document.body.appendChild(image);
		}
	}

	const endDecode = (new Date()).getTime();
	const ellapsedDecode = Math.trunc((endDecode - beginDecode) / webpRaw.length);
	consoleLog(`webp decode (average per image): ${ellapsedDecode}ms<br>`);
}
//------------------------------------------------------------------------------
let beginLoad = (new Date()).getTime(), endLoad, ellapsedLoad;
//------------------------------------------------------------------------------
function webpRuntimeInitialized() {
	endLoad = (new Date()).getTime();
	ellapsedLoad = endLoad - beginLoad;
	const v = webp._version();
	consoleLog('libwebp version: ', `${v >>> 16}.${(v >>> 8) & 255}.${v & 255}`, '<br>');
	consoleLog(`libwebp runtime initialized: ${ellapsedLoad}ms<br>`);
	rerun();
}
//------------------------------------------------------------------------------
webp = Module({
	locateFile: s => './build/' + s,
	wasmBinary: wasmBinary,
	onRuntimeInitialized: webpRuntimeInitialized
});
//------------------------------------------------------------------------------
