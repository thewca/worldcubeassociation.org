# frozen_string_literal: true

module ApplicationHelper
  include MarkdownHelper
  include MoneyRails::ActionViewExtension
  include Webpacker::Helper

  def full_title(page_title = '')
    base_title = WcaOnRails::Application.config.site_name
    if page_title.empty?
      base_title
    else
      page_title + " | " + base_title
    end
  end

  def bootstrap_class_for(flash_type)
    {
      success: "alert-success",
      danger: "alert-danger",
      warning: "alert-warning",
      info: "alert-info",

      # For devise
      notice: "alert-success",
      alert: "alert-danger",

      recaptcha_error: "alert-danger",
    }[flash_type.to_sym] || flash_type.to_s
  end

  def link_to_google_maps_place(text, latitude, longitude)
    url = "https://www.google.com/maps/place/#{latitude},#{longitude}"
    link_to text, url, target: "_blank"
  end

  def link_to_google_maps_dir(text, start_latitude, start_longitude, end_latitude, end_longitude)
    url = "https://www.google.com/maps/dir/#{start_latitude},#{start_longitude}/#{end_latitude},#{end_longitude}/"
    link_to text, url, target: "_blank"
  end

  def link_to_competition_schedule_tab(comp)
    competition_url(comp, anchor: "competition-schedule")
  end

  def anchorable(pretty_text, id = nil)
    id ||= pretty_text.parameterize
    "<span id='#{id}' class='anchorable'><a href='##{id}'><span class='glyphicon glyphicon-link'></span></a> #{pretty_text}</span>".html_safe
  end

  WCA_EXCERPT_RADIUS = 50

  def wca_excerpt(html, phrases)
    text = strip_tags(html)
    # Compute the first and last index where query parts appear and use the whole text between them for excerpt.
    search_in_me = ActiveSupport::Inflector.transliterate(text).downcase
    first = phrases.map { |phrase| search_in_me.index(phrase.downcase) }.compact.min
    last = phrases.map do |phrase|
      index = search_in_me.index(phrase.downcase)
      index + phrase.length if index
    end.compact.max
    excerpted = if first # At least one phrase matches the text.
                  excerpt(text, text[first..last], radius: WCA_EXCERPT_RADIUS)
                else
                  # If nothing matches the given phrases, just return the beginning.
                  truncate(text, length: WCA_EXCERPT_RADIUS)
                end
    wca_highlight(excerpted, phrases)
  end

  def wca_highlight(html, phrases)
    Translighterate.highlight(html, phrases, highlighter: '<strong>\1</strong>')
  end

  def wca_omni_search
    text_field_tag nil, @omni_query, placeholder: I18n.t('common.search_site'),
                                     class: "form-control wca-autocomplete wca-autocomplete-omni wca-autocomplete-search wca-autocomplete-only_one wca-autocomplete-users_search wca-autocomplete-persons_table"
  end

  def wca_local_time(time)
    content_tag :span, "", class: "wca-local-time", data: { utc_time: time.in_time_zone.utc.iso8601, locale: I18n.locale }
  end

  def time_format_for_current_locale
    case I18n.t("common.time_format")
    when "12h"
      "%I:%M %p"
    else
      "%H:%M"
    end
  end

  def wca_table(responsive: true, hover: true, striped: true, floatThead: true, table_class: "", data: {}, greedy: true, table_id: nil, &block)
    data[:locale] = I18n.locale
    table_classes = "table table-condensed #{table_class}"
    if floatThead
      table_classes += " floatThead"
    end
    if hover
      table_classes += " table-hover"
    end
    if striped
      table_classes += " table-striped"
    end
    if greedy
      table_classes += " table-greedy-last-column"
    end

    content_tag :div, class: (responsive ? "table-responsive" : "") do
      content_tag :table, id: table_id, class: table_classes, data: data, &block
    end
  end

  def process_nav_items(nav_items)
    nav_items.each do |nav_item|
      nav_item[:children] = nav_item[:children] || []
      nav_item[:tiny_children] = nav_item[:tiny_children] || []
      process_nav_items(nav_item[:children])
      process_nav_items(nav_item[:tiny_children])
      nav_item[:active] = (nav_item[:is_active] && nav_item[:is_active].call) || (nav_item[:path] && current_page?(nav_item[:path])) || nav_item[:children].any? { |i| i[:active] } || nav_item[:tiny_children].any? { |i| i[:active] }
    end
    nav_items
  end

  def wca_date_range(from_date, to_date, **options)
    if from_date && to_date
      options[:separator] = '-'
      date_range(from_date, to_date, **options)
    else
      t "common.date.no_date"
    end
  end

  def alert(type, content = nil, note: false, &block)
    content = capture(&block) if block_given?
    if note
      content = content_tag(:strong, "Note:") + " " + content
    end
    content_tag :div, content, class: "alert alert-#{type}"
  end

  def users_to_sentence(users, include_profile: false)
    "".html_safe + users.sort_by(&:name).map do |user|
      include_profile && user.wca_id ? link_to(ERB::Util.html_escape(user.name), person_path(user.wca_id)) : ERB::Util.html_escape(user.name)
    end.xss_aware_to_sentence
  end

  def year_option_tags(selected_year: nil, exclude_future: true)
    years = [[t('competitions.index.all_years'), 'all years']] + (exclude_future ? Competition.non_future_years : Competition.years)
    options_for_select(years, selected_year)
  end

  def region_option_tags(selected_id: nil, real_only: false, use_world: false)
    regions = {
      t('common.continent') => Continent.all_sorted_by(I18n.locale, real: real_only).map { |continent| [continent.name, continent.id] },
      t('common.country') => Country.all_sorted_by(I18n.locale, real: real_only).map { |country| [country.name, country.id] },
    }

    options_for_select((use_world ? [[t('common.world'), "world"]] : [[t('common.all_regions'), "all"]]), selected_id) + grouped_options_for_select(regions, selected_id)
  end

  def simple_form_for(resource, **options, &)
    super do |f|
      form = capture(f, &)
      error_messages = render('shared/error_messages', f: f)
      error_messages + form
    end
  end

  def horizontal_simple_form_for(resource, **options, &)
    options[:html] ||= {}
    options[:html][:class] ||= ""
    options[:html][:class] += " form-horizontal"
    options[:wrapper] = :horizontal_form
    options[:wrapper_mappings] = {
      check_boxes: :horizontal_radio_and_checkboxes,
      radio_buttons: :horizontal_radio_and_checkboxes,
      file: :horizontal_file_input,
      boolean: :horizontal_boolean,
    }
    simple_form_for(resource, **options, &)
  end

  def duration_to_s(total_seconds)
    hours = (total_seconds / 3600).floor
    minutes = ((total_seconds % 3600)/60).floor
    seconds = total_seconds % 60

    [hours > 0 ? "#{hours}h " : '', minutes > 0 ? "#{minutes}m " : '', format('%.2f', seconds), 's'].join
  end

  def wca_id_link(wca_id, **options)
    if wca_id.present?
      content_tag :span, class: "wca-id" do
        link_to wca_id, person_url(wca_id), options
      end
    end
  end

  def cubing_icon(event, **html_options)
    html_options[:class] ||= ""
    # We use 'icon' which is the default Semantic-UI class for icons.
    # It applies fixed-width and inline block on them.
    html_options[:class] += " cubing-icon icon event-#{event}"
    content_tag :i, "", html_options
  end

  def flag_icon(iso2, **html_options)
    html_options[:class] ||= ""
    html_options[:class] += " fi fi-#{iso2.downcase}"
    content_tag :span, "", html_options
  end

  def ui_icon(name, **html_options)
    opts = html_options.merge(
      class: "icon #{name} " + html_options[:class].to_s,
    )
    content_tag(:i, "", opts)
  end

  def format_money(money)
    "#{humanized_money_with_symbol(money)} (#{money.currency.name})"
  end

  def embedded_map_url(query)
    "#{EnvVars.ROOT_URL}/map?q=#{URI.encode_www_form_component(CGI.unescapeHTML(query))}"
  end

  def add_to_packs(*names)
    @all_packs = capture do
      [@all_packs, *names].compact.join(",")
    end
  end

  def filter_css_packs(*names)
    names.select { |pack| !current_webpacker_instance.manifest.lookup_pack_with_chunks(pack, type: :stylesheet).nil? }
  end

  def add_to_css_assets(name)
    @all_css_assets = capture do
      [@all_css_assets, name].compact.join(",")
    end
  end

  def add_to_js_assets(*names)
    @all_js_assets = capture do
      [@all_js_assets, *names].compact.join(",")
    end
  end

  def add_fullcalendar_to_packs
    add_to_js_assets('fullcalendar/fullcalendar_wca')
    add_to_css_assets('fullcalendar_wca')
    if I18n.locale != :en
      add_to_js_assets("fullcalendar/locales/#{I18n.locale}.js")
    end
  end
end
