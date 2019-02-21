const slackPost = require('slackpost');
function getNotifier(walletName) {
  const updateNotifier = slackPost.post(
    process.env.SLACK,
    'Wallet Updater'
  )

  updateNotifier.setUsername(`${walletName ? walletName.toUpperCase() : ''} Wallet Updater`)
    .setColor(slackPost.COLOR_LIST.WARNING)
    .setIconURL(`https://www.bitsler.com/img/img-${walletName}.png`)
  return updateNotifier;
}
module.exports.notify = function(wallet, repo, version, updateCmd, dockerImage) {
  const notifier = getNotifier(wallet)
  notifier.setTitle(`${wallet.toUpperCase()} ${version} Wallet Update`);
  notifier.setRichText(`<!channel> Update the wallet container image to *${dockerImage}:${version}*
  To update please run \`${updateCmd} ${version}\``, true);
  notifier.setFooter(dockerImage, parseInt(new Date() / 1000), repo);
  notifier.send((err) => {
    if (err) {
      console.dir(err);
    }
  })
}
module.exports.sendMessage = function(msg) {
  const notifier = getNotifier()
  notifier.setTitle(msg)
  notifier.send((err) => {
    if (err) {
      console.dir(err);
    }
  })
}
