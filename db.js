//simple json db
const dotProp = require('dot-prop');
const fs = require('fs-extra');
const path = require('path');
const merge = require('deepmerge');
class JsonDb {
  constructor(filename) {
    this.dbfile = path.resolve(__dirname, `.${filename}/db.json`);
    this.jsonCache = {};
    this._dbinit();
  }
  _dbinit() {
    const exists = fs.pathExistsSync(this.dbfile);
    if (!exists) {
      fs.outputJsonSync(this.dbfile, {})
    } else {
      this.jsonCache = fs.readJsonSync(this.dbfile);
    }
  }
  async _addJson(json) {
    this.jsonCache = merge(this.jsonCache, json);
    await fs.outputJson(this.dbfile, this.jsonCache);
  }
  async addCollection(name) {
    if(!dotProp.has(this.jsonCache,name)){
      await this._addJson({ [name]: {} })
    }
  }
  getData(collection, props) {
    return dotProp.get(this.jsonCache, `${collection}.${props}`);
  }
  async setData(collection, props, val) {
    await this._addJson(dotProp.set(this.jsonCache, `${collection}.${props}`, val));
  }
}
module.exports = JsonDb;