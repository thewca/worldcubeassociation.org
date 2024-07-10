# frozen_string_literal: true

RSpec.describe 'Array.xss_aware_to_sentence' do
  let(:safe_str) { '>'.html_safe }

  it 'has 0 elements' do
    expect(''.html_safe + ([safe_str] * 0).xss_aware_to_sentence).to eq ''
  end

  it 'has 1 element' do
    expect(''.html_safe + ([safe_str] * 1).xss_aware_to_sentence).to eq '>'
  end

  it 'has 2 elements' do
    expect(''.html_safe + ([safe_str] * 2).xss_aware_to_sentence).to eq '> and >'
  end

  it 'has 3 elements' do
    expect(''.html_safe + ([safe_str] * 3).xss_aware_to_sentence).to eq '>, >, and >'
  end
end
