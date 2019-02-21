const { exec } = require('@tunnckocore/execa');

async function build(walletObj, repoPath, tag) {
  const imageTag = `${walletObj.docker_image}:${tag}`
  await exec([
    `docker build -t ${imageTag} --build-arg version=${tag} .`,
    `docker push ${imageTag}`], { stdout: 'inherit', stderr: 'ignore', cwd: repoPath });
  return { name: walletObj.name, tag, repo: walletObj.repository, image: walletObj.docker_image, cmd: walletObj.update_cmd }
}
module.exports = build;