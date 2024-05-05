# frozen_string_literal: true

Money.locale_backend = :i18n

eu_bank = EuCentralBank.new
Money.default_bank = eu_bank
Money.default_currency = Money::Currency.new("USD")
Money.rounding_mode = BigDecimal::ROUND_HALF_UP
