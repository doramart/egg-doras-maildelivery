const moment = require('moment');
module.exports = app => {
    const {
        DATE,
        STRING,
        BOOLEAN,
        INTEGER,
        VIRTUAL,
        TEXT
    } = app.Sequelize;
    const MailDelivery = app.model.define('mail_delivery', {
        id: {
            type: INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        _id: {
            type: VIRTUAL,
            get() {
                return this.id;
            },
            set(value) {
                throw new Error('not set!');
            }
        },
        sender_id: INTEGER, //创建者 
        email_type: INTEGER,
        state: {
            type: STRING,
            default: "0" // 0：待发送 1：未完成  2：发送成功
        }, // 状态 
        timing: DATE, // 定时
        comments: TEXT('long'), //邮件内容
        task_type: {
            type: STRING,
            default: "0" // 任务类型  0:立即，1：定时
        }, // 状态 
        targetType: STRING, //发送对象类型 0:全部 1:指定

        createdAt: {
            type: DATE,
            get() {
                return moment(this.getDataValue('createdAt')).format('YYYY-MM-DD HH:mm:ss');
            }
        },
        updatedAt: {
            type: DATE,
            get() {
                return moment(this.getDataValue('updatedAt')).format('YYYY-MM-DD HH:mm:ss');
            }
        }
    }, {
        freezeTableName: true,
        tableName: 'doracms_mail_delivery',
        underscored: true,
    });

    MailDelivery.associate = function () {


        app.model.MailDelivery.belongsTo(app.model.MailTemplate, {
            foreignKey: 'email_type',
            as: 'emailType'
        });

        app.model.MailDelivery.belongsTo(app.model.AdminUser, {
            foreignKey: 'sender_id',
            as: 'sender'
        });

        // 准备发送的人
        app.model.SendLog.belongsToMany(app.model.User, {
            through: app.model.MailUser,
            foreignKey: 'task_id',
            otherKey: 'user_id',
            as: 'targets'
        });
    }

    MailDelivery.sync({
        force: false
    });

    return MailDelivery;
};