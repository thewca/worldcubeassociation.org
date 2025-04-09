# frozen_string_literal: true

module StripeHelper
  def stub_successful_stripe_payment_intent(amount, currency, email)
    stub_request(:post, "https://api.stripe.com/v1/payment_intents")
      .to_return(
        status: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: {
          id: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
          object: "payment_intent",
          amount: amount,
          amount_capturable: 0,
          amount_details: {
            tip: {},
          },
          amount_received: 0,
          application: nil,
          application_fee_amount: nil,
          automatic_payment_methods: {
            enabled: true,
          },
          canceled_at: nil,
          cancellation_reason: nil,
          capture_method: "automatic",
          client_secret: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH",
          confirmation_method: "automatic",
          created: 1_680_800_504,
          currency: currency,
          customer: nil,
          description: nil,
          invoice: nil,
          last_payment_error: nil,
          latest_charge: nil,
          livemode: false,
          metadata: {},
          next_action: nil,
          on_behalf_of: nil,
          payment_method: nil,
          payment_method_options: {
            card: {
              installments: nil,
              mandate_options: nil,
              network: nil,
              request_three_d_secure: "automatic",
            },
            link: {
              persistent_token: nil,
            },
          },
          payment_method_types: [
            "card",
            "link",
          ],
          processing: nil,
          receipt_email: email,
          review: nil,
          setup_future_usage: nil,
          shipping: nil,
          source: nil,
          statement_descriptor: nil,
          statement_descriptor_suffix: nil,
          status: "requires_payment_method",
          transfer_data: nil,
          transfer_group: nil,
        }.to_json,
      )
  end

  def stub_stripe_pi_confirmation(amount, currency, email)
    stub_request(:post, %r{https://api.stripe.com/v1/payment_intents/.*/confirm})
      .to_return(
        status: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: {
          id: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
          object: "payment_intent",
          amount: amount,
          amount_capturable: 0,
          amount_details: {
            tip: {}
          },
          amount_received: amount,
          application: nil,
          application_fee_amount: nil,
          automatic_payment_methods: {
            enabled: true
          },
          canceled_at: nil,
          cancellation_reason: nil,
          capture_method: "automatic",
          client_secret: "pi_3MtweELkdIwHu7ix0Dt0gF2H_secret_ALlpPMIZse0ac8YzPxkMkFgGC",
          confirmation_method: "automatic",
          created: 1680802258,
          currency: currency,
          customer: nil,
          description: nil,
          invoice: nil,
          last_payment_error: nil,
          latest_charge: "ch_3MtweELkdIwHu7ix05lnLAFd",
          livemode: false,
          metadata: {},
          next_action: nil,
          on_behalf_of: nil,
          payment_method: "pm_1MtweELkdIwHu7ixxrsejPtG",
          payment_method_options: {
            card: {
              installments: nil,
              mandate_options: nil,
              network: nil,
              request_three_d_secure: "automatic"
            },
            link: {
              persistent_token: nil
            }
          },
          payment_method_types: ["card", "link"],
          processing: nil,
          receipt_email: email,
          review: nil,
          setup_future_usage: nil,
          shipping: nil,
          source: nil,
          statement_descriptor: nil,
          statement_descriptor_suffix: nil,
          status: "succeeded",
          transfer_data: nil,
          transfer_group: nil
        }.to_json
      )
  end

  def stub_stripe_pi_retrieval(amount, currency, email)
    stub_request(:get, %r{https://api.stripe.com/v1/payment_intents/.*})
      .to_return(
        status: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: {
          id: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
          object: "payment_intent",
          amount: amount,
          amount_capturable: 0,
          amount_details: {
            tip: {}
          },
          amount_received: amount,
          application: nil,
          application_fee_amount: nil,
          automatic_payment_methods: {
            enabled: true
          },
          canceled_at: nil,
          cancellation_reason: nil,
          capture_method: "automatic",
          client_secret: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH",
          confirmation_method: "automatic",
          created: 1680800504,
          currency: 'usd',
          customer: nil,
          description: nil,
          invoice: nil,
          last_payment_error: nil,
          latest_charge: nil,
          livemode: false,
          metadata: {},
          next_action: nil,
          on_behalf_of: nil,
          payment_method: nil,
          payment_method_options: {
            card: {
              installments: nil,
              mandate_options: nil,
              network: nil,
              request_three_d_secure: "automatic"
            },
            link: {
              persistent_token: nil
            }
          },
          payment_method_types: ["card", "link"],
          processing: nil,
          receipt_email: email,
          review: nil,
          setup_future_usage: nil,
          shipping: nil,
          source: nil,
          statement_descriptor: nil,
          statement_descriptor_suffix: nil,
          status: "succeeded",
          transfer_data: nil,
          transfer_group: nil
        }.to_json
      )
  end

  def stub_charges_retrieval(amount, currency, email)
    stub_request(:get, %r{https://api.stripe.com/v1/charges\?payment_intent=.*})
      .to_return(
        status: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: {
          object: "list",
          url: "/v1/charges",
          has_more: false,
          data: [
            {
              id: "ch_3MmlLrLkdIwHu7ix0snN0B15",
              object: "charge",
              amount: amount,
              amount_captured: amount,
              amount_refunded: 0,
              application: nil,
              application_fee: nil,
              application_fee_amount: nil,
              balance_transaction: "txn_3MmlLrLkdIwHu7ix0uke3Ezy",
              billing_details: {
                address: {
                  city: nil,
                  country: nil,
                  line1: nil,
                  line2: nil,
                  postal_code: nil,
                  state: nil
                },
                email: nil,
                name: nil,
                phone: nil
              },
              calculated_statement_descriptor: "Stripe",
              captured: true,
              created: 1679090539,
              currency: currency,
              customer: nil,
              description: nil,
              disputed: false,
              failure_balance_transaction: nil,
              failure_code: nil,
              failure_message: nil,
              fraud_details: {},
              invoice: nil,
              livemode: false,
              metadata: {},
              on_behalf_of: nil,
              outcome: {
                network_status: "approved_by_network",
                reason: nil,
                risk_level: "normal",
                risk_score: 32,
                seller_message: "Payment complete.",
                type: "authorized"
              },
              paid: true,
              payment_intent: nil,
              payment_method: "card_1MmlLrLkdIwHu7ixIJwEWSNR",
              payment_method_details: {
                card: {
                  brand: "visa",
                  checks: {
                    address_line1_check: nil,
                    address_postal_code_check: nil,
                    cvc_check: nil
                  },
                  country: "US",
                  exp_month: 3,
                  exp_year: 2024,
                  fingerprint: "mToisGZ01V71BCos",
                  funding: "credit",
                  installments: nil,
                  last4: "4242",
                  mandate: nil,
                  network: "visa",
                  three_d_secure: nil,
                  wallet: nil
                },
                type: "card"
              },
              receipt_email: email,
              receipt_number: nil,
              receipt_url: "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTTJKVGtMa2RJd0h1N2l4KOvG06AGMgZfBXyr1aw6LBa9vaaSRWU96d8qBwz9z2J_CObiV_H2-e8RezSK_sw0KISesp4czsOUlVKY",
              refunded: false,
              review: nil,
              shipping: nil,
              source_transfer: nil,
              statement_descriptor: nil,
              statement_descriptor_suffix: nil,
              status: "succeeded",
              transfer_data: nil,
              transfer_group: nil
            }
          ]
        }.to_json
      )
  end

  def stub_charge_retrieval(amount, currency, email)
    stub_request(:get, %r{https://api.stripe.com/v1/charges/.*})
      .to_return(
        status: 200,
        headers: { 'Content-Type' => 'application/json' },
        body: {
          "id" => "ch_3MmlLrLkdIwHu7ix0snN0B15",
          "object" => "charge",
          "amount" => amount,
          "amount_captured" => amount,
          "amount_refunded" => 0,
          "application" => nil,
          "application_fee" => nil,
          "application_fee_amount" => nil,
          "balance_transaction" => "txn_3MmlLrLkdIwHu7ix0uke3Ezy",
          "billing_details" => {
            "address" => {
              "city" => nil,
              "country" => nil,
              "line1" => nil,
              "line2" => nil,
              "postal_code" => nil,
              "state" => nil
            },
            "email" => nil,
            "name" => nil,
            "phone" => nil
          },
          "calculated_statement_descriptor" => "Stripe",
          "captured" => true,
          "created" => 1679090539,
          "currency" => currency,
          "customer" => nil,
          "description" => nil,
          "disputed" => false,
          "failure_balance_transaction" => nil,
          "failure_code" => nil,
          "failure_message" => nil,
          "fraud_details" => {},
          "invoice" => nil,
          "livemode" => false,
          "metadata" => {},
          "on_behalf_of" => nil,
          "outcome" => {
            "network_status" => "approved_by_network",
            "reason" => nil,
            "risk_level" => "normal",
            "risk_score" => 32,
            "seller_message" => "Payment complete.",
            "type" => "authorized"
          },
          "paid" => true,
          "payment_intent" => nil,
          "payment_method" => "card_1MmlLrLkdIwHu7ixIJwEWSNR",
          "payment_method_details" => {
            "card" => {
              "brand" => "visa",
              "checks" => {
                "address_line1_check" => nil,
                "address_postal_code_check" => nil,
                "cvc_check" => nil
              },
              "country" => "US",
              "exp_month" => 3,
              "exp_year" => 2024,
              "fingerprint" => "mToisGZ01V71BCos",
              "funding" => "credit",
              "installments" => nil,
              "last4" => "4242",
              "mandate" => nil,
              "network" => "visa",
              "three_d_secure" => nil,
              "wallet" => nil
            },
            "type" => "card"
          },
          "receipt_email" => email,
          "receipt_number" => nil,
          "receipt_url" => "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTTJKVGtMa2RJd0h1N2l4KOvG06AGMgZfBXyr1aw6LBa9vaaSRWU96d8qBwz9z2J_CObiV_H2-e8RezSK_sw0KISesp4czsOUlVKY",
          "refunded" => false,
          "review" => nil,
          "shipping" => nil,
          "source_transfer" => nil,
          "statement_descriptor" => nil,
          "statement_descriptor_suffix" => nil,
          "status" => "succeeded",
          "transfer_data" => nil,
          "transfer_group" => nil
        }.to_json
    )
  end
end
