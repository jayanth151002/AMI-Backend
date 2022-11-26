import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const getTimestamp = () => {
    const date = new Date();
    const formatData = (input: number) => {
        if (input > 9) {
            return input;
        } else return `0${input}`;
    };
    const format = {
        dd: formatData(date.getDate()),
        mm: formatData(date.getMonth() + 1),
        yyyy: date.getFullYear(),
        HH: formatData(date.getHours()),
        MM: formatData(date.getMinutes()),
        SS: formatData(date.getSeconds()),
    };
    return `${format.dd}/${format.mm}/${format.yyyy} ${format.HH}:${format.MM}:${format.SS}`
}

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

    db.put(params, async (err, data) => {
        if (err) {
            return err
        }
        else return data
    });
}

export default addLog