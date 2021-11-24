# frozen_string_literal: true

Money.locale_backend = :i18n

eu_bank = EuCentralBank.new
eu_bank.update_rates
Money.default_bank = eu_bank
