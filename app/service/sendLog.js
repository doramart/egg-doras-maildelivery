/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-15 09:51:27
 */

'use strict';
const Service = require('egg').Service;
const path = require('path')

// general是一个公共库，可用可不用
const {
    _list,
    _item,
    _count,
    _create,
    _update,
    _removes,
    _removeAll
} = require(path.join(process.cwd(), 'app/service/general'));


class SendLogService extends Service {

    async find(payload, {
        query = {},
        searchKeys = [],
        include = [],
        attributes = null,
        sort = {}
    } = {}) {

        let listdata = _list(this, this.ctx.model.SendLog, payload, {
            query: query,
            searchKeys: searchKeys,
            include: include,
            attributes,
            sort
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(this, this.ctx.model.SendLog, params);
    }

    async create(payload) {
        return _create(this, this.ctx.model.SendLog, payload);
    }

    async removes(values, key = 'id') {
        return _removes(this, this.ctx.model.SendLog, values, key);
    }

    async removeAll() {
        return _removeAll(this, this.ctx.model.SendLog);
    }

    async update(id, payload) {
        return _update(this, this.ctx.model.SendLog, id, payload);
    }

    async item(params = {}) {
        return _item(this, this.ctx.model.SendLog, params)
    }


}

module.exports = SendLogService;