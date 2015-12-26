module.exports = {
  'Free tickets': function(browser) {
    const TIMEOUT = 200;
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('.show-selector', TIMEOUT)
      .click('.show-selector a')
      .waitForElementVisible('.seat-selector', TIMEOUT)
      .click('a.seat-free')
      .waitForElementVisible('.shopping-cart', TIMEOUT)
      .click('button#reserveTickets')
      .waitForElementVisible('.contact-input', TIMEOUT)
      .setValue('input[label=Nimi]', 'testi nimi')
      .setValue('input[label=Sähköposti]', 'testi@example.local')
      .setValue('input[label=Alennuskoodi]', 'admin-code')
      .click('button#saveOrderInfo')
      .waitForElementVisible('.final-confirmation', TIMEOUT)
      .click('button#proceedToPayment')
      .pause(TIMEOUT)
      .assert.containsText('.alert', 'Tilaus onnistui!')
      .end();
  }
};
