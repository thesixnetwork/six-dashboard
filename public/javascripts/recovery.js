function recovery() {
  let mnemonic = [
    document.getElementById('1word').value,
    document.getElementById('2word').value,
    document.getElementById('3word').value,
    document.getElementById('4word').value,
    document.getElementById('5word').value,
    document.getElementById('6word').value,
    document.getElementById('7word').value,
    document.getElementById('8word').value,
    document.getElementById('9word').value,
    document.getElementById('10word').value,
    document.getElementById('11word').value,
    document.getElementById('12word').value,
  ].join(' ');
  if (StellarHDWallet.validateMnemonic(mnemonic)) {
    let generatedWallet = StellarHDWallet.fromMnemonic(mnemonic);
    let data = `Public Key :
   ${generatedWallet.getPublicKey(0)}
Secret Key :
   ${generatedWallet.getSecret(0)}`;

    var doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(data, 10, 10);
    doc.save('six_stellar_wallet_credentials.pdf');
    if ($('#sampleFader').css('display') !== 'block') {
      $('#alertHead').html('Success')
      $('#alertSub').html('Your public key and secret key is downloading.')
      $('#sampleFader').fadeToggle();
    }
  } else {
    if ($('#sampleFader').css('display') !== 'block') {
      $('#alertHead').html('Error')
      $('#alertSub').html('Incorrect Recovery words, Please recheck')
      $('#sampleFader').fadeToggle();
    }
  }
}

function closeSample() {
  if ($('#sampleFader').css('display') !== 'none') {
    $('#sampleFader').fadeToggle();
  }
}
