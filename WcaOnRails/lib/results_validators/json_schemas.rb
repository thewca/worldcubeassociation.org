# frozen_string_literal: true

module ResultsValidators
  module JSONSchemas
    INDIVIDUAL_RESULT_JSON_SCHEMA = {
      "type" => "object",
      "properties" => {
        "personId" => { "type" => "number" },
        "position" => { "type" => ["number", "null"] },
        "results" => {
          "type" => "array",
          "items" => { "type" => "number" },
        },
        "best" => { "type" => "number" },
        "average" => { "type" => "number" },
      },
      "required" => ["personId", "position", "results", "best", "average"],
    }.freeze

    GROUP_JSON_SCHEMA = {
      "type" => "object",
      "properties" => {
        "group" => { "type" => "string" },
        "scrambles" => {
          "type" => "array",
          "items" => { "type" => "string" },
        },
        "extraScrambles" => {
          "type" => "array",
          "items" => { "type" => "string" },
        },
      },
      "required" => ["group", "scrambles"],
    }.freeze

    ROUND_JSON_SCHEMA = {
      "type" => "object",
      "properties" => {
        "roundId" => { "type" => "string" },
        "formatId" => { "type" => "string" },
        "results" => {
          "type" => "array",
          "items" => INDIVIDUAL_RESULT_JSON_SCHEMA,
        },
        "groups" => {
          "type" => "array",
          "items" => GROUP_JSON_SCHEMA,
        },
      },
      "required" => ["roundId", "formatId", "results", "groups"],
    }.freeze

    PERSON_JSON_SCHEMA = {
      "type" => "object",
      "properties" => {
        "id" => { "type" => "number" },
        "name" => { "type" => "string" },
        # May be empty
        "wcaId" => { "type" => "string" },
        "countryId" => { "type" => "string" },
        # May be empty
        "gender" => { "type" => "string" },
        "dob" => { "type" => "string" },
      },
      "required" => ["id", "name", "wcaId", "countryId", "gender", "dob"],
    }.freeze

    EVENT_JSON_SCHEMA = {
      "type" => "object",
      "properties" => {
        "eventId" => { "type" => "string" },
        "rounds" => {
          "type" => "array",
          "items" => ROUND_JSON_SCHEMA,
        },
      },
      "required" => ["eventId", "rounds"],
    }.freeze

    RESULT_JSON_SCHEMA = {
      "type" => "object",
      "properties" => {
        "formatVersion" => { "type" => "string" },
        "competitionId" => { "type" => "string" },
        "persons" => {
          "type" => "array",
          "items" => PERSON_JSON_SCHEMA,
        },
        "events" => {
          "type" => "array",
          "items" => EVENT_JSON_SCHEMA,
        },
      },
      "required" => ["formatVersion", "competitionId", "persons", "events"],
    }.freeze
  end
end
