# frozen_string_literal: true

# Enable garbage collection profiling so New Relic can see what's going on.
# See https://docs.newrelic.com/docs/agents/ruby-agent/features/garbage-collection
GC::Profiler.enable
