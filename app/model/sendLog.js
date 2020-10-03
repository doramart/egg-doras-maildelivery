const moment = require('moment');
module.exports = app => {
    const {
        DATE,
        STRING,
        BOOLEAN,
        INTEGER,
        VIRTUAL
    } = app.Sequelize;
    const SendLog = app.model.define('send_log', {
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
        // recipientEmail: STRING, // 接收者邮箱
        task_id: INTEGER, // 任务id
        state: {
            type: STRING,
            defaultValue: '0' // 0：发送失败  1：发送成功
        },
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
        tableName: 'doracms_send_log',
        underscored: true,
    });

    SendLog.associate = function () {


        app.model.SendLog.belongsToMany(app.model.User, {
            through: app.model.SendUser,
            foreignKey: 'log_id',
            otherKey: 'user_id',
            as: 'recipient'
        });

        app.model.SendLog.belongsTo(app.model.MailDelivery, {
            foreignKey: 'task_id',
            as: 'taskId'
        });
    }

    SendLog.sync({
        force: false
    });

    return SendLog;
};
