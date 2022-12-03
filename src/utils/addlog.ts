import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const addLog = async (rollNo: string, lat: string, long: string) => {
    const db = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: "logDB",
        Item: {
            "logId": uuidv4(),
            "rollNo": rollNo,
            "lat": lat,
            "long": long,
            "timestamp": new Date().toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
        }
    };

    db.put(params, (err, data) => {
        if (err) {
            return new Promise((resolve, reject) => {
                reject(err);
            })
        }
    });
    return new Promise((resolve, reject) => {
        resolve(params.Item as any);
    })
}

export default addLog