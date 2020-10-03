/*
 * @Author: doramart 
 * @Date: 2020-08-16 15:32:43 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-25 19:17:36
 */
const moment = require('moment');
module.exports = app => {
  const {
    INTEGER,
    ENUM
  } = app.Sequelize;
  const SendUser = app.model.define('send_user', {

    log_id: {
      type: INTEGER,
      primaryKey: true
    },
    user_id: {
      type: INTEGER,
      primaryKey: true
    },
  }, {
    freezeTableName: true,
    tableName: 'doracms_send_user',
    indexs: [{
      fields: ['log_id', 'user_id'],
      unique: true,
    }],
  });

  SendUser.associate = function () {


  }

  SendUser.sync({
    force: false
  });

  return SendUser;
};