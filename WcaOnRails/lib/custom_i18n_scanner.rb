# frozen_string_literal: true
require 'i18n/tasks/scanners/file_scanner'
class WCAFileScanner < I18n::Tasks::Scanners::FileScanner
  include I18n::Tasks::Scanners::RelativeKeys
  include I18n::Tasks::Scanners::OccurrenceFromPosition

  def active_record?(model)
    # FIXME: Find a way to determine this dynamically ?
    model != "contact"
  end

  def extract_model_name(key)
    model_key = key.gsub(/^(\w+)\..*$/, '\1').singularize
    # Some dirty tricks to assign the detected field to the "correct" model
    # For most controllers the forms modify a model which has the same name
    # as the controller, however for some of them they modified a single different
    # model (eg: the `admin` forms modify `person`s, and only that model).
    case model_key
    when "devise" then "user"
    when "admin" then "person"
    when "oauth" then "doorkeeper/application"
    when "contact"
      # ContactsController uses WebsiteContact or DobCotact (which are much like extended models).
      # We need to determine which one does the key refer to.
      if key.include?("website")
        "website_contact"
      elsif key.include?("dob")
        "dob_contact"
      else
        throw "Unrecognized contact model. Key: #{key}"
      end
    else model_key
    end
  end

  # @return [Array<[absolute key, Results::Occurrence]>]
  def scan_file(path)
    text = read_file(path)
    retval = []

    # First scan for inputs (or labels for inputs) that are not hidden
    text.scan(/^\s*<%= f.(input|label|input_field) :(\w+)(?!.*hidden)(.*)%>/) do |_, attribute, input_params|
      # 'absolute_key' returns something that we assume looks like model.(.*).attribute
      abskey = absolute_key(".#{attribute}", path)
      occurrence = occurrence_from_position(path, text, Regexp.last_match.offset(0).first)
      model = extract_model_name(abskey)
      # Mark the hint as used if we don't use custom hint
      if !input_params.include?("hint:")
        retval << ["simple_form.hints.#{model}.#{attribute}", occurrence]
      end
      # Mark the label as used if we don't use custom hint
      if !input_params.include?("label:")
        # Simple form can fetch its labels from activerecord.attributes,
        # Mark it as used ... Except if the model is not an ActiveRecord ;)
        # if not we mark the label as used!
        retval << if active_record?(model)
                    ["activerecord.attributes.#{model}.#{attribute}", occurrence]
                  else
                    ["simple_form.labels.#{model}.#{attribute}", occurrence]
                  end
      end
    end

    # Then scan for possible radio choices
    text.scan(/^\s*<%= f.input :(\w+), as: :radio_buttons, collection: \[(.*)\](.*)%>/) do |attribute, collection|
      abskey = absolute_key(".#{attribute}", path)
      occurrence = occurrence_from_position(path, text, Regexp.last_match.offset(0).first)
      model = extract_model_name(abskey)
      # Get all choices from the f.input
      options = collection.gsub(/[: ]/, '').split(',')
      options.each do |o|
        # Mark every choice as used
        retval << ["simple_form.options.#{model}.#{attribute}.#{o}", occurrence]
      end
    end

    # Scan for uses of our custom associated_events_picker
    text.scan(/^\s*<%= render .shared.associated_events_picker..*?(events_association_name): :([^ ,]*).*%>/m) do |_, events_association_name|
      abskey = absolute_key(".#{events_association_name}", path)
      occurrence = occurrence_from_position(path, text, Regexp.last_match.offset(0).first)
      model = extract_model_name(abskey)
      retval << ["activerecord.attributes.#{model}.#{events_association_name}", occurrence]
    end

    retval
  end
end
