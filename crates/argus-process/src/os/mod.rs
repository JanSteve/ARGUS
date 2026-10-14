#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "linux")]
pub use linux as backend;

#[cfg(not(target_os = "linux"))]
pub mod darwin;
#[cfg(not(target_os = "linux"))]
pub use darwin as backend;
