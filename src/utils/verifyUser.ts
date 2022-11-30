import AWS from 'aws-sdk';
import config from "../../aws.config"

AWS.config.update(config);
const db = new AWS.DynamoDB.DocumentClient();


const verifyUser = async (rollNo: string) => {
    const params = {
        TableName: "userDB",
        Key: {
            "rollNo": rollNo
        }
    };
    return new Promise((resolve, reject) => {
        db.get(params, async (err, data) => {
            if (err || JSON.stringify(data) === '{}') {
                reject(err);
            }
            else {
                resolve(data);
            }
        })
    })
}

export default verifyUser;