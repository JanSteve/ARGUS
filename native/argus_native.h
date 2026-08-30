/**
 * ARGUS 2.0 Native C/C++ Subsystem Interface
 * 
 * Exposes pure C-ABI function prototypes for performance-critical tasks,
 * GPU tensor acceleration, and low-level Linux kernel helpers.
 */

#ifndef ARGUS_NATIVE_H
#define ARGUS_NATIVE_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Opaque context handle
typedef struct argus_context_t argus_context_t;

/**
 * Initialize high-performance native ARGUS context
 */
argus_context_t* argus_native_init(const char* workspace_root);

/**
 * Compute high-speed SIMD hardware SHA-256 digest
 */
int argus_native_sha256(const uint8_t* data, size_t len, char* out_hex_64);

/**
 * Query native hardware acceleration capabilities (Vulkan, CUDA, ROCm)
 */
int argus_native_detect_acceleration(char* out_info, size_t max_len);

/**
 * Free native context
 */
void argus_native_free(argus_context_t* ctx);

#ifdef __cplusplus
}
#endif

#endif // ARGUS_NATIVE_H
