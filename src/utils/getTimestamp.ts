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

export default getTimestamp