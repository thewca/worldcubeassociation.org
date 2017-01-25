# frozen_string_literal: true
class Locale < SimpleDelegator
  include ActionView::Helpers::TextHelper
  SOME_CHARS = '[\s\S]*?'
  COMMENT_LINE_GROUP = '((?:\s*#.*\n)*)'
  KEY_MATCHER = "['\"]?%s['\"]?:"
  HASHTAG = "original_hash: "
  PLURALIZATION_KEYS = %w(zero one two few many other).freeze

  attr_accessor :locale

  def initialize(locale, is_translation=false)
    self.locale = locale.to_s
    filename = Rails.root.join('config', 'locales', "#{locale}.yml")
    file_content = File.read(filename)
    super(YAML.safe_load(file_content))
    if is_translation
      decorate_with_hashes(file_content, self, "")
    end
  end

  def compare_to(base)
    compare_node_resursive(base[base.locale], self[locale], [])
  end

  private

  # Adapted from https://github.com/jonatanklosko/internationalize/blob/7090c90d4d8e4571025c3be4484b5f668cbb6501/client/app/services/translation-utils.service.js#L195-L221
  def decorate_with_hashes(text, node, prefix)
    node.each do |key, value|
      if leaf?(value)
        # We want leaves to have at least "_translated", and maybe later "_hash"
        node[key] = { "_translated" => value }
      else
        text = decorate_with_hashes(text, value, "#{prefix}#{SOME_CHARS}#{KEY_MATCHER % key}")
      end
      regexp = Regexp.new "(#{prefix}#{SOME_CHARS})#{COMMENT_LINE_GROUP}\\s*#{KEY_MATCHER % key}"
      text = text.sub(regexp) do
        # $1 is everything before the comment and the key
        before = $1
        # $2 contains the comments matched before the key
        comments = $2
        unless comments.empty?
          comment_lines = comments.split('#').map(&:strip!)
          if comment_lines
            hash = comment_lines.select(&method(:line_filter)).map(&method(:line_cleaner))
            if hash.size >= 1
              node[key]["_hash"] = hash.first
            end
          end
        end
        # We return the beginning without the key, so that the current hash + key are removed from the text,
        # but the parents and the value stay in.
        before
      end
    end
    text
  end

  def compare_node_resursive(base, translation, context)
    missing_keys = []
    outdated_keys = []
    base.each do |key, value|
      unless translation.key?(key)
        if leaf?(value)
          missing_keys << fully_qualified_name(context, key)
        else
          missing_keys += get_all_recursive(value, [*context, key])
        end
        next
      end
      if leaf?(value)
        # If the key is a pluralization, we use all the subkeys to compute the hash
        # Please see this wiki page explaining why we do this: https://github.com/thewca/worldcubeassociation.org/wikigTranslating-the-website#translations-status-internals
        original_str = pluralization?(value) ? JSON.generate(value) : value
        unless Digest::SHA1.hexdigest(original_str)[0..6] == translation[key]["_hash"]
          outdated_keys << fully_qualified_name(context, key)
        end
      else
        missing, outdated = compare_node_resursive(value, translation[key], [*context, key])
        missing_keys += missing
        outdated_keys += outdated
      end
    end
    [missing_keys, outdated_keys]
  end

  def get_all_recursive(node, context)
    leaves = []
    node.each do |key, value|
      if leaf?(value)
        leaves << fully_qualified_name(context, key)
      else
        leaves += get_all_recursive(value, [*context, key])
      end
    end
    leaves
  end

  def fully_qualified_name(context, key)
    # Some keys are actually numbers
    key = key.to_s
    # Some keys are too long and would overflow from the list-item, truncate it to an arbitrary length
    (context + [truncate(key, length: 20)]).join(" > ")
  end

  def line_filter(line)
    line&.start_with?(HASHTAG)
  end

  def line_cleaner(line)
    line.sub(HASHTAG, '')
  end

  def leaf?(node)
    # If the node is a pluralization it's also a leaf!
    node.is_a?(String) || pluralization?(node)
  end

  def pluralization?(node)
    node.is_a?(Hash) && (node.keys & PLURALIZATION_KEYS).any?
  end
end
