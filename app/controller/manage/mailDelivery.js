const xss = require("xss");
const _ = require('lodash');
const schedule = require('node-schedule');

const mailDeliveryRule = (ctx) => {
    return {

        email_type: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("邮件类型")])
        },


        timing: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("定时")])
        },


        comments: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("备注")])
        },


        task_type: {
            type: "string",
            required: true,
            message: ctx.__("validate_error_field", [ctx.__("任务类型")])
        },


    }
}


const sendEmailByTask = async (ctx, taskId, emailInfo, targetUserInfo) => {
    try {

        let {
            allEmailArr,
            allUserIdArr
        } = targetUserInfo;

        for (let j = 0; j < allEmailArr.length; j++) {
            const emailArr = allEmailArr[j];
            const sendEmailDo = () => {
                return new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        let sendResult = await ctx.helper.reqJsonData('mailTemplate/sendEmail', {
                            tempkey: "-1", // -1特指邮件群发
                            info: {
                                title: emailInfo.comments,
                                targets: emailArr.join(','),
                                content: emailInfo.content,
                            }
                        }, "post");

                        let logResult = await ctx.service.sendLog.create({
                            taskId,
                            // recipient: allUserIdArr[j],
                            // recipientEmail: emailArr,
                            state: sendResult
                        });

                        for (const uid of allUserIdArr[j]) {
                            await ctx.service.sendUser.create({
                                log_id: logResult.id,
                                user_id: uid
                            })
                        }

                        resolve();
                    }, 1500)
                })
            }
            await sendEmailDo();
        }

    } catch (error) {
        await ctx.service.mailDelivery.update(taskId, {
            state: '1'
        });
        // await ctx.service.sendLog.create({
        //     taskId,
        //     recipient: targetUser.id,
        //     recipientEmail: targetUser.email,
        //     state: '0'
        // });
    }
}

const sendMailByTimingTask = async (ctx, taskId, emailInfo, sendUserInfo) => {
    if (!_.isEmpty(global['sendMailTimingTask_' + taskId])) {
        global['sendMailTimingTask_' + taskId].cancel();
    }

    global['sendMailTimingTask_' + taskId] = schedule.scheduleJob(emailInfo.timing, async function () {
        if (!_.isEmpty(sendUserInfo)) {
            sendEmailByTask(ctx, taskId, emailInfo, sendUserInfo);
        }
    });
}

// 群发用户邮箱集合
const getSendUserInfo = async (ctx, app, targetType, targetUsers = []) => {

    let skipCount = 20; // 设定批量发送最小单位
    let allUserCount, queryObj = {};
    if (targetType == '0') {
        allUserCount = await ctx.service.user.count();
    } else if (targetType == '1') {
        allUserCount = targetUsers.length;
        queryObj = {
            id: {
                [app.Sequelize.Op.in]: targetUsers
            }
        }
    }

    let sendNum = Math.ceil(allUserCount / skipCount);
    let allUserIdArr = [];
    let allEmailArr = [];
    for (let i = 0; i < sendNum; i++) {

        let unitUser = await ctx.service.user.find({
            isPaging: '0',
            current: i,
            pageSize: skipCount
        }, {
            query: queryObj,
            attributes: ["email"]
        })

        if (!_.isEmpty(unitUser)) {
            let unitEmails = unitUser.map((item) => {
                return item.email;
            })
            let unitIds = unitUser.map((item) => {
                return item.id;
            })
            allEmailArr.push(unitEmails);
            allUserIdArr.push(unitIds);
        }


    }

    return {
        allEmailArr,
        allUserIdArr
    }
}
const doSendEmailTask = async (ctx, app, fields, taskId) => {
    try {
        let targetUsers = fields.targets;
        let sendUserInfo = await getSendUserInfo(ctx, app, fields.targetType, targetUsers)

        if (fields.type == '0') { // 立即发送

            if (!_.isEmpty(sendUserInfo)) {
                sendEmailByTask(ctx, taskId, fields, sendUserInfo);
            }

            // 更新发送状态
            await ctx.service.mailDelivery.update(taskId, {
                state: '2'
            });
        } else if (fields.type == '1') { // 定时发送
            if (!fields.timing) {
                fields.timing = new Date();
            }

            if (!_.isEmpty(sendUserInfo)) {
                sendMailByTimingTask(ctx, taskId, fields, sendUserInfo)
            }

            await ctx.service.mailDelivery.update(taskId, {
                state: '2'
            });
        }
    } catch (error) {
        console.log('email send error', error);
    }
}

let MailDeliveryController = {

    async list(ctx) {

        try {

            let payload = ctx.query;
            let queryObj = {};

            let mailDeliveryList = await ctx.service.mailDelivery.find(payload, {
                query: queryObj
            });

            ctx.helper.renderSuccess(ctx, {
                data: mailDeliveryList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async sendloglist(ctx) {

        try {

            let payload = ctx.query;
            let queryObj = {
                taskId: payload.taskId
            };

            let sendLogList = await ctx.service.sendLog.find(payload, {
                query: queryObj,
                include: ["recipient"],
                sort: [
                    ['created_at', 'desc']
                ]
            });

            ctx.helper.renderSuccess(ctx, {
                data: sendLogList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    },

    async create(ctx, app) {


        try {

            let fields = ctx.request.body || {};
            let sendMailTask;
            const formObj = {
                sender: ctx.session.adminUserInfo.id,
                email_type: fields.email_type,
                state: "0",
                timing: fields.timing,
                comments: fields.comments,
                content: fields.content,
                task_type: fields.task_type,
                targets: fields.targets,
                targetType: fields.targetType,
            }

            ctx.validate(mailDeliveryRule(ctx), formObj);

            sendMailTask = await ctx.service.mailDelivery.create(formObj);


            doSendEmailTask(ctx, app, fields, sendMailTask.id);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

    async getOne(ctx) {

        try {
            let id = ctx.query.id;

            let targetItem = await ctx.service.mailDelivery.item({
                query: {
                    id: id
                },
                include: ["targets"]
            });

            ctx.helper.renderSuccess(ctx, {
                data: targetItem
            });

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }

    },


    async update(ctx) {


        try {

            let fields = ctx.request.body || {};
            const formObj = {
                sender: ctx.session.adminUserInfo.id,
                email_type: fields.email_type,
                timing: fields.timing,
                comments: fields.comments,
                content: fields.content,
                task_type: fields.task_type,
                targets: fields.targets,
                targetType: fields.targetType,
            }

            ctx.validate(mailDeliveryRule(ctx), formObj);

            await ctx.service.mailDelivery.update(fields.id, formObj);

            doSendEmailTask(ctx, fields, fields.id);

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    },


    async removes(ctx) {

        try {
            let targetIds = ctx.query.ids;
            await ctx.service.mailDelivery.removes(targetIds);

            // 删除与该任务相关的发送记录
            await ctx.service.sendLog.removes(targetIds, 'taskId');

            if (!_.isEmpty(global['sendMailTimingTask_' + targetIds])) {
                global['sendMailTimingTask_' + targetIds].cancel();
            }

            ctx.helper.renderSuccess(ctx);

        } catch (err) {
            xxx

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    },

}

module.exports = MailDeliveryController;