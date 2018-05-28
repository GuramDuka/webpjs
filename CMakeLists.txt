cmake_minimum_required (VERSION 3.7)
project(webp_wasm)

SET(CMAKE_BUILD_TYPE_INIT "Release")
set(CMAKE_C_COMPILER "emcc")
set(CMAKE_CXX_COMPILER "em++")

file(GLOB SOURCE_FILES 
 *.c
 ../libwebp/src/dec/*.c
 ../libwebp/src/dsp/*.c
 ../libwebp/src/demux/*.c
 ../libwebp/src/enc/*.c
 ../libwebp/src/mux/*.c
 ../libwebp/src/utils/*.c
)

# development
set(OPTS " \
	-O3 -g \
	--minify 0 \
	--memory-init-file 0 \
	-Wno-almost-asm \
	-s USE_SDL=0 \
	-s WASM=0 \
	-s WASM_MEM_MAX=16777216 \
	-s TOTAL_MEMORY=16777216 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MALLOC=emmalloc \
	-s SIMD=0 \
	-s NO_FILESYSTEM=1 \
	-s DISABLE_EXCEPTION_CATCHING=1 \
	-s ASSERTIONS=0 \
	-s ELIMINATE_DUPLICATE_FUNCTIONS=1 \
	-s ELIMINATE_DUPLICATE_FUNCTIONS_PASSES=15 \
	-s STACK_OVERFLOW_CHECK=0 \
	-s VERBOSE=0 \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=\"[\"getValue\"]\" \
	-s EXPORT_NAME=webpBind \
	-s MODULARIZE=1 \
	-s MODULARIZE_INSTANCE=0 \
	-s ASM_JS=1 \
	-s FINALIZE_ASM_JS=1 \
	-s ONLY_MY_CODE=0 \
")

# release
set(OPTS " \
	--minify 0 \
	-s WASM=1 \
	-s USE_SDL=0 \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=\"[\"getValue\"]\" \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MALLOC=emmalloc \
	-s ABORTING_MALLOC=0 \
	-s NO_FILESYSTEM=1 \
	-s DISABLE_EXCEPTION_CATCHING=1 \
	-s STACK_OVERFLOW_CHECK=0 \
	-s ASSERTIONS=0 \
	-s MODULARIZE=1 \
")

add_executable(webpjs ${SOURCE_FILES})
target_include_directories(webpjs PRIVATE
	$(EMSCRIPTEN)/system/include
	../libwebp
)
set_target_properties(webpjs PROPERTIES COMPILE_FLAGS ${OPTS})
set_target_properties(webpjs PROPERTIES LINK_FLAGS ${OPTS})
