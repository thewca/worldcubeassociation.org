# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InvoiceItem do
 describe "validations" do
    let(:registration) { FactoryBot.build_stubbed(:registration) }

    describe "consistent_currency_code" do
      context "when creating the first invoice item for a registration" do
        it "is valid with any currency code" do
          invoice_item = FactoryBot.create(:invoice_item, :entry, custom_registration: registration, currency_code: "USD")
          expect(invoice_item).to be_valid
        end

        it "can change its currency code after being created" do
          invoice_item = FactoryBot.create(:invoice_item, :entry, custom_registration: registration, currency_code: "USD")
          invoice_item.update(currency_code: "EUR")
          expect(invoice_item).to be_valid
        end
      end

      context "when adding subsequent invoice items" do
        let!(:existing_item) { FactoryBot.create(:invoice_item, :entry, registration: registration) }

        it "is valid when currency code matches existing items" do
          invoice_item = FactoryBot.build(:invoice_item, :entry, registration: registration)
          expect(invoice_item).to be_valid
        end

        it "is invalid when currency code differs from existing items" do
          invoice_item = FactoryBot.build(:invoice_item, registration: registration, currency_code: "EUR")
          expect(invoice_item).to be_invalid
          expect(invoice_item.errors[:currency_code]).to include("must be USD to match existing items in this registration")
        end

        it "ignores itself when validating existing records" do
          invoice_item = FactoryBot.create(:invoice_item, registration: registration, currency_code: "USD")

          # Modify the same record and ensure it remains valid
          invoice_item.display_name = "Updated display name"
          expect(invoice_item).to be_valid
        end
      end
    end

    describe "monetized attributes" do
      let(:item) { FactoryBot.create(:invoice_item, :entry, registration: registration) }

      it "monetizes amount_lowest_denomination" do
        expect(item.amount).to be_a Money
        expect(item.amount.format).to eq "$10.00"
      end

      it "disallows nil values" do
        item.amount_lowest_denomination = nil
        expect(item).not_to be_valid
      end

      it "uses the correct currency" do
        expect(item.amount.currency.iso_code).to eq "USD"
      end
    end
  end

  describe "update status after payment" do
    let(:registration) { FactoryBot.create(:registration)} # Registration automatically creates invoice_item for entry

    context 'when payment matches invoice total' do
      it 'marks a single invoice_item as paid' do
        FactoryBot.create(:registration_payment, registration: registration)
        expect(registration.invoice_items.first.status).to eq('paid')
      end

      it 'updates all invoice_items to paid if invoice fully paid' do
        FactoryBot.create(:invoice_item, custom_registration: registration, display_name: "arbitrary payment", amount_lowest_denomination: 350)
        FactoryBot.create(:registration_payment, registration: registration, amount_lowest_denomination: registration.invoice_items_total)
        registration.invoice_items.each { |i| expect(i.status).to eq('paid') }
      end
    end

    context 'when payment is less than invoice total' do
      it 'single invoice item remains unpaid' do
        FactoryBot.create(:registration_payment, registration: registration, amount_lowest_denomination: 100)
        expect(registration.invoice_items.first.status).to eq('unpaid')
      end

      it 'all invoice_items remain unpaid' do
        FactoryBot.create(:invoice_item, custom_registration: registration, display_name: "arbitrary payment", amount_lowest_denomination: 350)
        FactoryBot.create(:registration_payment, registration: registration, amount_lowest_denomination: registration.invoice_items_total-100)
        registration.invoice_items.each { |i| expect(i.status).to eq('unpaid') }
      end
    end

    context 'when payment is greater than invoice total' do
      it 'single invoice item remains unpaid' do
        FactoryBot.create(:registration_payment, registration: registration, amount_lowest_denomination: 10000)
        expect(registration.invoice_items.first.status).to eq('unpaid')
      end

      it 'all invoice_items remain unpaid' do
        FactoryBot.create(:invoice_item, custom_registration: registration, display_name: "arbitrary payment", amount_lowest_denomination: 350)
        FactoryBot.create(:registration_payment, registration: registration, amount_lowest_denomination: registration.invoice_items_total+100)
        registration.invoice_items.each { |i| expect(i.status).to eq('unpaid') }
      end
    end
  end
end


