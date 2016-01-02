const TIMEOUT = 500;

module.exports = {
  'Basic flow': function(browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('.show-selector', TIMEOUT)
      .click('.show-selector a')
      .waitForElementVisible('.theaterLayout', TIMEOUT)
      .click('a.seat-free')
      .waitForElementVisible('.shopping-cart', TIMEOUT)
      .click('button#reserveTickets')
      .waitForElementVisible('.contact-input', TIMEOUT)
      .setValue('input[label=Nimi]', 'testi nimi')
      .setValue('input[label=Sähköposti]', 'testi@example.local')
      .click('button#saveOrderInfo')
      .waitForElementVisible('.final-confirmation', TIMEOUT)
      .assert.elementPresent('.final-confirmation table')
      .assert.containsText('.final-confirmation table tr:nth-child(1) td:nth-child(2)', '18 eur')
      .assert.containsText('.final-confirmation table tr:nth-child(2) td:nth-child(2)', '18 eur')
      .click('button#proceedToPayment')
      .waitForElementVisible('#payment-amount', 5000) // paytrail is slow
      .assert.urlContains('https://payment.paytrail.com/')
      .assert.containsText('#payment-amount', '18,00 €')
      .end();
  },

  'Basic flow - unnumbered seats': function(browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('.show-selector', TIMEOUT)
      .click('.show-selector ul li:nth-child(4) a')
      .waitForElementVisible('.seat-selector button', TIMEOUT)
      .click('.seat-selector button')
      .click('.seat-selector button')
      .waitForElementVisible('.shopping-cart', TIMEOUT)
      .click('button#reserveTickets')
      .waitForElementVisible('.contact-input', TIMEOUT)
      .setValue('input[label=Nimi]', 'testi nimi')
      .setValue('input[label=Sähköposti]', 'testi@example.local')
      .click('button#saveOrderInfo')
      .waitForElementVisible('.final-confirmation', TIMEOUT)
      .assert.elementPresent('.final-confirmation table')
      .assert.containsText('.final-confirmation table tr:nth-child(1) td:nth-child(2)', '28 eur')
      .assert.containsText('.final-confirmation table tr:nth-child(2) td:nth-child(2)', '28 eur')
      .click('button#proceedToPayment')
      .waitForElementVisible('#payment-amount', 5000) // paytrail is slow
      .assert.urlContains('https://payment.paytrail.com/')
      .assert.containsText('#payment-amount', '28,00 €')
      .end();
  },

  'Free tickets': function(browser) {
    const discountCode = 'admin-code';

    browser
      .url('http://localhost:3000')
      .waitForElementVisible('.show-selector', TIMEOUT)
      .click('.show-selector a')
      .waitForElementVisible('.theaterLayout', TIMEOUT)
      .click('a.seat-free')
      .waitForElementVisible('.shopping-cart', TIMEOUT)
      .click('button#reserveTickets')
      .waitForElementVisible('.contact-input', TIMEOUT)
      .setValue('input[label=Nimi]', 'testi nimi')
      .setValue('input[label=Sähköposti]', '@')
      .setValue('input[label=Alennuskoodi]', discountCode)
      .click('button#saveOrderInfo')
      .waitForElementVisible('.final-confirmation', TIMEOUT)
      .assert.elementPresent('.final-confirmation table')
      .assert.containsText('.final-confirmation table tr:nth-child(1) td:nth-child(2)', '18 eur')
      .assert.containsText('.final-confirmation table tr:nth-child(2) td:nth-child(1)', discountCode)
      .assert.containsText('.final-confirmation table tr:nth-child(2) td:nth-child(2)', '-18 eur')
      .assert.containsText('.final-confirmation table tr:nth-child(3) td:nth-child(2)', '0 eur')
      .click('button#proceedToPayment')
      .pause(TIMEOUT)
      .assert.containsText('.alert', 'Tilaus onnistui!')
      .end();
  }
};
