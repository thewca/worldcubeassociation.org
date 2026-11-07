#!/bin/bash

# Make sure we have the required version of Yarn running
#  (because for some reason, this isn't done automatically even when corepack is explicitly enabled)
corepack install

# Make sure we have the most up-to-date Rust toolchain running
#   for compiling native binaries that have bindings in Rust
#   per https://wiki.debian.org/Rust
rustup default stable
