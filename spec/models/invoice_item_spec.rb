# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InvoiceItem do
  describe "validations" do
    describe "consistent_currency_code" do
      context "when creating the first invoice item for a registration" do
        it "is valid with any currency code" do
          invoice_item = create(:invoice_item, :entry, currency_code: "USD")
          expect(invoice_item).to be_valid
        end

        it "can change its currency code after being created" do
          invoice_item = create(:invoice_item, :entry, currency_code: "USD")
          invoice_item.update(currency_code: "EUR")
          expect(invoice_item).to be_valid
        end
      end

      context "when adding subsequent invoice items" do
        let!(:existing_item) { create(:invoice_item, :entry) }

        it "is valid when currency code matches existing items" do
          invoice_item = build(:invoice_item, :entry, registration: existing_item.registration)
          expect(invoice_item).to be_valid
        end

        it "is invalid when currency code differs from existing items" do
          invoice_item = build(:invoice_item, currency_code: "EUR", registration: existing_item.registration)
          expect(invoice_item).to be_invalid
          expect(invoice_item.errors[:currency_code]).to include("must be USD to match existing items in this registration")
        end

        it "ignores itself when validating existing records" do
          invoice_item = create(:invoice_item, currency_code: "USD", registration: existing_item.registration)

          # Modify the same record and ensure it remains valid
          invoice_item.display_name = "Updated display name"
          expect(invoice_item).to be_valid
        end
      end
    end

    describe "monetized attributes" do
      let(:item) { create(:invoice_item, :entry) }

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
    let!(:registration) { create(:registration, :invoice_item) }

    context 'when payment matches invoice total' do
      it 'marks a single invoice_item as paid' do
        create(:registration_payment, registration: registration)
        expect(registration.invoice_items.first.status).to eq('paid')
      end

      it 'updates all invoice_items to paid if invoice fully paid' do
        create(:invoice_item, display_name: "arbitrary payment", amount_lowest_denomination: 350, registration: registration)
        create(:registration_payment, registration: registration, amount_lowest_denomination: registration.invoice_items_total.cents)
        registration.reload.invoice_items.each { |i| expect(i.status).to eq('paid') }
      end
    end

    context 'when payment is less than invoice total' do
      it 'single invoice item remains unpaid' do
        create(:registration_payment, registration: registration, amount_lowest_denomination: 100)
        expect(registration.invoice_items.first.status).to eq('unpaid')
      end

      it 'all invoice_items remain unpaid' do
        create(:invoice_item, display_name: "arbitrary payment", amount_lowest_denomination: 350, registration: registration)
        create(:registration_payment, registration: registration, amount_lowest_denomination: registration.invoice_items_total.cents - 100)
        registration.invoice_items.each { |i| expect(i.status).to eq('unpaid') }
      end
    end

    context 'when payment is greater than invoice total' do
      # For now, we dont have apportionment logic implemented - so we take the most conservative approach, of not marking the invoice_item paid
      # even if the payment amount exceeds the invoice_item total_amount - because this should not be possible in the first place
      # In future, we will introduce payment apportionment logic that handles this case
      it 'single invoice item remains unpaid' do
        create(:registration_payment, registration: registration, amount_lowest_denomination: 10_000)
        expect(registration.invoice_items.first.status).to eq('unpaid')
      end

      it 'all invoice_items remain unpaid' do
        create(:invoice_item, display_name: "arbitrary payment", amount_lowest_denomination: 350, registration: registration)
        create(:registration_payment, registration: registration, amount_lowest_denomination: registration.invoice_items_total.cents + 100)
        registration.invoice_items.each { |i| expect(i.status).to eq('unpaid') }
      end
    end
  end
end
