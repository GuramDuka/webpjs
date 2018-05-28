# webpjs
javascript webp decoder

Decoding "webp" images in Chrome, Firefox and WebView.
Emscripten will create a global Module object, or use yours if you supply it.
As we want to know when everything has been loaded, we need to supply our own.
To get access to the C functions we exposed, we use Emscripten's cwrap.
The constructor takes an ArrayBuffer, for which we create a typed array, an Uint8Array as libwebp excepts an const uint8_t* pointer. We need to copy the data to the WebAssembly heap, so first we allocate a buffer and then we copy the data.
For allocation, we allocate byteLength bytes using _malloc and then we copy the data using Module.HEAPU8.set() — all convenience APIs exposed by Emscripten.
