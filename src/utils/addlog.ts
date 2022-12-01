import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import getTimestamp from './getTimestamp';

const addLog = async (rollNo: string, lat: string, long: string) => {
    const db = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: "logDB",
        Item: {
            "logId": uuidv4(),
            "rollNo": rollNo,
            "lat": lat,
            "long": long,
            "timestamp": getTimestamp()
        }
    };

    try {
        db.put(params);
        return new Promise((resolve, reject) => {
            resolve(params.Item as any);
        })
    }
    catch (err) {
        return new Promise((resolve, reject) => {
            reject(err);
        })
    }
}

export default addLog