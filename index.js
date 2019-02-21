require('dotenv').config();
const config = require('./config.json');
const Db = require('./db');
const { exec } = require('@tunnckocore/execa');
const ghGot = require('gh-got');
const compareVersions = require("compare-versions");
const fs = require('fs-extra');
const dockerBuild = require('./dockerBuilder');
const path = require('path');
const slack = require('./slack');
const db = new Db('wallets');
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
async function startCheck() {
  slack.start();
  for (const wallets of config.wallets) {
    await db.addCollection(wallets.name);
    await fs.ensureDir(path.resolve(process.env.HOME, 'wallets'));
    const repoPath = path.resolve(process.env.HOME, wallets.folder_path);
    const repoExists = await fs.pathExists(repoPath);
    if (!repoExists) {
      await exec(`git clone ${wallets.repository}`, { stdio: 'inherit', cwd: path.resolve(process.env.HOME, 'wallets') })
    } else {
      await exec('git pull origin master', { stdio: 'inherit', cwd: repoPath })
    }
    await exec(`docker image prune -a -f`);
    const { body } = await ghGot(`repos/${wallets.base_repository}/releases${wallets.options.latest ? '/latest' : ''}`);
    if (wallets.options.builds) {
      const wBuild = wallets.options.builds;
      const buildTasks = [];
      for (const build of body) {
        if (build.name.includes(wBuild)) {
          const currVersion = db.getData(wallets.name, 'version') || 'v0.0.0';
          if (compareVersions(currVersion, build.tag_name) === -1) {
            await db.setData(wallets.name, 'version', build.tag_name);
            buildTasks.push(dockerBuild(wallets, repoPath, build.tag_name))
          }
          break;
        }
      }
      const o = await Promise.all(buildTasks);
      for (const res of o) {
        console.log(`${res.name}: Updated to ${res.tag}`)
        slack.notify(res.name,res.repo, res.tag, res.cmd, res.image);
      }
    }
  }
  await delay(config.interval) // 30 minutes
}

startCheck().catch(console.error)