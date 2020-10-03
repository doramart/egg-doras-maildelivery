/*
 * @Author: doramart 
 * @Date: 2020-08-16 15:32:43 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-25 19:34:50
 */
const moment = require('moment');
module.exports = app => {
  const {
    INTEGER,
    ENUM
  } = app.Sequelize;
  const MailUser = app.model.define('mail_user', {

    task_id: {
      type: INTEGER,
      primaryKey: true
    },
    user_id: {
      type: INTEGER,
      primaryKey: true
    },
  }, {
    freezeTableName: true,
    tableName: 'doracms_mail_user',
    indexs: [{
      fields: ['task_id', 'user_id'],
      unique: true,
    }],
  });

  MailUser.associate = function () {


  }

  MailUser.sync({
    force: false
  });

  return MailUser;
};